# PostHog Setup & Validation

## Privacy-First Configuration

This implementation is EU-compliant and requires **no cookie banner or consent flow**.

### Privacy Features
- ✅ **No cookies or localStorage** - Memory-only persistence
- ✅ **No user profiling** - Never creates user profiles
- ✅ **No session replay** - Disabled by default
- ✅ **No autocapture** - Only explicit events tracked
- ✅ **No heatmaps** - Disabled
- ✅ **No persistent identifiers** - No cross-session tracking
- ✅ **Respects DNT** - Honors Do Not Track headers

## Environment Variables

Add these to your `.env.local` file:

```bash
# PostHog Configuration
NEXT_PUBLIC_POSTHOG_KEY=phc_your_project_api_key_here
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

### Getting Your API Key

1. Sign up at https://posthog.com (EU or US cloud)
2. Create a new project
3. Go to Project Settings → Project API Key
4. Copy the API key (starts with `phc_`)
5. Choose your host:
   - US Cloud: `https://us.i.posthog.com`
   - EU Cloud: `https://eu.i.posthog.com`
   - Self-hosted: Your custom domain

## Validation Checklist

After deploying with the environment variables set:

### 1. Check PostHog Initialization
- [ ] Open browser DevTools → Console
- [ ] Look for: "PostHog loaded (privacy-first mode)" (in development)
- [ ] No errors in console

### 2. Verify Events Are Tracked
- [ ] Perform a core action (e.g., change look, upload screenshot)
- [ ] Go to PostHog → Events → Live Events
- [ ] See your event appear within 10-30 seconds
- [ ] Verify event properties are correct

### 3. Confirm Privacy Settings
- [ ] Go to PostHog → Settings → Project Settings
- [ ] Check "Data Management" tab
- [ ] Confirm no session recordings appear
- [ ] Confirm no autocaptured events (only custom events)

### 4. Test Core Events

Perform these actions and verify they appear in PostHog:

| Action | Event Name | Properties |
|--------|-----------|------------|
| Change look | `look_changed` | from_look, to_look, look_name |
| Upload screenshot | `screenshot_uploaded` | aspect_category, file_size_kb |
| Select gradient | `gradient_preset_selected` | preset_id, preset_name |
| Change variant | `variant_changed` | variant, look_id |
| Modify headline | `headline_modified` | length |
| Toggle effect | `effect_toggled` | effect, enabled |
| Click export | `export_button_clicked` | look_id, variant, etc. |

### 5. Verify No Cookies
- [ ] Open DevTools → Application → Cookies
- [ ] Confirm NO PostHog cookies are set
- [ ] Check localStorage - should be empty or minimal

### 6. Test on Preview Domains
- [ ] Deploy to Vercel preview URL
- [ ] Verify events track on preview domains
- [ ] No special configuration needed

## Event Schema

All 19 events are preserved from previous implementation:

**Core Actions:**
- `look_changed`, `variant_changed`, `pattern_changed`
- `export_button_clicked`

**Gradient Customization:**
- `gradient_preset_selected`, `gradient_source_changed`
- `gradient_color_customized`, `gradient_angle_changed`

**Background:**
- `background_type_changed`, `background_image_uploaded`

**Text & Typography:**
- `headline_modified`, `subtitle_modified`
- `font_changed`, `font_size_changed`

**Effects:**
- `effect_toggled` (soft_glass, rounded_corners, shadow)

**Assets:**
- `screenshot_uploaded`, `screenshot_zoom_changed`
- `logo_uploaded`

## Troubleshooting

### Events Not Appearing
1. Check environment variables are set correctly
2. Verify API key is valid (starts with `phc_`)
3. Check browser console for errors
4. Ensure you're looking at the correct project in PostHog

### CORS Errors
- PostHog cloud handles CORS automatically
- If self-hosting, configure CORS in PostHog settings

### Network Errors
- Verify `NEXT_PUBLIC_POSTHOG_HOST` is correct
- Check if your network/firewall blocks PostHog
- Test from different network/location

## Migration Away (Future)

To migrate to another analytics provider:

1. All events use standard naming (no PostHog-specific format)
2. Event properties are simple key-value pairs
3. Replace `lib/analytics.ts` with new provider
4. Remove `components/posthog-provider.tsx`
5. Update `app/layout.tsx`
6. Events remain semantically identical

## Support

- PostHog Docs: https://posthog.com/docs
- Privacy Configuration: https://posthog.com/docs/privacy
- EU Cloud: https://posthog.com/eu
