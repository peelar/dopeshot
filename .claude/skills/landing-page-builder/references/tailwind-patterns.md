# Tailwind Design Patterns for Landing Pages

## Responsive Breakpoints Strategy

**Mobile-first approach:**
```jsx
// Start with mobile, enhance for larger screens
<div className="
  px-4 py-8           // Mobile: tight spacing
  sm:px-6 sm:py-12    // Small tablets: more room
  md:px-8 md:py-16    // Tablets: generous spacing
  lg:px-12 lg:py-24   // Desktop: maximum impact
  xl:px-16 xl:py-32   // Large screens: luxurious
">
```

**Common breakpoints:**
- `sm:` 640px (large phones, small tablets)
- `md:` 768px (tablets)
- `lg:` 1024px (small laptops)
- `xl:` 1280px (desktops)
- `2xl:` 1536px (large desktops)

---

## Typography Scales

**Semantic hierarchy:**
```jsx
// Hero section
<h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight">
  Main Headline
</h1>
<p className="text-xl md:text-2xl text-gray-600 mt-4">
  Supporting subheadline
</p>

// Section headings
<h2 className="text-3xl md:text-4xl lg:text-5xl font-bold">
  Section Title
</h2>

// Body copy
<p className="text-base md:text-lg text-gray-700 leading-relaxed">
  Description text
</p>

// Small text
<span className="text-sm text-gray-500">
  Secondary information
</span>
```

**Modern font pairings:**
- `font-sans` (Inter, system fonts) for UI/body
- `font-mono` for code snippets
- Custom fonts via Tailwind config for brand personality

---

## Color System Architecture

**Semantic color usage:**
```jsx
// Primary actions
className="bg-blue-600 hover:bg-blue-700 text-white"

// Secondary actions
className="bg-gray-100 hover:bg-gray-200 text-gray-900"

// Success states
className="bg-green-50 border-green-500 text-green-900"

// Warning/attention
className="bg-amber-50 border-amber-500 text-amber-900"

// Error states
className="bg-red-50 border-red-500 text-red-900"

// Neutral backgrounds
className="bg-gray-50" // Light sections
className="bg-white"   // Cards, elevated surfaces
className="bg-gray-900" // Dark sections
```

**Gradient patterns:**
```jsx
// Subtle backgrounds
className="bg-gradient-to-br from-blue-50 to-purple-50"

// Bold hero gradients
className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600"

// Glassmorphism overlays
className="bg-gradient-to-br from-white/20 to-white/5"

// Text gradients
className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
```

---

## Spacing & Layout Patterns

**Container patterns:**
```jsx
// Standard content container
<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
  {/* Content */}
</div>

// Narrow content (for reading)
<div className="max-w-3xl mx-auto px-4">
  {/* Blog post, long-form content */}
</div>

// Full-width sections with inner container
<section className="w-full bg-gray-50 py-24">
  <div className="max-w-7xl mx-auto px-4">
    {/* Section content */}
  </div>
</section>
```

**Vertical spacing rhythm:**
```jsx
// Section spacing
className="py-12 md:py-16 lg:py-24"  // Small sections
className="py-16 md:py-24 lg:py-32"  // Standard sections
className="py-24 md:py-32 lg:py-48"  // Hero sections

// Element spacing
className="space-y-4"   // Tight grouping (form fields)
className="space-y-8"   // Related content
className="space-y-12"  // Distinct sections
className="space-y-16"  // Major divisions
```

---

## Grid Layouts

**Bento grid implementation:**
```jsx
<div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-3 gap-4">
  {/* Large hero card */}
  <div className="md:col-span-2 md:row-span-2">
    {/* Primary content */}
  </div>
  
  {/* Medium cards */}
  <div className="md:col-span-2 md:row-span-1">
    {/* Secondary content */}
  </div>
  
  {/* Small cards - fill remaining grid */}
  <div className="md:col-span-1 md:row-span-1">
    {/* Tertiary content */}
  </div>
  {/* ... more small cards */}
</div>
```

**Feature grid patterns:**
```jsx
// 3-column feature grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
  {features.map(feature => (
    <div key={feature.id}>
      {/* Feature card */}
    </div>
  ))}
</div>

// Auto-fit responsive grid
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
  {/* Grid items */}
</div>
```

---

## Card Patterns

**Elevated cards:**
```jsx
<div className="
  rounded-2xl bg-white p-8
  shadow-sm hover:shadow-xl
  border border-gray-200
  transition-all duration-300
  hover:-translate-y-2
">
  {/* Card content */}
</div>
```

**Gradient border cards:**
```jsx
<div className="relative p-px rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500">
  <div className="relative rounded-2xl bg-white p-8">
    {/* Card content */}
  </div>
</div>
```

**Glassmorphism cards:**
```jsx
<div className="
  rounded-2xl
  bg-white/10 backdrop-blur-xl
  border border-white/20
  p-8
">
  {/* Card content */}
</div>
```

---

## Button Patterns

**Primary CTA:**
```jsx
<button className="
  relative overflow-hidden
  rounded-xl px-8 py-4
  bg-blue-600 hover:bg-blue-700
  text-white font-semibold
  shadow-lg hover:shadow-xl
  transform hover:scale-105
  transition-all duration-300
">
  Get Started
</button>
```

**Gradient button:**
```jsx
<button className="
  relative overflow-hidden group
  rounded-xl px-8 py-4
  bg-gradient-to-r from-blue-600 to-purple-600
  text-white font-semibold
  shadow-lg hover:shadow-2xl
  transition-all duration-300
">
  <span className="relative z-10">Start Free Trial</span>
  <div className="
    absolute inset-0
    bg-gradient-to-r from-purple-600 to-pink-600
    opacity-0 group-hover:opacity-100
    transition-opacity duration-300
  " />
</button>
```

**Ghost button (secondary):**
```jsx
<button className="
  rounded-xl px-6 py-3
  border-2 border-gray-300 hover:border-gray-400
  text-gray-700 hover:text-gray-900
  font-medium
  transition-colors duration-200
">
  Learn More
</button>
```

**Magnetic button effect:**
```jsx
<button className="
  group relative
  rounded-xl px-8 py-4
  bg-blue-600 text-white
  transition-all duration-300 ease-out
  hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/50
">
  <span className="relative z-10">Get Started</span>
</button>
```

---

## Animation Patterns

**Fade in on scroll:**
```jsx
// Add to element
className="
  opacity-0 translate-y-8
  transition-all duration-700 ease-out
  [&.visible]:opacity-100 [&.visible]:translate-y-0
"

// JavaScript intersection observer adds 'visible' class
```

**Stagger animations:**
```jsx
{items.map((item, index) => (
  <div
    key={item.id}
    className="opacity-0 animate-fadeIn"
    style={{ animationDelay: `${index * 100}ms` }}
  >
    {/* Content */}
  </div>
))}
```

**Hover effects:**
```jsx
// Lift on hover
className="transition-transform duration-300 hover:-translate-y-2"

// Expand on hover
className="transition-transform duration-300 hover:scale-105"

// Glow on hover
className="transition-shadow duration-300 hover:shadow-2xl hover:shadow-blue-500/50"

// Rotate on hover
className="transition-transform duration-300 hover:rotate-3"
```

---

## Focus & Accessibility

**Focus states:**
```jsx
<button className="
  focus:outline-none
  focus:ring-4 focus:ring-blue-500/50
  focus:ring-offset-2
">
  Accessible Button
</button>

// For dark backgrounds
<button className="
  focus:outline-none
  focus:ring-4 focus:ring-white/50
  focus:ring-offset-2 focus:ring-offset-gray-900
">
  Dark Background Button
</button>
```

**Skip links:**
```jsx
<a
  href="#main-content"
  className="
    sr-only focus:not-sr-only
    focus:absolute focus:top-4 focus:left-4
    focus:z-50 focus:px-4 focus:py-2
    focus:bg-blue-600 focus:text-white
    focus:rounded-lg
  "
>
  Skip to main content
</a>
```

---

## Performance Optimization

**Image optimization:**
```jsx
// Lazy loading
<img loading="lazy" className="..." />

// Responsive images
<img
  srcSet="
    image-400w.jpg 400w,
    image-800w.jpg 800w,
    image-1200w.jpg 1200w
  "
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
  src="image-800w.jpg"
  alt="Description"
/>

// Aspect ratio preservation (prevents CLS)
<div className="aspect-video relative">
  <img className="absolute inset-0 w-full h-full object-cover" />
</div>
```

**Transition performance:**
```jsx
// Use transform and opacity only (GPU-accelerated)
className="transition-transform duration-300"  // ✅ Good
className="transition-all duration-300"        // ⚠️ OK for simple cases
className="transition-[left] duration-300"     // ❌ Triggers layout reflow
```

---

## Dark Mode Support

**Dark mode classes:**
```jsx
<div className="
  bg-white dark:bg-gray-900
  text-gray-900 dark:text-white
  border-gray-200 dark:border-gray-700
">
  {/* Content */}
</div>

// Gradient adjustments
<div className="
  bg-gradient-to-br from-blue-50 to-purple-50
  dark:from-blue-950 dark:to-purple-950
">
  {/* Content */}
</div>
```

---

## Custom Animations via Tailwind Config

Add to `tailwind.config.js`:

```javascript
module.exports = {
  theme: {
    extend: {
      animation: {
        'fadeIn': 'fadeIn 0.5s ease-out',
        'slideUp': 'slideUp 0.5s ease-out',
        'scaleIn': 'scaleIn 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
}
```

Usage:
```jsx
<div className="animate-fadeIn">Fades in</div>
<div className="animate-slideUp">Slides up</div>
<div className="animate-scaleIn">Scales in</div>
```
