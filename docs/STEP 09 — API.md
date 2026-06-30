# STEP 09 — API.md

## REST API Design (REST API via API Gateway)
The API is exposed via AWS API Gateway and handled by a Python Lambda function. All client dashboard requests must include a valid JWT token in the `Authorization` header.

## Endpoint Definitions

### 1. Authentication
* `POST /api/auth/login`
  * **Description:** User log in.
  * **Payload:** `{ "email": "user@org.com", "password": "..." }`
  * **Response:** `{ "token": "JWT_TOKEN", "expires_in": 3600 }`

### 2. Device Management
* `GET /api/devices`
  * **Description:** Retrieve all devices linked to the tenant's organization.
  * **Response:** `[ { "id": "sn-94a2c", "name": "Living Room 1", "status": "online", "db_threshold": 80 } ]`
* `PUT /api/devices/{id}`
  * **Description:** Update device friendly name or decibel threshold settings.
  * **Payload:** `{ "name": "Balcony Node", "db_threshold": 85, "alert_phone": "+336123456" }`

### 3. Telemetry & Analytics
* `GET /api/devices/{id}/history?date=YYYY-MM-DD`
  * **Description:** Retrieves 1-minute interval dBA readings for chart plotting.
  * **Response:** `{ "device_id": "sn-94a2c", "date": "2026-06-30", "telemetry": [55.2, 54.1, 88.3, ... 1440 points] }`

### 4. Alert Management
* `GET /api/devices/{id}/alerts`
  * **Description:** Retrieves historical noise alert events.
  * **Response:** `[ { "id": "event-1", "timestamp": 1782848920, "peak_db": 92.1, "duration_minutes": 15 } ]`

## Rate Limiting & Safety
* **Gateway Throttling:** API Gateway is configured with a rate limit of **100 requests per second (RPS)** per tenant IP. This prevents denial of service and controls Lambda run costs under DDoS attempts.
