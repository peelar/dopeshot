---
"dopeshot-app": patch
---

Fix "Request Entity Too Large" error when saving designs by compressing screenshot images before upload to stay under Vercel's 4.5MB payload limit. Includes fallback for older browsers that don't support OffscreenCanvas/createImageBitmap APIs.
