---
"dopeshot-app": patch
---

Remove onboarding modal feature

The post-signup onboarding modal was making failing Supabase REST API requests to query user_metadata directly, bypassing the Prisma ORM. Since users can upload their logo anytime from the sidebar, the modal added friction without clear value.

Removed:
- useOnboardingFlow hook
- OnboardingModal component
- /api/brand/skip-onboarding endpoint
- onboardingProgress field from UserMetadata schema
