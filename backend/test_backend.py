import unittest
import json
import sys
from decimal import Decimal
from unittest.mock import MagicMock, patch

# Mock boto3 before importing lambda handlers
class MockClientError(Exception):
    def __init__(self, response=None):
        self.response = response or {"Error": {"Code": "MockError", "Message": "mock"}}
        super().__init__(self.response["Error"]["Message"])

mock_boto3 = MagicMock()
sys.modules['boto3'] = mock_boto3
sys.modules['boto3.dynamodb.conditions'] = MagicMock()
sys.modules['botocore.exceptions'] = MagicMock(ClientError=MockClientError)

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
        self.assertTrue(body[0]["alert_enabled"])
        self.assertEqual(body[0]["alert_duration_minutes"], 10)
        self.assertEqual(body[0]["quiet_hours_start"], "22:00")

    @patch('backend.lambdas.api_handler.table')
    def test_api_handler_update_device_accepts_alert_tuning(self, mock_table):
        event = {
            "path": "/devices/sn-123",
            "httpMethod": "PUT",
            "pathParameters": {"id": "sn-123"},
            "body": json.dumps({
                "name": "Balcony Node",
                "alert_enabled": True,
                "db_threshold": 76,
                "alert_duration_minutes": 8,
                "quiet_hours_enabled": True,
                "quiet_hours_start": "22:00",
                "quiet_hours_end": "07:00",
                "quiet_hours_db_threshold": 65,
                "alert_phone": "+336123456"
            }),
            "requestContext": {
                "authorizer": {
                    "claims": {"custom:org_id": "default_org"}
                }
            }
        }

        response = api_handler(event, None)

        self.assertEqual(response["statusCode"], 200)
        update_args = mock_table.update_item.call_args.kwargs
        values = update_args["ExpressionAttributeValues"]
        self.assertEqual(values[":duration"], 8)
        self.assertEqual(values[":db_threshold"], Decimal("76.0"))
        self.assertEqual(values[":quiet_threshold"], Decimal("65.0"))
        self.assertTrue(values[":quiet_enabled"])

    @patch('backend.lambdas.api_handler.table')
    def test_api_handler_update_device_rejects_invalid_duration(self, mock_table):
        event = {
            "path": "/devices/sn-123",
            "httpMethod": "PUT",
            "pathParameters": {"id": "sn-123"},
            "body": json.dumps({
                "name": "Balcony Node",
                "db_threshold": 76,
                "alert_duration_minutes": 0,
                "quiet_hours_start": "22:00",
                "quiet_hours_end": "07:00",
                "quiet_hours_db_threshold": 65
            })
        }

        response = api_handler(event, None)

        self.assertEqual(response["statusCode"], 400)
        mock_table.update_item.assert_not_called()

    @patch('backend.lambdas.api_handler.table')
    def test_api_handler_update_device_rejects_invalid_threshold(self, mock_table):
        event = {
            "path": "/devices/sn-123",
            "httpMethod": "PUT",
            "pathParameters": {"id": "sn-123"},
            "body": json.dumps({
                "name": "Balcony Node",
                "db_threshold": 10,
                "alert_duration_minutes": 10,
                "quiet_hours_start": "22:00",
                "quiet_hours_end": "07:00",
                "quiet_hours_db_threshold": 65
            })
        }

        response = api_handler(event, None)

        self.assertEqual(response["statusCode"], 400)
        mock_table.update_item.assert_not_called()

    @patch('backend.lambdas.api_handler.table')
    def test_api_handler_update_device_rejects_invalid_quiet_hour_format(self, mock_table):
        event = {
            "path": "/devices/sn-123",
            "httpMethod": "PUT",
            "pathParameters": {"id": "sn-123"},
            "body": json.dumps({
                "name": "Balcony Node",
                "db_threshold": 76,
                "alert_duration_minutes": 10,
                "quiet_hours_start": "25:00",
                "quiet_hours_end": "07:00",
                "quiet_hours_db_threshold": 65
            })
        }

        response = api_handler(event, None)

        self.assertEqual(response["statusCode"], 400)
        mock_table.update_item.assert_not_called()

    @patch('backend.lambdas.alert_handler.sns')
    @patch('backend.lambdas.alert_handler.table')
    def test_alert_handler_logs_effective_threshold_metadata(self, mock_table, mock_sns):
        mock_table.query.return_value = {
            "Items": [
                {"name": "Balcony Node", "alert_phone": "+336123456"}
            ]
        }
        event = {
            "device_id": "sn-123",
            "timestamp": 1782849520,
            "current_db": 88.5,
            "duration_minutes": 8,
            "threshold_config": 76.0,
            "effective_threshold": 65.0,
            "quiet_hours_active": True
        }

        response = alert_handler(event, None)

        self.assertEqual(response["statusCode"], 200)
        item = mock_table.put_item.call_args.kwargs["Item"]
        self.assertEqual(item["alert_duration_minutes"], 8)
        self.assertEqual(item["effective_threshold"], Decimal("65.0"))
        self.assertTrue(item["quiet_hours_active"])
        mock_sns.publish.assert_called_once()

    @patch('backend.lambdas.alert_handler.sns')
    @patch('backend.lambdas.alert_handler.table')
    def test_alert_handler_defaults_sound_class_to_unknown(self, mock_table, mock_sns):
        """When the device payload omits sound_class, the stored Noise Event defaults to 'unknown'."""
        mock_table.query.return_value = {
            "Items": [
                {"name": "Balcony Node", "alert_phone": "+336123456"}
            ]
        }
        event = {
            "device_id": "sn-123",
            "timestamp": 1782849520,
            "current_db": 88.5,
            "duration_minutes": 8,
            "threshold_config": 76.0,
            "effective_threshold": 65.0,
            "quiet_hours_active": True
        }

        response = alert_handler(event, None)

        self.assertEqual(response["statusCode"], 200)
        item = mock_table.put_item.call_args.kwargs["Item"]
        self.assertEqual(item["sound_class"], "unknown")

    @patch('backend.lambdas.alert_handler.sns')
    @patch('backend.lambdas.alert_handler.table')
    def test_alert_handler_preserves_sound_class_from_payload(self, mock_table, mock_sns):
        """When the device payload includes a sound_class, it is stored on the Noise Event."""
        mock_table.query.return_value = {
            "Items": [
                {"name": "Balcony Node", "alert_phone": "+336123456"}
            ]
        }
        event = {
            "device_id": "sn-123",
            "timestamp": 1782849520,
            "current_db": 88.5,
            "duration_minutes": 8,
            "threshold_config": 76.0,
            "effective_threshold": 65.0,
            "quiet_hours_active": True,
            "sound_class": "crate_banging"
        }

        response = alert_handler(event, None)

        self.assertEqual(response["statusCode"], 200)
        item = mock_table.put_item.call_args.kwargs["Item"]
        self.assertEqual(item["sound_class"], "crate_banging")

    @patch('backend.lambdas.alert_handler.sns')
    @patch('backend.lambdas.alert_handler.table')
    def test_alert_handler_sms_includes_sound_class(self, mock_table, mock_sns):
        """The SMS alert message includes the Sound Class label (US-10)."""
        mock_table.query.return_value = {
            "Items": [
                {"name": "Balcony Node", "alert_phone": "+336123456"}
            ]
        }
        event = {
            "device_id": "sn-123",
            "timestamp": 1782849520,
            "current_db": 88.5,
            "duration_minutes": 8,
            "threshold_config": 76.0,
            "effective_threshold": 65.0,
            "quiet_hours_active": True,
            "sound_class": "crate_banging"
        }

        alert_handler(event, None)

        sms_message = mock_sns.publish.call_args.kwargs["Message"]
        self.assertIn("crate_banging", sms_message)

    @patch('backend.lambdas.api_handler.table')
    def test_api_handler_get_alerts_returns_sound_class(self, mock_table):
        """get_device_alerts returns items with sound_class, defaulting to 'unknown' for legacy records."""
        mock_table.query.return_value = {
            "Items": [
                {
                    "PK": "DEVICE#sn-123",
                    "SK": "EVENT#1782849520",
                    "peak_db": Decimal("88.5"),
                    "duration_minutes": 8,
                    "threshold_config": Decimal("76.0"),
                    "sound_class": "talking"
                },
                {
                    "PK": "DEVICE#sn-123",
                    "SK": "EVENT#1782848000",
                    "peak_db": Decimal("82.0"),
                    "duration_minutes": 10,
                    "threshold_config": Decimal("80.0")
                }
            ]
        }

        event = {
            "path": "/devices/sn-123/alerts",
            "httpMethod": "GET",
            "pathParameters": {"id": "sn-123"},
            "requestContext": {
                "authorizer": {
                    "claims": {"custom:org_id": "default_org"}
                }
            }
        }

        response = api_handler(event, None)
        self.assertEqual(response["statusCode"], 200)
        alerts = json.loads(response["body"])
        self.assertEqual(len(alerts), 2)
        self.assertEqual(alerts[0]["sound_class"], "talking")
        self.assertEqual(alerts[1]["sound_class"], "unknown")

if __name__ == "__main__":
    unittest.main()
