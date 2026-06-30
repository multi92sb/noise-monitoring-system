# Noise Monitoring System (MVP)

A lean, privacy-first, serverless environmental noise monitoring system designed to track dBA levels and alert property owners (e.g., Airbnb hosts, property managers) of sustained noise violations.

This monorepo contains the hardware firmware, AWS cloud infrastructure, and the web visualization dashboard.

---

## Repository Structure

```text
noise-monitoring-system/
├── .ai/                     # AI Agent configuration guidelines
├── docs/                    # Complete product specifications and design steps (00 to 20)
├── firmware/                # ESP32-S3 firmware application (PlatformIO / Arduino)
├── backend/                 # Serverless AWS Lambda handlers and Terraform IaC definitions
└── dashboard/               # React Vite Tailwind PWA dashboard
```

---

## Get Started

### 1. Firmware Setup (ESP32-S3)
The firmware requires the **PlatformIO Core CLI** or the **VS Code PlatformIO extension** to compile.

#### If you saw `pio: command not found`:
1. **Option A (Recommended):** Install the **PlatformIO IDE** extension inside Visual Studio Code. It automatically manages the `pio` CLI binary inside your workspace.
2. **Option B (Command Line):** Install PlatformIO Core using Python:
   ```bash
   pip install platformio
   ```
   *Make sure python scripts are added to your system PATH.*

#### Build & Flash:
Once `pio` is installed, you can build and flash the code:
```bash
cd firmware
pio run         # Build the firmware binaries
pio run -t upload  # Flash to the connected ESP32-S3 over USB
```
*Note: Set `SIMULATE_AUDIO` to `1` in `main.cpp` if you want to test the system logs without a physical SPH0645LM4H microphone connected.*

---

### 2. Dashboard Sandbox (React PWA)
You can run the web dashboard locally in under a minute without needing any active AWS cloud resources. It falls back to a locally persistent sandbox mode using `localStorage`.

```bash
cd dashboard
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser. You can modify threshold values, rename devices, and observe real-time dBA graphs refresh immediately.

---

### 3. Cloud Backend (AWS Serverless)
The backend is provisioned automatically using Terraform.

```bash
cd backend/terraform
terraform init
terraform plan
terraform apply
```
*Make sure you have your AWS CLI configured with admin permissions before running.*
Once deployed, copy the output API Gateway URL and set it as `VITE_API_URL` in the dashboard `.env` configurations to connect your web app to real database records.
