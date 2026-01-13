import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/lib/**/*.{ts,tsx}",
  ],
  theme: {
  	extend: {
  		colors: {
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		fontFamily: {
  			sans: [
  				'var(--font-sans)',
  				'Inter',
  				'system-ui',
  				'sans-serif'
  			],
  			mono: [
  				'SFMono-Regular',
  				'monospace'
  			],
  			clean: [
  				'var(--font-clean)',
  				'system-ui',
  				'sans-serif'
  			],
  			professional: [
  				'var(--font-professional)',
  				'system-ui',
  				'sans-serif'
  			],
  			developer: [
  				'var(--font-developer)',
  				'monospace'
  			],
  			bold: [
  				'var(--font-bold)',
  				'system-ui',
  				'sans-serif'
  			],
  			friendly: [
  				'var(--font-friendly)',
  				'system-ui',
  				'sans-serif'
  			],
  			edgy: [
  				'var(--font-edgy)',
  				'system-ui',
  				'sans-serif'
  			],
  			technical: [
  				'var(--font-technical)',
  				'system-ui',
  				'sans-serif'
  			],
  			premium: [
  				'var(--font-premium)',
  				'ui-serif',
  				'Georgia',
  				'serif'
  			]
  		},
  		keyframes: {
  			'sheet-overlay-show': {
  				from: {
  					opacity: '0'
  				},
  				to: {
  					opacity: '1'
  				}
  			},
  			'sheet-overlay-hide': {
  				from: {
  					opacity: '1'
  				},
  				to: {
  					opacity: '0'
  				}
  			},
  			'sheet-slide-up': {
  				from: {
  					transform: 'translateY(12%)',
  					opacity: '0'
  				},
  				to: {
  					transform: 'translateY(0)',
  					opacity: '1'
  				}
  			},
  			'sheet-slide-down': {
  				from: {
  					transform: 'translateY(0)',
  					opacity: '1'
  				},
  				to: {
  					transform: 'translateY(12%)',
  					opacity: '0'
  				}
  			},
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			}
  		},
  		animation: {
  			'sheet-overlay-show': 'sheet-overlay-show 180ms ease',
  			'sheet-overlay-hide': 'sheet-overlay-hide 220ms ease',
  			'sheet-slide-up': 'sheet-slide-up 260ms cubic-bezier(0.33, 1, 0.68, 1)',
  			'sheet-slide-down': 'sheet-slide-down 220ms cubic-bezier(0.33, 1, 0.68, 1)',
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out'
  		}
  	}
  },
  plugins: [],
};

export default config;
