# STEP 14 — TESTING.md

## Testing Strategy (MVP Scope)
To ship within 6 months with one engineer, we ignore complex hardware-in-the-loop (HIL) automation and end-to-end integration testing suites. Instead, we write lightweight unit tests for core software algorithms and perform manual hardware validation.

## Automated Testing Suite

### 1. Embedded Firmware Tests (Pytest & PlatformIO)
* Unit test the core A-weighting filter and dB calculation functions using known signal inputs.
* Run tests locally on the developer machine by compiling the DSP core logic under a native C++ compiler (running outside the ESP32 hardware).

### 2. Cloud Service Tests (Pytest)
* Test AWS Lambda functions by passing mock JSON API requests.
* Validate that raw database writes occur correctly and that Cognito auth tokens are correctly parsed.

### 3. Frontend Tests (Vitest)
* Basic unit tests to verify that the chart data parses telemetry arrays correctly.

## Manual Testing Protocol

### 1. Enclosure Sound Transmission Test
* Place the assembled sensor inside the ABS project box.
* Play reference frequency sweeps from a calibrated loudspeaker next to the device.
* Verify that the calculated dBA level matches the reference meter within $\pm 2$ dBA.

### 2. Wi-Fi Reconnection Loop Test
* Boot the device and connect it to a Wi-Fi router.
* Power off the router for 30 minutes, verify the ESP32 logs telemetry to RAM.
* Restore router power, verify the device reconnects and uploads the RAM buffer history without dropping packets.
