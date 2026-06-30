# STEP 13 — SECURITY.md

## Security Architecture (MVP Level)
For an MVP, security must be robust but straightforward. We utilize managed AWS security mechanisms to avoid writing complex custom authorization layers.

## Security Controls

### 1. Device Security
* **TLS Encryption:** All MQTT communication between the ESP32-S3 and AWS IoT Core is encrypted using TLS 1.2.
* **X.509 Device Certificates:** Each device is flashed at birth with a unique private key and device certificate. AWS IoT Core validates these certificates before accepting connections.
* **Secure Provisioning:** Device credentials are pre-generated on AWS and flashed over a wired connection during final hardware assembly. No complex dynamic provisioning protocols are used in V1.

### 2. User & Tenant Authentication
* **AWS Cognito:** Handles login credentials, password hashing, and multifactor authentication (MFA) out of the box.
* **Cognito User Pools:** Organize users into Tenant Group IDs. Custom Lambda authorizers validate the user's tenant membership before exposing dashboard API data.
* **JWT Token Validation:** The React dashboard attaches a JWT token to each REST API request. The backend Lambda parses and verifies the token signature.

### 3. Data Protection
* **Data in Transit:** All dashboard requests, administrative API calls, and telemetry uploads are forced over HTTPS / TLS 1.2.
* **Data at Rest:** Amazon DynamoDB and S3 utilize default AES-256 server-side encryption.
* **OWASP Defaults:** API inputs are strict-validated using Pydantic in Python Lambda handlers to prevent injection and validation exploits.
