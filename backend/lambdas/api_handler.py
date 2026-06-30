import os
import json
import boto3
from decimal import Decimal
from boto3.dynamodb.conditions import Key

# Initialize DynamoDB client
dynamodb = boto3.resource('dynamodb')
TABLE_NAME = os.environ.get('TABLE_NAME', 'noise_monitoring_mvp')
table = dynamodb.Table(TABLE_NAME)

# Helper class to convert DynamoDB Decimal to Python float/int for JSON serialization
class DecimalEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, Decimal):
            return int(o) if o % 1 == 0 else float(o)
        return super(DecimalEncoder, self).default(o)

def lambda_handler(event, context):
    """
    Exposes REST routes for the React Web Dashboard to interact with.
    Authorizes tenants using Cognito JWT claims.
    """
    print(f"API Request Event: {json.dumps(event)}")
    
    path = event.get('path', '')
    http_method = event.get('httpMethod', '')
    headers = event.get('headers', {}) or {}
    query_params = event.get('queryStringParameters', {}) or {}
    path_parameters = event.get('pathParameters', {}) or {}
    
    # Extract Organization (Tenant) ID from Cognito JWT context
    # Falls back to 'default_org' for simple sandboxed developer testing
    request_context = event.get('requestContext', {}) or {}
    authorizer = request_context.get('authorizer', {}) or {}
    claims = authorizer.get('claims', {}) or {}
    org_id = claims.get('custom:org_id') or claims.get('cognito:username') or 'default_org'
    
    print(f"Executing request for Tenant Org: {org_id}")

    try:
        # Route 1: GET /devices
        if path == "/devices" and http_method == "GET":
            return get_devices(org_id)
            
        # Route 2: PUT /devices/{id}
        elif path.startswith("/devices/") and http_method == "PUT":
            device_id = path_parameters.get('id')
            body = json.loads(event.get('body', '{}'))
            return update_device(org_id, device_id, body)
            
        # Route 3: GET /devices/{id}/history
        elif path.endswith("/history") and http_method == "GET":
            device_id = path_parameters.get('id')
            date_str = query_params.get('date', datetime_now_str())
            return get_device_history(device_id, date_str)
            
        # Route 4: GET /devices/{id}/alerts
        elif path.endswith("/alerts") and http_method == "GET":
            device_id = path_parameters.get('id')
            return get_device_alerts(device_id)

        # Catch-All
        return build_response(404, {"error": f"Endpoint not found: {http_method} {path}"})

    except Exception as e:
        print(f"Internal error processing API request: {str(e)}")
        return build_response(500, {"error": "Internal server error"})

# ----------------------------------------------------
# Route Handlers
# ----------------------------------------------------

def get_devices(org_id):
    """
    Retrieves all registered noise monitors for the given tenant organization.
    """
    response = table.query(
        KeyConditionExpression=Key('PK').eq(f"ORG#{org_id}") & Key('SK').begins_with("DEVICE#")
    )
    devices = response.get('Items', [])
    return build_response(200, devices)

def update_device(org_id, device_id, body):
    """
    Updates the device configuration (friendly name, alert thresholds, alert contacts).
    """
    if not device_id:
        return build_response(400, {"error": "Missing device ID"})

    name = body.get('name', 'Living Room Sensor')
    db_threshold = body.get('db_threshold', 80.0)
    alert_phone = body.get('alert_phone', '')

    pk = f"ORG#{org_id}"
    sk = f"DEVICE#{device_id}"

    # Use update_item to only set the properties updated by the tenant dashboard
    table.update_item(
        Key={'PK': pk, 'SK': sk},
        UpdateExpression="SET #n = :name, db_threshold = :thresh, alert_phone = :phone",
        ExpressionAttributeNames={'#n': 'name'},
        ExpressionAttributeValues={
            ':name': name,
            ':thresh': Decimal(str(db_threshold)),
            ':phone': alert_phone
        }
    )
    
    return build_response(200, {"status": "success", "device_id": device_id})

def get_device_history(device_id, date_str):
    """
    Retrieves a single compact array containing 1,440 dBA minutes log.
    """
    if not device_id:
        return build_response(400, {"error": "Missing device ID"})

    pk = f"DEVICE#{device_id}"
    sk = f"TELEMETRY#{date_str}"

    response = table.get_item(Key={'PK': pk, 'SK': sk})
    item = response.get('Item')
    
    if not item:
        # If no telemetry exists yet, return empty arrays to avoid graphing errors
        return build_response(200, {
            "device_id": device_id,
            "date": date_str,
            "avg_db_array": [0.0] * 1440,
            "peak_db_array": [0.0] * 1440
        })

    return build_response(200, {
        "device_id": device_id,
        "date": date_str,
        "avg_db_array": item.get('avg_db_array', [0.0] * 1440),
        "peak_db_array": item.get('peak_db_array', [0.0] * 1440)
    })

def get_device_alerts(device_id):
    """
    Retrieves historical alert logs associated with a single device.
    """
    if not device_id:
        return build_response(400, {"error": "Missing device ID"})

    pk = f"DEVICE#{device_id}"
    
    response = table.query(
        KeyConditionExpression=Key('PK').eq(pk) & Key('SK').begins_with("EVENT#")
    )
    alerts = response.get('Items', [])
    return build_response(200, alerts)

# ----------------------------------------------------
# Utilities
# ----------------------------------------------------

def build_response(status_code, body):
    return {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*", # CORS enabled for local/web dashboard calls
            "Access-Control-Allow-Headers": "Content-Type,Authorization",
            "Access-Control-Allow-Methods": "GET,PUT,POST,OPTIONS"
        },
        "body": json.dumps(body, cls=DecimalEncoder)
    }

def datetime_now_str():
    from datetime import datetime
    return datetime.utcnow().strftime('%Y-%m-%d')
