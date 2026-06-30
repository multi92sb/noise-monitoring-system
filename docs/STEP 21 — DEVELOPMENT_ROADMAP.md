# STEP 97 — DEVELOPMENT_ROADMAP.md

# Development Roadmap

## Purpose

This roadmap defines the implementation order for the MVP.

The goal is to ship the first commercial version as quickly as possible while maintaining a clean and scalable architecture.

Development is organized into milestones and two-week sprints.

---

# Phase 0 — Planning

Estimated Duration: 1 Week

Goal:

Prepare the project for development.

Tasks:

- Finalize architecture
- Finalize hardware
- Create Git repositories
- Configure CI/CD
- Create project documentation
- Setup coding standards
- Setup issue tracking

Deliverables:

- Approved architecture
- Development environment
- Product backlog

---

# Phase 1 — Hardware Prototype

Estimated Duration: 2 Weeks

Goal:

Build the first working prototype.

Tasks:

- Purchase components
- Assemble ESP32
- Connect SPH0645LM4H
- Test power supply
- Test Wi-Fi
- Build enclosure

Deliverables:

- Working hardware prototype

Success Criteria:

Device powers on and connects successfully.

---

# Phase 2 — Firmware Foundation

Estimated Duration: 2 Weeks

Goal:

Create the firmware foundation.

Tasks:

- Project structure
- Logging
- Configuration
- Wi-Fi Manager
- Captive Portal
- NVS Storage
- Device Registration

Deliverables:

- Device connects to Wi-Fi
- Configuration persists after reboot

---

# Phase 3 — Audio Engine

Estimated Duration: 2 Weeks

Goal:

Measure environmental noise.

Tasks:

- I2S Driver
- Audio Sampling
- RMS Calculation
- A-Weighting
- Calibration
- Threshold Detection

Deliverables:

- Accurate dBA calculation

Success Criteria:

Measurements remain stable during testing.

---

# Phase 4 — Cloud Backend

Estimated Duration: 2 Weeks

Goal:

Receive telemetry from devices.

Tasks:

- REST API
- Authentication
- Device Registration
- Database
- Event Storage
- Validation

Deliverables:

- Events stored successfully

---

# Phase 5 — Dashboard

Estimated Duration: 2 Weeks

Goal:

Visualize device data.

Tasks:

- Login
- Device List
- Event List
- Charts
- Settings

Deliverables:

- Working dashboard

---

# Phase 6 — Notifications

Estimated Duration: 1 Week

Goal:

Notify customers about excessive noise.

Tasks:

- Email Templates
- Alert Service
- Notification Settings

Deliverables:

- Email alerts

---

# Phase 7 — Pilot Testing

Estimated Duration: 2 Weeks

Goal:

Install devices in real environments.

Tasks:

- Install prototype
- Collect measurements
- Compare with reference meter
- Improve calibration
- Fix bugs

Deliverables:

- Stable field deployment

---

# Phase 8 — MVP Release

Estimated Duration: 1 Week

Goal:

Release Version 1.0

Tasks:

- Final testing
- Documentation
- Packaging
- Deployment
- Release Notes

Deliverables:

- MVP released

---

# Total Timeline

| Phase | Duration |
|---------|----------|
| Planning | 1 Week |
| Hardware | 2 Weeks |
| Firmware | 2 Weeks |
| Audio Engine | 2 Weeks |
| Backend | 2 Weeks |
| Dashboard | 2 Weeks |
| Notifications | 1 Week |
| Pilot | 2 Weeks |
| Release | 1 Week |

**Total Estimated Duration: 15 Weeks**

---

# MVP Deliverables

Hardware

- ESP32-S3
- SPH0645LM4H
- Plastic enclosure

Firmware

- Wi-Fi Setup
- Audio Sampling
- dBA Calculation
- Threshold Detection
- HTTPS Communication

Backend

- Device Registration
- Event Storage
- Authentication

Dashboard

- Login
- Device List
- Event History
- Noise Charts

Notifications

- Email Alerts

---

# Risks

High Priority

- Incorrect dBA calibration
- Poor Wi-Fi connectivity
- False positive alerts

Medium Priority

- Dashboard performance
- Backend scaling

Low Priority

- Hardware supply delays

---

# Definition of MVP Complete

The MVP is considered complete when:

- Device is assembled
- Wi-Fi provisioning works
- Device measures dBA accurately
- Events are sent to the cloud
- Dashboard displays events
- Email alerts are delivered
- System operates continuously for 7 days without failure

---

# Next Version

After validating the MVP with paying customers, development will continue with:

- OTA Firmware Updates
- Remote Configuration
- Mobile Application
- Camera Integration
- AI Sound Classification
- Enterprise Features