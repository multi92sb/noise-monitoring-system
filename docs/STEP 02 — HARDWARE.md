# STEP 02 — HARDWARE.md

## Hardware Specifications
To fit our €5,000 budget and minimize time-to-market, the MVP uses 100% Commercial Off-The-Shelf (COTS) components. This avoids custom PCB layout cycles and regulatory certification hurdles for initial testing.

| Component | Specification | Estimated Cost (EUR) | Purpose |
| :--- | :--- | :--- | :--- |
| **Microcontroller** | ESP32-S3-WROOM-1 DevKitC (8MB Flash, 2MB PSRAM) | €6.00 | Core computation, Wi-Fi connectivity, I2S interfacing. |
| **Microphone** | SPH0645LM4H Omnidirectional Microphone Module | €8.00 | Digital sound capture (avoids analog noise). |
| **Power Supply** | 5V 1A USB-A Power Adapter + Micro-USB Cable | €5.00 | Mains power source. |
| **Enclosure** | IP55 ABS Plastic Electrical Junction Box | €3.00 | Protects electronics, provides pre-drilled look. |
| **Misc** | Connecting wires, hot glue, mounting tape | €1.00 | Mechanical assembly. |
| **Total BOM** | | **€23.00** | Cost per device at low volume. |

## Wiring Diagram (I2S Connection)

```text
SPH0645LM4H Microphone         ESP32-S3 DevKit
------------------         ----------------
VDD ---------------------> 3.3V
GND ---------------------> GND
L/R ---------------------> GND (Left Channel)
WS  ---------------------> GPIO 15 (I2S Word Select)
SCK ---------------------> GPIO 14 (I2S Serial Clock)
SD  ---------------------> GPIO 16 (I2S Serial Data)
```

## Manufacturing & Assembly Workflow
1. Solder a 6-wire ribbon cable directly from the SPH0645LM4H module to the ESP32-S3 DevKit GPIO pins (eliminating connectors to prevent vibration disconnects).
2. Drill a 2mm acoustic port hole at the bottom of the ABS project box.
3. Glue the microphone module directly over the hole using hot glue (ensuring no glue blocks the sound port).
4. Secure the ESP32-S3 board inside the box using double-sided mounting tape.
5. Thread the Micro-USB power cable through a rubber grommet on the side of the box and connect it to the ESP32 board.
6. Seal the enclosure. Total assembly time: ~15 minutes per unit.