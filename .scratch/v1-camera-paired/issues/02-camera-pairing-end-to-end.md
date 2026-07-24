# 02 — Camera pairing end-to-end

**What to build:** From the dashboard, a venue owner can ask a registered Device to discover ONVIF cameras on the venue's LAN, pick one from the discovered list, enter its credentials, and have the Device test-connect and report *paired*. Cloud stores only camera metadata (identifier, discovered capabilities, pairing status); credentials are delivered over the existing encrypted device-config channel, stored on the Device, and used only Device→camera over LAN. This is the tracer bullet through all layers: Paired Camera registry schema, camera API routes, firmware camera module skeleton (WS-Discovery, ONVIF probing, ISAPI test-connect), dashboard pairing UI.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [ ] Discovery initiated from the dashboard returns cameras the Device found on its LAN (firmware host-side tests use a fake ONVIF responder)
- [ ] Selecting a camera + entering credentials pairs it: metadata appears in the cloud registry; credentials are never persisted in the cloud database
- [ ] Device test-connects to the camera and reports paired / failed-with-reason; dashboard shows the status
- [ ] Multiple cameras can pair to one Device; Audio-Only Mode setup has no camera steps
- [ ] Backend handler tests (pytest, mock JSON) and dashboard Vitest cover the new behaviour
