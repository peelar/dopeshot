---
"dopeshot-app": patch
---

Improved UI error handling across the application. All async operations now provide clear user feedback when they fail. Added error boundaries to prevent full app crashes.

**High Priority Fixes:**
- Added inline error messages for brand logo loading failures
- Added toast notifications for memory fetch and load errors
- Added error handling for file upload operations

**Medium Priority Fixes:**
- Added toast notifications for export failures
- Fixed Promise.all vulnerability in background listing (now uses Promise.allSettled for graceful degradation)
- Added silent error handling for color analysis failures (fallback to defaults)

**Low Priority Fixes:**
- Fixed incomplete logo upload response handling
- Fixed onboarding retry logic

**Error Boundaries:**
- Created error boundaries for playground, sidebar, and memory sections
- Integrated error boundaries into main playground page
- All errors are tracked to Sentry and analytics for monitoring
