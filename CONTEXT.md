# Noise Monitoring System

Privacy-first noise monitoring: a small audio-only device that measures environmental noise and integrates with cameras the customer already owns.

## Language

**Device**:
The noise monitoring hardware unit. Contains an ESP32-S3 and a digital microphone — nothing else: no camera, no relay, no siren, no speaker inside the box.
_Avoid_: sensor unit, node, camera device

**Paired Camera**:
A customer-owned, ONVIF-compatible IP camera (e.g. Hikvision, Dahua, Reolink) that the Device connects to over the customer's network. Optional — a Device may have zero Paired Cameras.
_Avoid_: integrated camera, built-in camera, our camera

**Audio-Only Mode**:
The Device operating without any Paired Camera — measures dBA levels and raises alerts, exactly as the original MVP.
_Avoid_: standalone mode, basic mode

**Camera-Paired Mode**:
The Device operating with one or more Paired Cameras, unlocking camera-dependent capabilities (recording triggers, siren activation via camera hardware).
_Avoid_: pro mode, video mode

**Siren**:
The Paired Camera's own deterrent hardware — built-in siren/strobe or an external siren wired to the camera's alarm output — activated over the network. Never hardware on the Device.
_Avoid_: device siren, built-in siren, alarm box

**Noise Event**:
A sustained breach of a configured dBA threshold detected by the Device, with a precise start/end timestamp.
_Avoid_: alarm, incident, violation

**Event Bookmark**:
A Noise Event correlated with a Paired Camera's footage, presented as a "view footage at this time" entry in the dashboard. Works with any ONVIF camera, since the camera records as it already does.
_Avoid_: clip, recording, evidence video

**Recording Trigger**:
An active command sent to a Paired Camera to start recording or raise an alarm event. Requires a vendor-specific API — in V1 supported for Hikvision only.
_Avoid_: ONVIF recording command (ONVIF does not standardise this for cameras)

**Tier 1 Vendor**:
A camera vendor with full V1 support — Siren activation and Recording Trigger on top of the universal features (discovery, Event Bookmark). In V1: Hikvision only. Every ONVIF camera gets the universal features regardless of tier.
_Avoid_: supported camera, certified camera

**Complaint Evidence**:
The bundle presented to a venue owner when a neighbor complains: the Noise Event with its measurements, its Sound Class, and the Event Bookmark into the Paired Camera's footage — used to confirm or refute the complaint objectively.
_Avoid_: proof, report (reports are the periodic compliance exports)

**Sound Class**:
A label the on-device classifier attaches to a Noise Event as metadata. A label never suppresses or replaces a dBA threshold alert. V1 classes: **crate/packaging banging** (deliveries, loading), **speech/talking**, **car engine starting** — everything else falls back to *unknown*.
_Avoid_: detection, category, tag
