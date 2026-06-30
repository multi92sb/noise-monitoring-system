# STEP 06 — AI_ENGINE.md

# AI Engine

## Status

**Deferred to Version 2 / Enterprise**

AI-based sound classification is intentionally excluded from the MVP to reduce development time, simplify the architecture, and validate the core business value as quickly as possible.

## Why It Is Not Included in the MVP

The primary goal of Version 1 is to answer one business question:

> Will customers pay for a reliable device that measures environmental noise levels and alerts them when configurable thresholds are exceeded?

This value can be delivered without artificial intelligence.

Adding AI classification would significantly increase development complexity while providing limited additional value during the validation phase.

## Current MVP Scope

The device performs:

- Continuous sound sampling
- dBA calculation
- Threshold detection
- Local event generation
- Cloud telemetry
- Historical reporting

No audio is stored or analyzed beyond decibel calculations.

## Future Versions

Once the product has validated market demand, the AI Engine may be introduced as a premium feature.

Potential capabilities include:

- Music detection
- Human speech detection
- Screaming detection
- Dog barking detection
- Construction noise detection
- Vehicle detection
- Siren detection
- Glass breaking detection

AI classification will enrich event metadata but will **not replace** decibel threshold detection.

## Design Principle

The system architecture should remain modular so an AI inference module can be added later without requiring changes to the existing audio acquisition or telemetry pipeline.