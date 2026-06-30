# STEP 17 — DEPLOYMENT.md

## Deployment Architecture
The entire cloud infrastructure is deployed in a single region (e.g., `eu-west-1` for Europe or `us-east-1` for US) using a declarative infrastructure-as-code (IaC) configuration.

## Deployment Target Environments

### 1. Staging Environment
* Exists inside the same AWS account using a prefix naming strategy (e.g., `staging-noise-api`).
* Used by the developer to validate backend changes before deploying to production.
* API Gateway endpoints are private or restricted to the developer's IP address.

### 2. Production Environment
* The customer-facing dashboard API (e.g., `api.noisesentinel.com`) and front-end static files.
* Configured with AWS WAF (Web Application Firewall) to block suspicious request flows.

## Backup & Disaster Recovery (DR)

### 1. Database Backups
* **Amazon DynamoDB Point-in-Time Recovery (PITR):** Enabled on our main table. This allows us to restore the database to any state down to the second in case of database corruption or logic errors.
* Baseline cost of PITR is extremely low (a few cents per GB of storage).

### 2. Frontend Assets
* React dashboard static builds are stored in a versioned S3 bucket, allowing quick rollbacks to the last stable deployment.
