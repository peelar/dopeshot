---
"dopeshot-app": patch
---

Fix Google OAuth authentication by adding missing image field

Fixed authentication error when signing in with Google. The User model now includes an `image` field to store the Google profile picture URL, preventing the "Unknown argument `image`" error during user creation.
