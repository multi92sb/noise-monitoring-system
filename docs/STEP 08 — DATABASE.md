# STEP 08 — DATABASE.md

## Database Design (DynamoDB Single Table)
To minimize operational overhead, we use Amazon DynamoDB. The schema uses a Single Table Design to retrieve all tenant, device, and event data in single queries.

```text
Table Name: noise_monitoring_mvp
Billing Mode: Pay-Per-Request (On-Demand)
```

## DynamoDB Key Structure

| Primary Key (PK) | Sort Key (SK) | Attributes | Description |
| :--- | :--- | :--- | :--- |
| `ORG#<OrgID>` | `METADATA` | `name`, `billing_status` | Tenant organization info. |
| `ORG#<OrgID>` | `USER#<UserID>` | `email`, `role`, `created_at` | User account metadata. |
| `ORG#<OrgID>` | `DEVICE#<DeviceID>` | `status`, `name`, `db_threshold`, `alert_phone` | Device settings & thresholds. |
| `DEVICE#<DeviceID>` | `EVENT#<Timestamp>` | `peak_db`, `avg_db`, `duration`, `status` | Sustained noise violations. |
| `DEVICE#<DeviceID>` | `TELEMETRY#<Date>` | `avg_db_array` (24-hour float array) | Compact historical telemetry logs. |

## Query Patterns & GSI

### 1. Retrieve Current Device Status
* **Query:** `PK = ORG#<OrgID>` AND `SK BeginsWith DEVICE#`
* **Result:** List of all noise monitors in a tenant's fleet with active thresholds.

### 2. Fetch Historical Decibel Readings
* **Query:** `PK = DEVICE#<DeviceID>` AND `SK = TELEMETRY#2026-06-30`
* **Result:** A single row containing a compact array of 1,440 data points (one per minute). This avoids DynamoDB query limits and reduces read cost by 99% compared to storing each minute as a separate database row.

### 3. Fetch Alert Events
* **Query:** `PK = DEVICE#<DeviceID>` AND `SK BeginsWith EVENT#`
* **Result:** History of all noise threshold violations.
