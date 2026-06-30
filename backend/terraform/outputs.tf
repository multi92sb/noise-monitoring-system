output "api_gateway_url" {
  description = "The root URL of the REST API Gateway"
  value       = aws_api_gateway_deployment.api_deployment.invoke_url
}

output "dynamodb_table_arn" {
  description = "The Amazon Resource Name of the single table"
  value       = aws_dynamodb_table.single_table.arn
}

output "iot_endpoint" {
  description = "The endpoint address to configure in the ESP32 firmware MQTT clients"
  value       = data.aws_iot_endpoint.iot_endpoint.endpoint_address
}
