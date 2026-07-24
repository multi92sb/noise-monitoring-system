import os
import json
import boto3
from datetime import datetime
from decimal import Decimal
from boto3.dynamodb.conditions import Key

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb')
sns = boto3.client('sns')

TABLE_NAME = os.environ.get('TABLE_NAME', 'noise_monitoring_mvp')
table = dynamodb.Table(TABLE_NAME)

def lambda_handler(event, context):
    """
    Receives sustained noise alert triggers from devices, logs the event
    to DynamoDB, and sends SMS/Email alerts using Amazon SNS.
    """
    print(f"Received Noise Alert Event: {json.dumps(event)}")
    
    device_id = event.get('device_id')
    timestamp = event.get('timestamp')
    current_db = float(event.get('current_db', 0.0))
    duration_minutes = int(event.get('duration_minutes', 10))
    threshold_config = float(event.get('threshold_config', 80.0))
    effective_threshold = float(event.get('effective_threshold', threshold_config))
    quiet_hours_active = coerce_bool(event.get('quiet_hours_active', False))
    sound_class = event.get('sound_class', 'unknown')

    if not device_id or not timestamp:
        print("Error: Missing device_id or timestamp in event payload")
        return {"statusCode": 400, "body": "Missing required fields"}

    # 1. Look up device settings and organization ID using GSI
    device_config = lookup_device_config(device_id)
    if not device_config:
        print(f"Warning: Device {device_id} is not registered or linked to any organization.")
        # Proceed with a default alarm setup even if device configuration isn't completed yet
        device_name = "Unregistered Device"
        alert_phone = None
    else:
        device_name = device_config.get('name', 'Noise Sensor')
        alert_phone = device_config.get('alert_phone')

    # 2. Log event to DynamoDB
    # PK = DEVICE#<id>, SK = EVENT#<timestamp>
    event_pk = f"DEVICE#{device_id}"
    event_sk = f"EVENT#{timestamp}"
    
    try:
        table.put_item(
            Item={
                'PK': event_pk,
                'SK': event_sk,
                'device_name': device_name,
                'peak_db': to_decimal(current_db),
                'duration_minutes': duration_minutes,
                'alert_duration_minutes': duration_minutes,
                'threshold_config': to_decimal(threshold_config),
                'effective_threshold': to_decimal(effective_threshold),
                'quiet_hours_active': quiet_hours_active,
                'sound_class': sound_class,
                'timestamp': timestamp,
                'status': 'active'
            }
        )
        print(f"Log event saved for {device_id}")
    except Exception as e:
        print(f"Error logging event to DynamoDB: {str(e)}")

    # 3. Trigger SMS Alert notification via Amazon SNS if a phone number is registered
    if alert_phone:
        message = (
            f"ALERT: Noise Sentinel '{device_name}' detected sustained noise of "
            f"{current_db:.1f} dBA (exceeding your {effective_threshold:.1f} dBA threshold) "
            f"for {duration_minutes} minutes! Sound class: {sound_class}."
        )
        if quiet_hours_active:
            message += " Quiet hours policy was active."
        try:
            sns.publish(
                PhoneNumber=alert_phone,
                Message=message,
                MessageAttributes={
                    'AWS.SNS.SMS.SenderID': {
                        'DataType': 'String',
                        'StringValue': 'NoiseAlert'
                    },
                    'AWS.SNS.SMS.SMSType': {
                        'DataType': 'String',
                        'StringValue': 'Transactional'
                    }
                }
            )
            print(f"SMS alert successfully dispatched to {alert_phone}")
        except Exception as e:
            print(f"Failed to dispatch SMS notification: {str(e)}")
    else:
        print(f"No alert phone number configured for device: {device_id}")

    return {"statusCode": 200, "body": "Alert processed successfully"}

def lookup_device_config(device_id):
    """
    Queries the GSI (where SK is Partition Key and PK is Sort Key)
    to find the device's metadata and organization settings.
    """
    try:
        response = table.query(
            IndexName='DeviceLookupIndex',
            KeyConditionExpression=Key('SK').eq(f"DEVICE#{device_id}")
        )
        items = response.get('Items', [])
        if items:
            return items[0]  # Return the matching device configuration
    except Exception as e:
        print(f"Error querying GSI DeviceLookupIndex: {str(e)}")
    return None

def to_decimal(value):
    return Decimal(str(round(float(value), 1)))

def coerce_bool(value):
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        return value.lower() in ("true", "1", "yes")
    return bool(value)
