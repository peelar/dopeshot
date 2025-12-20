# Animation Cookbook

## Scroll-Based Animations

### Fade In On Scroll

**Implementation:**
```jsx
import { useEffect } from 'react';

const FadeInOnScroll = ({ children, className = '' }) => {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('opacity-100', 'translate-y-0');
            entry.target.classList.remove('opacity-0', 'translate-y-8');
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -100px 0px' }
    );
    
    const elements = document.querySelectorAll('.fade-in-scroll');
    elements.forEach((el) => observer.observe(el));
    
    return () => observer.disconnect();
  }, []);

  return (
    <div className={`fade-in-scroll opacity-0 translate-y-8 transition-all duration-700 ease-out ${className}`}>
      {children}
    </div>
  );
};
```

**Usage:**
```jsx
<FadeInOnScroll>
  <h2>This fades in when scrolled into view</h2>
</FadeInOnScroll>
```

---

### Stagger Animation

**Implementation:**
```jsx
const StaggerChildren = ({ children, staggerDelay = 100 }) => {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const children = entry.target.children;
            Array.from(children).forEach((child, index) => {
              setTimeout(() => {
                child.classList.add('opacity-100', 'translate-y-0');
                child.classList.remove('opacity-0', 'translate-y-4');
              }, index * staggerDelay);
            });
          }
        });
      },
      { threshold: 0.2 }
    );
    
    const container = document.querySelector('.stagger-container');
    if (container) observer.observe(container);
    
    return () => observer.disconnect();
  }, [staggerDelay]);

  return (
    <div className="stagger-container">
      {React.Children.map(children, (child, index) => (
        <div className="opacity-0 translate-y-4 transition-all duration-500 ease-out">
          {child}
        </div>
      ))}
    </div>
  );
};
```

**Usage:**
```jsx
<StaggerChildren staggerDelay={150}>
  <FeatureCard title="Feature 1" />
  <FeatureCard title="Feature 2" />
  <FeatureCard title="Feature 3" />
</StaggerChildren>
```

---

### Parallax Scrolling

**Simple parallax (CSS only):**
```jsx
<div className="relative h-screen overflow-hidden">
  <div 
    className="absolute inset-0 bg-cover bg-center"
    style={{
      backgroundImage: 'url(/hero-bg.jpg)',
      transform: 'translateY(var(--scroll-offset))',
    }}
  />
  <div className="relative z-10">
    {/* Foreground content */}
  </div>
</div>

<script>
window.addEventListener('scroll', () => {
  const scrolled = window.pageYOffset;
  const parallax = document.querySelector('.parallax-bg');
  if (parallax) {
    parallax.style.setProperty('--scroll-offset', `${scrolled * 0.5}px`);
  }
});
</script>
```

**Advanced parallax with multiple layers:**
```jsx
const ParallaxSection = () => {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.pageYOffset);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="relative h-screen overflow-hidden">
      {/* Background layer - slowest */}
      <div 
        className="absolute inset-0"
        style={{ transform: `translateY(${scrollY * 0.3}px)` }}
      >
        <img src="/bg-layer-1.jpg" className="w-full h-full object-cover" />
      </div>
      
      {/* Mid layer - medium speed */}
      <div 
        className="absolute inset-0"
        style={{ transform: `translateY(${scrollY * 0.5}px)` }}
      >
        <img src="/bg-layer-2.png" className="w-full h-full object-contain" />
      </div>
      
      {/* Foreground content - fastest (normal scroll) */}
      <div className="relative z-10">
        <h1>Parallax Content</h1>
      </div>
    </div>
  );
};
```

---

### Scroll Progress Indicator

**Implementation:**
```jsx
const ScrollProgress = () => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      const currentProgress = (window.pageYOffset / totalHeight) * 100;
      setProgress(currentProgress);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="fixed top-0 left-0 w-full h-1 bg-gray-200 z-50">
      <div 
        className="h-full bg-gradient-to-r from-blue-600 to-purple-600 transition-all duration-300"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
};
```

---

### Sticky Section Transitions

**Implementation:**
```jsx
<div className="relative">
  {/* Section 1 - sticks as section 2 scrolls over */}
  <section className="sticky top-0 h-screen flex items-center justify-center bg-blue-500">
    <h2 className="text-white text-4xl">Section 1</h2>
  </section>
  
  {/* Section 2 - scrolls over section 1 */}
  <section className="relative h-screen flex items-center justify-center bg-white z-10">
    <h2 className="text-gray-900 text-4xl">Section 2</h2>
  </section>
  
  {/* Section 3 */}
  <section className="relative h-screen flex items-center justify-center bg-purple-500 z-20">
    <h2 className="text-white text-4xl">Section 3</h2>
  </section>
</div>
```

---

## Interactive Animations

### Magnetic Button

**Implementation:**
```jsx
const MagneticButton = ({ children, className = '' }) => {
  const buttonRef = useRef(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    if (!buttonRef.current) return;
    
    const rect = buttonRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const deltaX = (e.clientX - centerX) * 0.3;
    const deltaY = (e.clientY - centerY) * 0.3;
    
    setPosition({ x: deltaX, y: deltaY });
  };

  const handleMouseLeave = () => {
    setPosition({ x: 0, y: 0 });
  };

  return (
    <button
      ref={buttonRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`transition-transform duration-300 ${className}`}
      style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
    >
      {children}
    </button>
  );
};
```

---

### Ripple Effect

**Implementation:**
```jsx
const RippleButton = ({ children, className = '' }) => {
  const [ripples, setRipples] = useState([]);

  const addRipple = (e) => {
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;
    
    const newRipple = { x, y, size, id: Date.now() };
    setRipples([...ripples, newRipple]);
    
    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== newRipple.id));
    }, 600);
  };

  return (
    <button
      onClick={addRipple}
      className={`relative overflow-hidden ${className}`}
    >
      {children}
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="absolute rounded-full bg-white/30 animate-ripple"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: ripple.size,
            height: ripple.size,
          }}
        />
      ))}
    </button>
  );
};

// Add to Tailwind config:
// keyframes: {
//   ripple: {
//     '0%': { transform: 'scale(0)', opacity: '1' },
//     '100%': { transform: 'scale(4)', opacity: '0' },
//   },
// },
// animation: {
//   ripple: 'ripple 0.6s ease-out',
// }
```

---

### Hover Lift Card

**Implementation:**
```jsx
<div className="
  group relative
  rounded-2xl bg-white p-8
  border border-gray-200
  transition-all duration-500 ease-out
  hover:shadow-2xl hover:-translate-y-4
  hover:border-blue-500/50
">
  <div className="
    absolute inset-0 rounded-2xl
    bg-gradient-to-br from-blue-500/10 to-purple-500/10
    opacity-0 transition-opacity duration-500
    group-hover:opacity-100
  " />
  
  <div className="relative z-10">
    {/* Card content */}
  </div>
</div>
```

---

### Rotating Gradient Border

**Implementation:**
```jsx
const GradientBorderCard = ({ children }) => {
  return (
    <div className="relative p-px rounded-2xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 animate-gradient">
      <div className="relative rounded-2xl bg-white p-8">
        {children}
      </div>
    </div>
  );
};

// Add to Tailwind config:
// keyframes: {
//   gradient: {
//     '0%, 100%': { backgroundPosition: '0% 50%' },
//     '50%': { backgroundPosition: '100% 50%' },
//   },
// },
// animation: {
//   gradient: 'gradient 3s ease infinite',
// }
```

---

## Number Animations

### Counting Animation

**Implementation:**
```jsx
const CountUp = ({ end, duration = 2000, suffix = '' }) => {
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const countRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          
          const startTime = Date.now();
          const startValue = 0;
          
          const updateCount = () => {
            const now = Date.now();
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function (ease-out)
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const current = Math.floor(startValue + (end - startValue) * easeOut);
            
            setCount(current);
            
            if (progress < 1) {
              requestAnimationFrame(updateCount);
            } else {
              setCount(end);
            }
          };
          
          requestAnimationFrame(updateCount);
        }
      },
      { threshold: 0.5 }
    );
    
    if (countRef.current) observer.observe(countRef.current);
    return () => observer.disconnect();
  }, [end, duration, hasAnimated]);

  return (
    <span ref={countRef} className="font-bold">
      {count.toLocaleString()}{suffix}
    </span>
  );
};
```

**Usage:**
```jsx
<div className="text-6xl">
  <CountUp end={12847} suffix="+" />
</div>
```

---

### Loading Skeleton

**Implementation:**
```jsx
const Skeleton = ({ className = '', variant = 'text' }) => {
  const variants = {
    text: 'h-4 rounded',
    title: 'h-8 rounded',
    avatar: 'h-12 w-12 rounded-full',
    button: 'h-12 w-32 rounded-xl',
  };

  return (
    <div className={`
      ${variants[variant]}
      bg-gray-200
      animate-pulse
      ${className}
    `} />
  );
};

// Usage:
<div className="space-y-4">
  <Skeleton variant="title" className="w-3/4" />
  <Skeleton variant="text" className="w-full" />
  <Skeleton variant="text" className="w-5/6" />
  <Skeleton variant="button" />
</div>
```

---

## Page Transition Animations

### Smooth Scroll to Section

**Implementation:**
```jsx
const scrollToSection = (id) => {
  const element = document.getElementById(id);
  if (element) {
    element.scrollIntoView({ 
      behavior: 'smooth',
      block: 'start',
    });
  }
};

// Usage:
<button onClick={() => scrollToSection('pricing')}>
  View Pricing
</button>
```

---

### Modal Animations

**Implementation:**
```jsx
const Modal = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="
        fixed inset-0 z-50 flex items-center justify-center
        bg-black/50 backdrop-blur-sm
        animate-fadeIn
      "
      onClick={onClose}
    >
      <div 
        className="
          relative bg-white rounded-2xl p-8 m-4
          max-w-lg w-full max-h-[90vh] overflow-y-auto
          animate-scaleIn
        "
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
        {children}
      </div>
    </div>
  );
};

// Add to Tailwind config:
// keyframes: {
//   fadeIn: {
//     '0%': { opacity: '0' },
//     '100%': { opacity: '1' },
//   },
//   scaleIn: {
//     '0%': { transform: 'scale(0.95)', opacity: '0' },
//     '100%': { transform: 'scale(1)', opacity: '1' },
//   },
// },
// animation: {
//   fadeIn: 'fadeIn 0.2s ease-out',
//   scaleIn: 'scaleIn 0.2s ease-out',
// }
```

---

## Performance Optimization

### requestAnimationFrame Pattern

**Best practice for smooth animations:**
```jsx
const AnimatedComponent = () => {
  const rafId = useRef(null);
  const [position, setPosition] = useState(0);

  const animate = () => {
    setPosition((prev) => {
      const next = prev + 1;
      return next > 100 ? 0 : next;
    });
    rafId.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    rafId.current = requestAnimationFrame(animate);
    return () => {
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, []);

  return (
    <div style={{ transform: `translateX(${position}px)` }}>
      Smoothly animated
    </div>
  );
};
```

---

### Debounced Scroll Handler

**Prevent performance issues:**
```jsx
const useScrollPosition = () => {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    let rafId = null;
    let lastScrollY = window.pageYOffset;

    const handleScroll = () => {
      if (rafId !== null) return;
      
      rafId = requestAnimationFrame(() => {
        const currentScrollY = window.pageYOffset;
        if (currentScrollY !== lastScrollY) {
          setScrollY(currentScrollY);
          lastScrollY = currentScrollY;
        }
        rafId = null;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  return scrollY;
};
```

---

## Accessibility Considerations

**Respect user preferences:**
```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

**React implementation:**
```jsx
const useReducedMotion = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (e) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return prefersReducedMotion;
};

// Usage:
const Component = () => {
  const reducedMotion = useReducedMotion();
  
  return (
    <div className={reducedMotion ? '' : 'animate-fadeIn'}>
      Content
    </div>
  );
};
```
