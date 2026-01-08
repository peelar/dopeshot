---
"dopeshot-app": patch
---

Automatic image compression for uploads to ensure files stay under 5MB limit

Added automatic image compression for all uploaded images (screenshots, backgrounds, and logos) to ensure they don't exceed the 5MB limit. This improves upload reliability and storage efficiency while maintaining visual quality.

- Client-side compression for screenshots and backgrounds using canvas-based compression
- Server-side compression for logo uploads using Sharp
- Compression analytics tracking to monitor compression ratios
- Comprehensive test coverage for both client and server compression
