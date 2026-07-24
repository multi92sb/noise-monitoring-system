# V1 Spec — Camera-Paired Noise Monitor for Venues Adjacent to Residences

> Pending publish to GitHub Issues with the `ready-for-agent` label (requires `gh` CLI on this machine).
> Governing ADRs: [0001](../adr/0001-camera-pairing-reintroduced-for-v1.md), [0002](../adr/0002-on-device-ai-classification.md), [0003](../adr/0003-beachhead-venues-next-to-residences.md). Vocabulary per [CONTEXT.md](../../CONTEXT.md).

## Problem Statement

Owners of commercial venues (bars, cafés, shops) located next to residential buildings suffer noise complaints from neighbors — deliveries banging crates at 5 AM, staff talking outside, cars starting. The owner learns about a disturbance only when the complaint (or the inspection) arrives, and has no objective evidence to confirm or refute it. These venues already own IP cameras that record everything — but cameras don't measure noise, and nobody knows *when* in the footage to look.

## Solution

A small audio-only **Device** (ESP32-S3 + microphone, nothing else in the box) mounted near the delivery area continuously measures dBA. On a sustained threshold breach it raises a **Noise Event**, classifies the sound **on the Device** (**Sound Class**: crate banging / talking / car engine starting / *unknown*), and alerts the owner within seconds — before the neighbor complains.

If the venue has cameras, the owner pairs their existing ONVIF camera (**Paired Camera** — no new camera hardware). Every Noise Event then becomes an **Event Bookmark** pointing at the exact footage window in the customer's existing recorder. On Hikvision cameras (the only **Tier 1 Vendor** in V1) the Device additionally fires the camera's own **Siren**/strobe and sends a **Recording Trigger**. Noise Event + Sound Class + Event Bookmark together form **Complaint Evidence** the owner uses to confirm or refute a complaint objectively.

Venues without cameras run the same Device in **Audio-Only Mode** (measurement + alerts + reports) and can add a Paired Camera later.

## User Stories

Pairing & setup:

1. As a venue owner, I want to mount the Device near my delivery area and power it via USB, so that I'm monitoring within minutes without an electrician.
2. As a venue owner, I want to register the Device to my account from the dashboard, so that I can see it online.
3. As a venue owner, I want the Device to discover ONVIF cameras on my local network automatically, so that I don't have to type IP addresses.
4. As a venue owner, I want to pick my camera from the discovered list and enter its credentials in the dashboard, so that pairing takes two minutes.
5. As a venue owner, I want the pairing verified automatically (the Device test-connects to the camera), so that I know it works before I rely on it.
6. As a venue owner, I want to pair more than one camera with a Device, so that the delivery area and the entrance are both covered.
7. As a venue owner, I want to unpair or replace a Paired Camera, so that a broken camera doesn't break my monitoring.

Monitoring & alerts:

8. As a venue owner, I want continuous dBA measurement with configurable thresholds and sustained-duration rules, so that only real disturbances alert me.
9. As a venue owner, I want each Noise Event to carry a Sound Class label, so that I instantly see *what* the noise was.
10. As a venue owner, I want SMS/email alerts within 15 seconds of a sustained breach, including the Sound Class, so that I can react before a neighbor complains.
11. As a venue owner, I want alerts to fire regardless of Sound Class (the label is metadata, never a gate), so that I never miss a loud event the classifier didn't recognize.

Camera actions:

12. As a venue owner, I want every Noise Event to create an Event Bookmark with the exact footage window and which Paired Camera holds it, so that I can pull the video in under a minute.
13. As a venue owner, I want bookmarks to work with any ONVIF camera (it records as it already does), so that I'm not forced into a specific brand.
14. As a venue owner with a Hikvision camera, I want the Device to send a Recording Trigger when a Noise Event starts, so that the event is explicitly marked/recorded even if the camera wasn't recording then.
15. As a venue owner with a Hikvision camera that has a siren/strobe, I want to configure the Siren to activate on Noise Events (minimum level, active hours, max duration, cooldown), so that disturbances are deterred on the spot.
16. As a venue owner, I want camera actions to keep working when the internet is down (the Device talks to the camera over LAN), so that a Wi-Fi outage doesn't disable deterrence.
17. As a venue owner, I want clear dashboard feedback when a Paired Camera stops responding, so that I can fix it before an incident.

Evidence & reports:

18. As a venue owner, I want each Noise Event presented as Complaint Evidence (measurements + Sound Class + Event Bookmark), so that I can confirm or refute a neighbor's complaint objectively.
19. As a venue owner, I want to download periodic compliance reports, so that I can show due diligence to authorities and my landlord.
20. As a venue owner, I want to filter events by Sound Class and time of day, so that I can spot patterns (e.g. Tuesday-morning deliveries).

Audio-Only Mode:

21. As a venue owner without cameras, I want the full measurement + alerting + reports experience with no camera steps in setup, so that the product works out of the box.
22. As a venue owner in Audio-Only Mode, I want to add a Paired Camera later without replacing the Device, so that I can upgrade when I install cameras.

Ops & safety:

23. As a venue owner, I want the Device to buffer telemetry during internet outages and backfill afterwards, so that my history has no gaps.
24. As a venue owner, I want the Device to receive config updates (thresholds, siren rules, camera credentials) from the dashboard without physical access.
25. As a venue owner, I want the Siren to have a hard max duration and cooldown, so that a fault can't blare all night and create the very problem I'm trying to prevent.
26. As a venue owner, I want classification to run on the Device with raw audio never leaving it, so that I can honestly state that no conversations are recorded or uploaded.

## Implementation Decisions

- **Firmware camera module** (new): ONVIF WS-Discovery client, minimal ONVIF device-service probing, and a Hikvision ISAPI client implementing two actions — Siren/strobe activation (with explicit deactivation / max-duration) and Recording Trigger. All camera traffic is Device→camera over LAN; the cloud never contacts cameras (ADR-0001).
- **Credential flow**: camera credentials are entered in the dashboard, delivered to the Device over the existing encrypted device-config channel (AWS IoT Core), stored on the Device, and used only from the Device. The cloud database stores only camera metadata (identifier, discovered capabilities, pairing status) — not credentials.
- **Siren rules engine runs on the Device** (threshold + active hours + max duration + cooldown), configured from the dashboard; firing never depends on cloud connectivity. Every Siren activation/deactivation is logged on the Noise Event.
- **On-device classifier** (new firmware module): TFLite Micro, mel-spectrogram features, classes `crate_banging | talking | car_engine_starting | unknown`. Emits a Sound Class label attached to the Noise Event payload; never gates alerting (ADR-0002). Model training is an offline Python pipeline; the artefact is a versioned model blob compiled into firmware.
- **Backend additions**: Paired Camera registry (device ↔ cameras, capabilities, status); Noise Event enrichment with Sound Class; Event Bookmark records (event time window + camera reference + where-to-view instructions). The cloud ingests and proxies **no video and no audio** — footage stays in the customer's recorder; the dashboard tells the owner exactly where and when to look.
- **Dashboard additions**: camera pairing/management screens; Sound Class on event lists and alerts; Complaint Evidence view per event; Siren rules configuration. Existing measurement/alert/report screens unchanged.
- **Schema (DynamoDB)**: new Paired Camera items keyed by device; Noise Event items extended with `soundClass`, bookmark references, and a siren action log. **API**: camera CRUD + pairing-test endpoint; event endpoints gain the evidence projection.
- **Failure semantics**: if a Paired Camera is unreachable, the Device retries with backoff, marks the camera degraded in the dashboard, and continues Audio-Only behaviour uninterrupted; Siren failures surface in camera health.

## Testing Decisions

A good test exercises external behaviour at an agreed seam, never implementation details. No new seams are introduced — V1 reuses the three existing ones plus the manual protocol:

- **Firmware — PlatformIO native host-compiled tests** (existing seam): camera-module behaviour against a fake HTTP camera (discovery parsing, ISAPI command formation, retry/backoff, degraded-mode transitions); classifier against golden samples (fixed feature inputs → expected Sound Class); Siren rules engine as pure logic (event + clock + config → fire / expire / cooldown).
- **Backend — pytest with mock JSON** (existing seam, prior art `test_backend.py`): camera registry CRUD, event enrichment, bookmark/evidence projections, auth as today.
- **Dashboard — Vitest** (existing seam): parsing/rendering of cameras, Sound Class, evidence view; Siren rules form logic.
- **Manual validation** (extends `STEP 14` protocol): real Hikvision camera — pairing, Recording Trigger, Siren fires within 5 s of event start, max-duration cutoff honoured; outdoor placement at a delivery area; ±2 dBA reference check unchanged.

## Out of Scope

- Dahua, Reolink, or any non-Hikvision Tier 1 support (universal features only).
- Cloud-side AI classification; raw audio ever leaving the Device (ADR-0002).
- Video in the dashboard or cloud: no streaming, no clip upload, no NVR integration.
- Any new hardware in the Device: relay, siren, speaker, camera (ADR-0001).
- Voice warnings, mobile apps, LTE backup (`STEP 23` items stay deferred).
- Using Sound Class to suppress or gate alerts.
- Pricing/packaging (camera features included vs. premium tier) — settled before launch, does not block the build.

## Further Notes

- `STEP 00`, `STEP 05`, `STEP 06` need reconciliation edits (they describe the superseded audio-only/no-camera/no-AI MVP) — do them when the first ticket lands.
- Biggest technical risk: the on-device classifier (dataset sourcing, quantisation, false-positive tuning). If it slips, Sound Class moves to V1.1 and events ship labelled `unknown` — no other story is blocked.
- Deliberately deferred to tickets: dataset sourcing for the three classes, ONVIF discovery quirks per camera firmware, Hikvision ISAPI endpoint specifics per model family, outdoor-rated enclosure and power for delivery-area mounting.
