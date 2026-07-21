import os
import json
import boto3
import re
from decimal import Decimal
from boto3.dynamodb.conditions import Key

# Initialize DynamoDB client
dynamodb = boto3.resource('dynamodb')
TABLE_NAME = os.environ.get('TABLE_NAME', 'noise_monitoring_mvp')
table = dynamodb.Table(TABLE_NAME)

DEFAULT_ALERT_CONFIG = {
    "alert_enabled": True,
    "db_threshold": 80,
    "alert_duration_minutes": 10,
    "quiet_hours_enabled": False,
    "quiet_hours_start": "22:00",
    "quiet_hours_end": "07:00",
    "quiet_hours_db_threshold": 70,
    "alert_phone": ""
}

TIME_RE = re.compile(r"^([01]\d|2[0-3]):[0-5]\d$")

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
    devices = [normalize_device(item) for item in response.get('Items', [])]
    return build_response(200, devices)

def update_device(org_id, device_id, body):
    """
    Updates the device configuration (friendly name, alert thresholds, alert contacts).
    """
    if not device_id:
        return build_response(400, {"error": "Missing device ID"})

    config_or_error = validate_device_config(body)
    if "error" in config_or_error:
        return build_response(400, {"error": config_or_error["error"]})

    name = body.get('name', 'Living Room Sensor')
    config = config_or_error

    pk = f"ORG#{org_id}"
    sk = f"DEVICE#{device_id}"

    # Use update_item to only set the properties updated by the tenant dashboard
    table.update_item(
        Key={'PK': pk, 'SK': sk},
        UpdateExpression=(
            "SET #n = :name, alert_enabled = :alert_enabled, "
            "db_threshold = :db_threshold, alert_duration_minutes = :duration, "
            "quiet_hours_enabled = :quiet_enabled, quiet_hours_start = :quiet_start, "
            "quiet_hours_end = :quiet_end, quiet_hours_db_threshold = :quiet_threshold, "
            "alert_phone = :phone"
        ),
        ExpressionAttributeNames={'#n': 'name'},
        ExpressionAttributeValues={
            ':name': name,
            ':alert_enabled': config['alert_enabled'],
            ':db_threshold': Decimal(str(config['db_threshold'])),
            ':duration': config['alert_duration_minutes'],
            ':quiet_enabled': config['quiet_hours_enabled'],
            ':quiet_start': config['quiet_hours_start'],
            ':quiet_end': config['quiet_hours_end'],
            ':quiet_threshold': Decimal(str(config['quiet_hours_db_threshold'])),
            ':phone': config['alert_phone']
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

def normalize_device(item):
    """
    Adds alert-tuning defaults to older device records without requiring a table migration.
    """
    normalized = dict(item)
    for key, value in DEFAULT_ALERT_CONFIG.items():
        normalized.setdefault(key, value)

    if "id" not in normalized and isinstance(normalized.get("SK"), str):
        normalized["id"] = normalized["SK"].replace("DEVICE#", "", 1)

    return normalized

def validate_device_config(body):
    """
    Validates and coerces dashboard-owned alert settings.
    """
    try:
        alert_enabled = coerce_bool(body.get('alert_enabled', DEFAULT_ALERT_CONFIG['alert_enabled']))
        db_threshold = coerce_threshold(body.get('db_threshold', DEFAULT_ALERT_CONFIG['db_threshold']), 'db_threshold')
        alert_duration_minutes = int(body.get('alert_duration_minutes', DEFAULT_ALERT_CONFIG['alert_duration_minutes']))
        quiet_hours_enabled = coerce_bool(body.get('quiet_hours_enabled', DEFAULT_ALERT_CONFIG['quiet_hours_enabled']))
        quiet_hours_start = str(body.get('quiet_hours_start', DEFAULT_ALERT_CONFIG['quiet_hours_start']))
        quiet_hours_end = str(body.get('quiet_hours_end', DEFAULT_ALERT_CONFIG['quiet_hours_end']))
        quiet_hours_db_threshold = coerce_threshold(
            body.get('quiet_hours_db_threshold', DEFAULT_ALERT_CONFIG['quiet_hours_db_threshold']),
            'quiet_hours_db_threshold'
        )
    except (TypeError, ValueError) as exc:
        return {"error": str(exc)}

    if alert_duration_minutes < 1 or alert_duration_minutes > 60:
        return {"error": "alert_duration_minutes must be between 1 and 60"}

    if not TIME_RE.match(quiet_hours_start):
        return {"error": "quiet_hours_start must use HH:mm format"}

    if not TIME_RE.match(quiet_hours_end):
        return {"error": "quiet_hours_end must use HH:mm format"}

    return {
        "alert_enabled": alert_enabled,
        "db_threshold": db_threshold,
        "alert_duration_minutes": alert_duration_minutes,
        "quiet_hours_enabled": quiet_hours_enabled,
        "quiet_hours_start": quiet_hours_start,
        "quiet_hours_end": quiet_hours_end,
        "quiet_hours_db_threshold": quiet_hours_db_threshold,
        "alert_phone": str(body.get('alert_phone', DEFAULT_ALERT_CONFIG['alert_phone']))
    }

def coerce_bool(value):
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        lowered = value.lower()
        if lowered in ("true", "1", "yes"):
            return True
        if lowered in ("false", "0", "no"):
            return False
    raise ValueError("boolean alert settings must be true or false")

def coerce_threshold(value, field_name):
    threshold = float(value)
    if threshold < 30 or threshold > 120:
        raise ValueError(f"{field_name} must be between 30 and 120")
    return threshold

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
