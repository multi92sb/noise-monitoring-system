# 04 — Event Bookmark + Complaint Evidence view

**What to build:** Every Noise Event on a camera-paired Device automatically gets an Event Bookmark per Paired Camera (event time window, camera reference, where-to-view instructions). The dashboard event detail presents the full Complaint Evidence — measurements, Sound Class, bookmarks — and events can be filtered by Sound Class and time of day. Works with any ONVIF camera; no video or audio ever enters the cloud or dashboard.

**Blocked by:** 02 — Camera pairing end-to-end.

**Status:** ready-for-agent

- [ ] Noise Event created → one Event Bookmark per Paired Camera with the correct time window and camera reference
- [ ] Dashboard event detail shows measurements, Sound Class, and bookmark(s) with where-to-view instructions (footage stays in the customer's recorder)
- [ ] Events are filterable by Sound Class and time of day
- [ ] Bookmark/evidence projections covered by pytest; evidence view by Vitest
