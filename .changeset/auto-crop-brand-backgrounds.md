---
"dopeshot-app": patch
---

Auto-crop brand backgrounds to 16:9 aspect ratio

- Brand backgrounds are automatically cropped to 16:9 using center-crop
- Accepts any aspect ratio upload (portrait, square, ultrawide)
- Compression happens after cropping for optimal file size
- Users see a toast notification when their image is cropped
- Tracking includes original and final dimensions for analytics
