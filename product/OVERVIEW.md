# Overview

**Status:** MVP - Screenshot Enhancement  
**Last Updated:** November 2025

---

## WHAT EXISTS NOW

### Core Flow

1. User uploads product screenshot
2. System analyzes and auto-generates polished version
3. User can customize (optional)
4. User exports Twitter/LinkedIn-ready graphic

**Time to first result:** 2-3 seconds  
**Time to export:** 10 seconds total

---

## FEATURE SET

### 1. Smart Upload & Analysis

**Automatic on Upload:**

- Color extraction (dominant + accent colors)
- Aspect ratio detection
- Template suggestion based on screenshot dimensions
- Default styling applied immediately

**User sees polished result without any input required.**

### 2. Template System

**Two Active Templates:**

#### Template 1: "Popup"

- **Best for:** Phone screenshots (vertical aspect ratio)
- **Effect:** Image "rises" from bottom, cut at 50%
- **Variants:** Left, Center, Right positioning
- **Auto-selected:** When screenshot is vertical

#### Template 2: "Split"

- **Best for:** Desktop/web screenshots (horizontal or square)
- **Effect:** Text on one side, screenshot on other
- **Variants:**
  - Left/Right (side by side)
  - Top/Bottom (stacked)
- **Auto-selected:** When screenshot is horizontal or square

**Switching:** One-click between looks and variants

### 3. Font System

**8 Curated Font Choices (by Vibe):**

| Vibe             | Use Case                      |
| ---------------- | ----------------------------- |
| **Founder Mode** | Clean, modern (DEFAULT)       |
| **Corporate**    | Professional, serious         |
| **Terminal**     | Developer tools vibe          |
| **Unhinged**     | Bold, geometric, indie hacker |
| **Normie**       | Friendly, approachable        |
| **Chaotic**      | Edgy, design-forward          |
| **Spreadsheet**  | Technical, data/analytics     |
| **Expensive**    | Premium, polished             |

**Philosophy:** Users choose by mood, not font name. Every option looks good.

**Switching:** One-click font change

### 4. Color Intelligence

**Automatic Color System:**

- Extract 2-3 dominant colors from screenshot
- Generate complementary gradient backgrounds
- Adjust gradient intensity where text appears
- Set text colors for optimal readability
- Everything auto-matches screenshot aesthetic

**User Control (Optional):**

- Can adjust colors if desired
- Not required for good results

### 5. Text Customization

**What Users Can Edit:**

- Headline text (main message)
- Subheadline text (optional)
- Text positioning (via layout variants)

**What's Automatic:**

- Text size scaling
- Color contrast for readability
- Text positioning within chosen layout

### 6. Export

**Output:**

- Twitter/LinkedIn optimized dimensions
- High resolution (PNG)
- Ready to post immediately

**No watermark** (determine based on pricing tier later)

---

## LANDING PAGE

### Current Experience

**Above Fold:**

- Headline: "Your product is dope. Your screenshots should be too."
- Animated carousel showing example outputs
- Two CTAs:
  - "Select File" (upload your own)
  - "✨ Try with example" (use demo screenshot)

**Value Props:**

- ✓ Instant results
- ✓ No design skills needed
- ✓ Twitter-ready in seconds

**Activation Flow:**

1. User lands → sees examples (2 seconds)
2. Tries demo OR uploads (5 seconds)
3. Sees result immediately (3 seconds)
4. **Total time to "wow": 10 seconds**

**No Friction:**

- No account required
- No tutorial needed
- No blank canvas
- Immediate value

---

## WHAT'S NOT BUILT YET

_(But in vision document)_

- LinkedIn/Twitter/Substack headers
- Text-only content covers (podcast, newsletter)
- Brand consistency system (saved palettes)
- Multi-platform export
- Series looks
- Additional looks (e.g., "Overlay")

---

## TECHNICAL NOTES

### Requirements

- Screenshot upload (PNG, JPG)
- Color extraction algorithm
- Gradient generation
- Template rendering system
- Font loading (8 custom fonts)
- Export generation (high-res PNG)

### Performance Targets

- Color analysis: < 1 second
- Template rendering: < 2 seconds
- Export generation: < 3 seconds
- **Total flow: < 10 seconds**

### Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile responsive (but optimized for desktop workflow)

---

## KNOWN LIMITATIONS

**Current Scope:**

- Only works with screenshots (no text-only yet)
- Only product screenshot use case (no headers/covers yet)
- No brand consistency across sessions (no saved preferences)
- No multi-platform sizing (only Twitter/LinkedIn size)
- No batch processing

**These are intentional.** We're nailing the core flow before expanding.

---

## VALIDATION CRITERIA

**Before adding new features, current MVP must:**

✓ Generate good-looking output 95%+ of time  
✓ Complete full flow in under 15 seconds  
✓ Require zero customization for acceptable result  
✓ Have clear repeat-use pattern (users come back)  
✓ Get positive feedback on output quality

**Once validated → expand to headers and content covers.**

---
