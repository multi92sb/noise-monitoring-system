# STEP 20 — ARCHITECTURE_REVIEW.md

## Startup CTO Critique: Over-Engineering vs. Business Reality
This document reviews the original project requirements (dual-processor Raspberry Pi + ESP32, H.264/H.265 video capture, local audio warning speaker systems, edge AI classifiers, and native mobile apps) and establishes why the current audio-only serverless MVP is the correct architectural choice for a startup with one engineer and a €5,000 budget.

## Critique of the Original Architecture

### 1. Dual-Processor Complexity (RPi CM5 + ESP32-S3)
* **The Critique:** Forcing a single engineer to write, debug, and coordinate code across two different processors, operating systems, and development ecosystems (ESP-IDF C++ and Linux Python) would double the development cycle.
* **The Redesign:** Use the ESP32-S3 exclusively. It contains dual-core Tensilica CPUs running at 240MHz and a hardware floating-point unit (FPU), which provides ample capacity to calculate RMS dBA, run I2S audio captures, manage Wi-Fi handshakes, and publish MQTT messages on a single, low-cost microcontroller.

### 2. Video Capture and Audio Warning System
* **The Critique:** Adding video buffers, encoding pipelines, and speakers increases our hardware BOM cost from €18 to €95+. More importantly, it requires custom PCB layouts to integrate audio amplifiers and camera connectors. 
* **The Redesign:** Remove video and audio playback entirely. By focusing on dBA tracking, we can buy off-the-shelf development boards and wire them directly in an off-the-shelf plastic box. This allows us to validate the business idea using inexpensive €18 units.

### 3. Native iOS & Android Mobile Apps
* **The Critique:** Developing native mobile apps and getting store approvals takes significant time. Store deployment delays are a huge risk for a fast-moving startup.
* **The Redesign:** Build the React Vite dashboard to be fully responsive using TailwindCSS, packaged as a Progressive Web App (PWA). Users can pin the page to their smartphone home screens. This provides a mobile dashboard experience instantly, with 0% of the native app store friction.

## Conclusion
The audio-only, serverless ESP32-S3 MVP is the only architecture that guarantees shipping within 6 months. It minimizes inventory cost, circumvents complex FCC/CE certifications, avoids privacy legal liability, and provides a clear path to early revenue.
