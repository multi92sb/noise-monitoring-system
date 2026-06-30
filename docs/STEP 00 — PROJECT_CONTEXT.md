# STEP 00 — PROJECT_CONTEXT.md

## Executive Summary
This document establishes the product definition for the MVP of the "Noise Monitoring System." The objective is to build a low-cost, high-reliability, audio-only noise monitor to prevent property damage and unauthorized parties in short-term rentals and multi-family residential complexes.

## Problem Statement
Property managers and short-term rental (Airbnb) hosts risk severe fines, neighbor complaints, and property damage due to unauthorized large parties and excessive noise. Traditional solutions are either too expensive (requiring complex hardware installation) or infringe on customer privacy (using video/cameras indoors).

## Product Vision
To provide a privacy-first, self-installed, low-cost noise sentinel that continuously tracks decibel levels and alerts owners before neighbor escalation occurs.

## Business Goals (Version 1)
* Launch with a total development/manufacturing budget under €5,000.
* Ship functional hardware and software within 6 months.
* Secure the first 5 paying commercial customers immediately.

## Target Customers
* Short-term rental (STR) hosts (Airbnb, VRBO).
* Co-living space managers.
* Student housing providers.
* Multi-family residential landlords.

## Scope Boundaries

### MVP Scope (V1)
* **Audio-Only Monitoring:** Track A-weighted decibel (dBA) levels on-device. No voice warnings, no video capture, no local audio recordings saved.
* **Serverless Cloud Telemetry:** Real-time data transmission (per-minute averages) via Wi-Fi to AWS IoT Core.
* **Property Owner Alerts:** Instant SMS/Email notifications when configured dB thresholds are breached for a sustained duration (e.g., >85 dB for 10 minutes).
* **Responsive Web Dashboard:** Standard React web app to view live device status, register new sensors, configure thresholds, and download historical compliance reports.

### Post-MVP / Enterprise Scope (Future)
* Custom hardware with integrated cellular backup (LTE-M).
* Camera subsystem and H.264/H.265 video capture (Professional/Outdoor Edition).
* On-device Edge AI classification (detecting screaming, dog barking, gunshots, sirens).
* Dedicated iOS/Android native applications.
* On-device local speaker voice warnings and countdown alerts.

## Success Metrics
* **Hardware BOM Cost:** < €20 per unit.
* **Installation Time:** < 5 minutes (plug-and-play).
* **Alert Latency:** < 15 seconds from threshold breach to SMS delivery.