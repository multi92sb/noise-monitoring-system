# STEP 10 — DEVICE_PROTOCOL.md

## Device Communication Protocol
The communication between the ESP32-S3 sensor and AWS IoT Core utilizes MQTT (Message Queuing Telemetry Transport) over TLS (port 8883) to ensure low bandwidth overhead and data security.

## Payload Schemas

### 1. Periodic Telemetry (Topic: `devices/<device_id>/telemetry`)
* Published once per minute. Contains aggregated dBA statistics over the last 60 seconds.
* **Payload:**
  ```json
  {
    "timestamp": 1782848920,
    "avg_db": 62.4,
    "peak_db": 84.1
  }
  ```

### 2. Immediate Alert Event (Topic: `devices/<device_id>/alert`)
* Published immediately when a threshold violation has been sustained for more than 10 minutes.
* **Payload:**
  ```json
  {
    "timestamp": 1782849520,
    "current_db": 88.5,
    "duration_minutes": 10,
    "threshold_config": 80.0
  }
  ```

### 3. Device Configuration Shadow (Topic: `$aws/things/<device_id>/shadow/update`)
* Relies on AWS IoT device shadows to update threshold levels and metadata over-the-air.
* **Payload:**
  ```json
  {
    "state": {
      "desired": {
        "db_threshold": 80.0,
        "calibration_offset": 3.2
      }
    }
  }
  ```

## Connection Recovery & Offline Buffer
* **MQTT Keep-Alive:** Set to 60 seconds.
* **Reconnection Strategy:** Exponential backoff (start at 2 seconds, double on failure, capped at 15 minutes) to avoid flooding AWS IoT Core.
* **RAM Circular Telemetry:** If Wi-Fi is lost, the ESP32 stores up to 60 minutes of JSON records in memory. Upon recovery, these are sent sequentially. If offline time exceeds 60 minutes, older telemetry data is dropped to prevent memory exhaustion.
