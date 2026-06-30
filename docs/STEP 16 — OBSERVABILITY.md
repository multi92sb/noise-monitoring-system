# STEP 16 — OBSERVABILITY.md

## Observability Strategy (Zero-Cost Setup)
To avoid complex Grafana or Datadog licensing costs, we rely entirely on AWS native monitoring features.

## Monitoring Metrics

### 1. Device Telemetry Alerts
* An AWS IoT Rule monitors device connections and publishes updates to a DynamoDB field.
* **Offline Alert:** An AWS EventBridge cron rule runs every 5 minutes. If a device has not written telemetry in the last 10 minutes, the database flags the device status as `offline` and sends a warning email to the property manager ("Device offline - check power connection").

### 2. Lambda Application Metrics
* **Error Rate:** We monitor execution errors in AWS Lambda.
* **Duration:** Alerts are configured on API Gateway timeouts (response latency > 3 seconds).
* **Cost Alarms:** An AWS Budget alarm triggers a notification if our total monthly cloud infrastructure bill exceeds €15.

### 3. Log Aggregation
* **Structured Logs:** All Lambda outputs are written as JSON formats.
* **AWS CloudWatch Logs:** Serves as the central repository for database queries, errors, and system warnings. Logs older than 7 days are automatically expired to minimize storage billing.
