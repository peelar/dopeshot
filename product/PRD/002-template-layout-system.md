---
status: TODO
---

# Objective

Support multiple automatic layout styles based on the image’s form factor, so users can drop any screenshot (vertical, square, landscape, ultra-wide, portrait-phone) and instantly get a visually correct composition.

# Background

Right now DopeShot only has one template format (“Pop-Up”) optimized for tall or vertical screenshots. That works for site previews, SaaS dashboards and mobile app screens, but does not scale to other common form factors. Most design automation tools (Vercel OG generator, Shader-style mockups, Figma thumbnail plugins, Product Hunt previews) adapt layout based on aspect ratio.

If we want a one-drop workflow, the layout system must adapt automatically.

# Problem Statement

Users upload screenshots of different proportions, and the current system only looks good for vertical images. Square or landscape assets either look tiny, off-centered, or visually weak. Users expect the layout to adapt automatically without manual tweaking.

# Goals / Non-Goals

Goals:
Deliver adaptive layout presets per image shape.  
Ensure designs look “professional” with minimal user effort.  
Make thumbnails look like high-end Vercel, Stripe, and Product Hunt graphics.  
Maintain immediate preview and no-configuration workflows.

Non-Goals:
No template editor for users.  
No fine-grained control for spacing, padding, grid rules.  
No custom components beyond headline, subline, image.

# Users & Use Cases

Startup founder creating a product launch graphic.  
Engineer creating social preview cards.  
Designer prototyping product screenshots.  
Anyone creating a cover for Twitter, LinkedIn, Product Hunt, blog, or landing page.

Key workflows:
User drops image → layout auto-adjusts → user edits headline or colors.

# Proposed Solution

Introduce three additional layout templates that self-select based on detected aspect ratio:

Square  
Landscape (widescreen)  
Ultrawide (dashboard, desktop)

Template behavior is chosen automatically.

Aspect groupings:
Square: ~1:1 ± tolerance  
Landscape: 1.4–2.2  
Portrait: existing template  
Ultrawide: > 2.2

## Template Concepts

### A. Square Screenshot → “Hero Center”

Screenshot centered, text above and below or text to the right.
