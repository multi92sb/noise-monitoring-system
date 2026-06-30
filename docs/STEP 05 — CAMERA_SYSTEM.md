# STEP 05 — CAMERA_SYSTEM.md

## Status: Deprecated & Postponed to Version 2

To fit our target €5,000 budget and meet a 6-month launch timeline with one engineer, all camera and video recording systems have been removed from the MVP (Version 1) scope.

### Rationale:
* **Cost Constraints:** Adding cameras, lens mountings, and local video encoders (H.264/H.265) increases the device BOM cost from €18 to €95+.
* **Power Draw:** Video streaming and buffering require a high-power processor like the Raspberry Pi, making low-power Wi-Fi deployments impossible.
* **Privacy Obstacles:** Video cameras in short-term rentals and apartment buildings create severe GDPR/CCPA legal challenges and guests' friction. Removing the camera makes the device instantly viable for indoor residential spaces.
* **Bandwidth & Storage Costs:** Storing video records in S3 and streaming them introduces significant cloud billing variables.

### Planned Path for Professional/Enterprise Version (V2):
* Incorporate an optional module for outdoor noise monitoring (e.g., bar patios and construction sites).
* Implement video encoding with circular buffering on a Raspberry Pi CM5.
* Use direct S3 pre-signed URLs to upload motion-triggered footage.
