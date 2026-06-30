variable "aws_region" {
  description = "AWS region to deploy resources into"
  type        = string
  default     = "eu-west-1"
}

variable "project_name" {
  description = "Project name tag"
  type        = string
  default     = "noise-monitoring-mvp"
}

variable "environment" {
  description = "Target execution environment"
  type        = string
  default     = "production"
}

variable "dynamodb_table_name" {
  description = "The name of the single DynamoDB table"
  type        = string
  default     = "noise_monitoring_mvp"
}
