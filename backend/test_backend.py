import unittest
import json
from unittest.mock import MagicMock, patch

# Mock boto3 before importing lambda handlers
import sys
mock_boto3 = MagicMock()
sys.modules['boto3'] = mock_boto3
sys.modules['boto3.dynamodb.conditions'] = MagicMock()

# Import the Lambda handlers
from backend.lambdas.telemetry_handler import lambda_handler as telemetry_handler
from backend.lambdas.alert_handler import lambda_handler as alert_handler
from backend.lambdas.api_handler import lambda_handler as api_handler

class TestBackendLambdas(unittest.TestCase):

    def test_telemetry_handler_missing_fields(self):
        # Trigger event missing required device_id
        event = {"timestamp": 1782848920, "avg_db": 60.5}
        response = telemetry_handler(event, None)
        self.assertEqual(response["statusCode"], 400)
        self.assertIn("Missing required fields", response["body"])

    def test_alert_handler_missing_fields(self):
        # Trigger event missing timestamp
        event = {"device_id": "sn-12345", "current_db": 85.0}
        response = alert_handler(event, None)
        self.assertEqual(response["statusCode"], 400)

    @patch('backend.lambdas.api_handler.table')
    def test_api_handler_get_devices(self, mock_table):
        # Mock DynamoDB response for querying devices
        mock_table.query.return_value = {
            "Items": [
                {"PK": "ORG#default_org", "SK": "DEVICE#sn-123", "name": "Test Node"}
            ]
        }
        
        event = {
            "path": "/devices",
            "httpMethod": "GET",
            "requestContext": {
                "authorizer": {
                    "claims": {"custom:org_id": "default_org"}
                }
            }
        }
        
        response = api_handler(event, None)
        self.assertEqual(response["statusCode"], 200)
        body = json.loads(response["body"])
        self.assertEqual(len(body), 1)
        self.assertEqual(body[0]["name"], "Test Node")

if __name__ == "__main__":
    unittest.main()
