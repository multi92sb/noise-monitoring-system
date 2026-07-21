terraform {
  required_version = ">= 1.0.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.4"
    }
  }
}

provider "aws" {
  region = var.aws_region
  default_tags {
    tags = {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}

# ----------------------------------------------------
# 1. DynamoDB Single Table Storage
# ----------------------------------------------------
resource "aws_dynamodb_table" "single_table" {
  name         = var.dynamodb_table_name
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "PK"
  range_key    = "SK"

  attribute {
    name = "PK"
    type = "S"
  }

  attribute {
    name = "SK"
    type = "S"
  }

  # Global Secondary Index for Device settings lookup: SK maps to DEVICE#<id>
  global_secondary_index {
    name            = "DeviceLookupIndex"
    hash_key        = "SK"
    range_key       = "PK"
    projection_type = "ALL"
  }
}

# ----------------------------------------------------
# 2. Archive Python Lambda Functions
# ----------------------------------------------------
data "archive_file" "telemetry_zip" {
  type        = "zip"
  source_file = "${path.module}/../lambdas/telemetry_handler.py"
  output_path = "${path.module}/../lambdas/telemetry_handler.zip"
}

data "archive_file" "alert_zip" {
  type        = "zip"
  source_file = "${path.module}/../lambdas/alert_handler.py"
  output_path = "${path.module}/../lambdas/alert_handler.zip"
}

data "archive_file" "api_zip" {
  type        = "zip"
  source_file = "${path.module}/../lambdas/api_handler.py"
  output_path = "${path.module}/../lambdas/api_handler.zip"
}

# ----------------------------------------------------
# 3. IAM Execution Roles for Lambdas
# ----------------------------------------------------
resource "aws_iam_role" "lambda_role" {
  name = "${var.project_name}-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
    }]
  })
}

resource "aws_iam_policy" "lambda_policy" {
  name = "${var.project_name}-lambda-policy"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "dynamodb:PutItem",
          "dynamodb:GetItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Query",
          "dynamodb:Scan"
        ]
        Effect   = "Allow"
        Resource = [
          aws_dynamodb_table.single_table.arn,
          "${aws_dynamodb_table.single_table.arn}/index/*"
        ]
      },
      {
        Action = [
          "sns:Publish"
        ]
        Effect   = "Allow"
        Resource = "*"
      },
      {
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Effect   = "Allow"
        Resource = "arn:aws:logs:*:*:*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_logs" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = aws_iam_policy.lambda_policy.arn
}

# ----------------------------------------------------
# 4. Lambda Function Declarations
# ----------------------------------------------------
resource "aws_lambda_function" "telemetry_handler" {
  filename         = data.archive_file.telemetry_zip.output_path
  function_name    = "${var.project_name}-telemetry"
  role             = aws_iam_role.lambda_role.arn
  handler          = "telemetry_handler.lambda_handler"
  runtime          = "python3.13"
  source_code_hash = data.archive_file.telemetry_zip.output_base64sha256

  environment {
    variables = {
      TABLE_NAME = aws_dynamodb_table.single_table.name
    }
  }
}

resource "aws_lambda_function" "alert_handler" {
  filename         = data.archive_file.alert_zip.output_path
  function_name    = "${var.project_name}-alert"
  role             = aws_iam_role.lambda_role.arn
  handler          = "alert_handler.lambda_handler"
  runtime          = "python3.13"
  source_code_hash = data.archive_file.alert_zip.output_base64sha256

  environment {
    variables = {
      TABLE_NAME = aws_dynamodb_table.single_table.name
    }
  }
}

resource "aws_lambda_function" "api_handler" {
  filename         = data.archive_file.api_zip.output_path
  function_name    = "${var.project_name}-api"
  role             = aws_iam_role.lambda_role.arn
  handler          = "api_handler.lambda_handler"
  runtime          = "python3.13"
  source_code_hash = data.archive_file.api_zip.output_base64sha256

  environment {
    variables = {
      TABLE_NAME = aws_dynamodb_table.single_table.name
    }
  }
}

# ----------------------------------------------------
# 5. AWS IoT Core Topic Routing Rule
# ----------------------------------------------------
resource "aws_iot_topic_rule" "telemetry_ingest" {
  name        = "noise_telemetry_ingest_rule"
  description = "Routes noise sensor telemetry logs directly to ingestion lambda"
  enabled     = true
  sql         = "SELECT *, topic(2) as device_id FROM 'devices/+/telemetry'"
  sql_version = "2016-03-23"

  lambda {
    function_arn = aws_lambda_function.telemetry_handler.arn
  }
}

resource "aws_iot_topic_rule" "alert_ingest" {
  name        = "noise_alert_ingest_rule"
  description = "Routes sustained noise alert events to alert lambda"
  enabled     = true
  sql         = "SELECT *, topic(2) as device_id FROM 'devices/+/alert'"
  sql_version = "2016-03-23"

  lambda {
    function_arn = aws_lambda_function.alert_handler.arn
  }
}

# Grant IoT Core permission to invoke telemetry Lambda
resource "aws_lambda_permission" "iot_telemetry_permission" {
  statement_id  = "AllowExecutionFromIoT"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.telemetry_handler.function_name
  principal     = "iot.amazonaws.com"
  source_arn    = "arn:aws:iot:${var.aws_region}:${data.aws_caller_identity.current.account_id}:rule/${aws_iot_topic_rule.telemetry_ingest.name}"
}

resource "aws_lambda_permission" "iot_alert_permission" {
  statement_id  = "AllowAlertExecutionFromIoT"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.alert_handler.function_name
  principal     = "iot.amazonaws.com"
  source_arn    = "arn:aws:iot:${var.aws_region}:${data.aws_caller_identity.current.account_id}:rule/${aws_iot_topic_rule.alert_ingest.name}"
}

# ----------------------------------------------------
# 6. AWS API Gateway Configuration (REST endpoints)
# ----------------------------------------------------
resource "aws_api_gateway_rest_api" "api" {
  name        = "${var.project_name}-rest-api"
  description = "API Gateway endpoint routing to Cognito-authenticated dashboard handler Lambda"
}

# Proxy resource maps all sub-resources (e.g. /devices, /devices/{id}/history)
resource "aws_api_gateway_resource" "proxy" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  parent_id   = aws_api_gateway_rest_api.api.root_resource_id
  path_part   = "{proxy+}"
}

resource "aws_api_gateway_method" "proxy_any" {
  rest_api_id   = aws_api_gateway_rest_api.api.id
  resource_id   = aws_api_gateway_resource.proxy.id
  http_method   = "ANY"
  authorization = "NONE" # Cognito integration can be mapped here in future
}

resource "aws_api_gateway_integration" "lambda_integration" {
  rest_api_id             = aws_api_gateway_rest_api.api.id
  resource_id             = aws_api_gateway_resource.proxy.id
  http_method             = aws_api_gateway_method.proxy_any.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.api_handler.invoke_arn
}

resource "aws_api_gateway_deployment" "api_deployment" {
  depends_on  = [aws_api_gateway_integration.lambda_integration]
  rest_api_id = aws_api_gateway_rest_api.api.id
  stage_name  = var.environment
}

resource "aws_lambda_permission" "apigw_lambda_permission" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.api_handler.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.api.execution_arn}/*/*/*"
}

# ----------------------------------------------------
# Data Sources
# ----------------------------------------------------
data "aws_caller_identity" "current" {}

data "aws_iot_endpoint" "iot_endpoint" {
  endpoint_type = "iot:Data-ATS"
}
