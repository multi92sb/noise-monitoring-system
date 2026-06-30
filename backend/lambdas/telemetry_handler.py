import os
import json
import boto3
from datetime import datetime
from botocore.exceptions import ClientError

# Initialize DynamoDB client
dynamodb = boto3.resource('dynamodb')
TABLE_NAME = os.environ.get('TABLE_NAME', 'noise_monitoring_mvp')
table = dynamodb.Table(TABLE_NAME)

def lambda_handler(event, context):
    """
    Receives periodic telemetry from IoT Core and writes it to DynamoDB
    using a compact daily array structure to save costs.
    """
    print(f"Received IoT Telemetry Event: {json.dumps(event)}")
    
    device_id = event.get('device_id')
    timestamp = event.get('timestamp')
    avg_db = float(event.get('avg_db', 0.0))
    peak_db = float(event.get('peak_db', 0.0))
    
    if not device_id or not timestamp:
        print("Error: Missing required fields (device_id, timestamp)")
        return {"statusCode": 400, "body": "Missing required fields"}

    # Convert timestamp to UTC date and calculate array index (0-1439)
    dt = datetime.utcfromtimestamp(timestamp)
    date_str = dt.strftime('%Y-%m-%d')
    minute_index = (dt.hour * 60) + dt.minute

    if minute_index < 0 or minute_index >= 1440:
        print(f"Error: Invalid minute index calculated: {minute_index}")
        return {"statusCode": 400, "body": "Invalid timestamp"}

    pk = f"DEVICE#{device_id}"
    sk = f"TELEMETRY#{date_str}"

    # Try updating the list element directly to avoid read-before-write costs
    try:
        table.update_item(
            Key={'PK': pk, 'SK': sk},
            UpdateExpression=f"SET avg_db_array[{minute_index}] = :avg_val, peak_db_array[{minute_index}] = :peak_val",
            ExpressionAttributeValues={
                ':avg_val': int(avg_db * 10) / 10.0, # round to 1 decimal place
                ':peak_val': int(peak_db * 10) / 10.0
            }
        )
        print(f"Successfully updated telemetry index {minute_index} for {pk}/{sk}")
    except ClientError as e:
        # If the item or list doesn't exist, we must initialize it
        if e.response['Error']['Code'] == 'ValidationException':
            print(f"Item does not exist yet. Initializing new daily arrays for {pk}/{sk}...")
            initialize_daily_arrays(pk, sk, minute_index, avg_db, peak_db)
        else:
            print(f"DynamoDB ClientError: {e.response['Error']['Message']}")
            raise e

    return {"statusCode": 200, "body": "Telemetry logged successfully"}

def initialize_daily_arrays(pk, sk, index, avg_val, peak_val):
    # Initialize arrays with 1,440 elements of 0.0
    avg_array = [0.0] * 1440
    peak_array = [0.0] * 1440
    
    # Set the value at the current index
    avg_array[index] = round(avg_val, 1)
    peak_array[index] = round(peak_val, 1)

    try:
        table.put_item(
            Item={
                'PK': pk,
                'SK': sk,
                'avg_db_array': avg_array,
                'peak_db_array': peak_array,
                'last_updated': int(datetime.utcnow().timestamp())
            }
        )
        print(f"Successfully initialized daily telemetry record for {pk}/{sk}")
    except Exception as e:
        print(f"Error initializing daily telemetry record: {str(e)}")
        raise e
