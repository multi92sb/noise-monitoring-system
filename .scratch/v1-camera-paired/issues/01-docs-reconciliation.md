# 01 — Docs reconciliation (STEP 00/05/06 + README vs ADRs 0001–0003)

**What to build:** Update `STEP 00`, `STEP 05`, `STEP 06` and the README so they describe the new V1 — camera-paired device, on-device AI classification, venue beachhead — instead of the superseded audio-only / no-camera / no-AI MVP. ADR-0001/0002/0003 and spec `docs/specs/0001` are the source of truth; edited docs link to them.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [ ] STEP 00 target customers and scope reflect the venue beachhead and camera-paired V1 (STR demoted to secondary segment)
- [ ] STEP 05 no longer states cameras are removed from V1; explains the Paired Camera model and points at ADR-0001
- [ ] STEP 06 reflects on-device classification in V1 (crate_banging / talking / car_engine_starting / unknown, metadata only) per ADR-0002
- [ ] README product description matches the V1 pitch
- [ ] Every edited doc links to ADRs 0001–0003 and `docs/specs/0001`
