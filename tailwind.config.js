/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      screens: {
        'xs': '375px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
      },
      colors: {
        // Ana renk paleti - modernize edilmiş
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          950: '#082f49',
        },
        // Gece mavi - koyu tema için özel palet
        nightblue: {
          50: '#f0f4fd',
          100: '#e0e9fa',
          200: '#c7d7f6',
          300: '#9fbcee',
          500: '#3b68d9',
          600: '#2e53cf',
          700: '#2542b8',
          800: '#233996',
          900: '#1e2e6d',
          950: '#162154',
        },
        // Yumuşak koyu - koyu tema ana arka plan için
        softdark: {
          950: '#0f172a',
          900: '#1e293b',
          850: '#263449',
          800: '#334155',
          700: '#475569',
          600: '#64748b',
          500: '#94a3b8',
          400: '#cbd5e1',
        },
        // Koyu tema için iyileştirilmiş renkler
        dark: {
          primary: '#f8fafc',       // Ana metin rengi
          secondary: '#e2e8f0',     // İkincil metin rengi
          muted: '#94a3b8',         // Soluk metin rengi
          accent: '#1e293b',        // Vurgu background
          'accent-hover': '#334155', // Vurgu hover durumu
          card: '#1e293b',          // Kart arka planı
          input: '#0f172a',         // Giriş alanları
          hover: '#334155',         // Hover durumu
          border: '#334155',        // Kenarlık rengi
          panel: '#0f172a',         // Panel arka planı
          'card-light': '#293548',  // Daha açık kart arka planı
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
      },
      backgroundColor: {
        dark: {
          primary: '#111827', // Daha koyu ana arka plan
          secondary: '#1f2937', // Bileşen arka planları için
          accent: '#374151', // Vurgu öğeleri için
          hover: '#2a3341', // Hover arka planları için
          card: '#1e293b', // Kart arka planları için
          input: '#2d3748', // Input arka planları için
        }
      },
      textColor: {
        dark: {
          primary: '#f3f4f6', // Ana metin
          secondary: '#e5e7eb', // İkincil metin rengi
          muted: '#9ca3af', // Soluk metin rengi
          hover: '#f9fafb', // Hover metin rengi
          accent: '#60a5fa', // Vurgu metin rengi
        }
      },
      borderColor: {
        dark: {
          DEFAULT: '#374151',
          accent: '#4b5563',
          focus: '#60a5fa',
        }
      },
      boxShadow: {
        'soft-xl': '0 20px 27px 0 rgba(0, 0, 0, 0.05)',
        'soft-md': '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.05)',
        'dark-md': '0 4px 6px -1px rgba(0, 0, 0, 0.2), 0 2px 4px -1px rgba(0, 0, 0, 0.1)',
        'dark-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2)',
        'glow-sm': '0 0 5px rgba(59, 130, 246, 0.3)',
        'glow-md': '0 0 15px rgba(59, 130, 246, 0.4)',
        'glow-lg': '0 0 25px rgba(59, 130, 246, 0.5)',
        'glow-dark-sm': '0 0 5px rgba(37, 99, 235, 0.3)',
        'glow-dark-md': '0 0 15px rgba(37, 99, 235, 0.4)',
        'glow-dark-lg': '0 0 25px rgba(37, 99, 235, 0.5)',
        'elevation-1': '0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.1)',
        'elevation-2': '0 3px 6px rgba(0, 0, 0, 0.1), 0 3px 6px rgba(0, 0, 0, 0.05)',
        'elevation-3': '0 10px 20px rgba(0, 0, 0, 0.1), 0 6px 6px rgba(0, 0, 0, 0.05)',
        'elevation-4': '0 14px 28px rgba(0, 0, 0, 0.15), 0 10px 10px rgba(0, 0, 0, 0.05)',
        'inset-1': 'inset 0 1px 3px rgba(0, 0, 0, 0.1), inset 0 1px 2px rgba(0, 0, 0, 0.06)',
        'inset-2': 'inset 0 2px 5px rgba(0, 0, 0, 0.15), inset 0 1px 3px rgba(0, 0, 0, 0.1)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'fade-in-up': 'fadeInUp 0.4s ease-out',
        'fade-in-down': 'fadeInDown 0.4s ease-out',
        'fade-in-left': 'fadeInLeft 0.4s ease-out',
        'fade-in-right': 'fadeInRight 0.4s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'slide-in-left': 'slideInLeft 0.3s ease-out',
        'slide-in-up': 'slideInUp 0.3s ease-out',
        'slide-in-down': 'slideInDown 0.3s ease-out',
        'zoom-in': 'zoomIn 0.3s ease-out forwards',
        'zoom-out': 'zoomOut 0.3s ease-in forwards',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-slow': 'bounce 2s infinite',
        'expand': 'expand 0.3s ease-out forwards',
        'float': 'float 3s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'spin-slow': 'spin 3s linear infinite',
        'shake': 'shake 0.82s cubic-bezier(.36,.07,.19,.97) both',
        'scale': 'scale 0.5s ease-in-out infinite alternate',
        'pop': 'pop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'wiggle': 'wiggle 1s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
        fadeInUp: {
          '0%': { opacity: 0, transform: 'translateY(10px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        fadeInDown: {
          '0%': { opacity: 0, transform: 'translateY(-10px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        fadeInLeft: {
          '0%': { opacity: 0, transform: 'translateX(-10px)' },
          '100%': { opacity: 1, transform: 'translateX(0)' },
        },
        fadeInRight: {
          '0%': { opacity: 0, transform: 'translateX(10px)' },
          '100%': { opacity: 1, transform: 'translateX(0)' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(100%)', opacity: 0 },
          '100%': { transform: 'translateX(0)', opacity: 1 },
        },
        slideInLeft: {
          '0%': { transform: 'translateX(-100%)', opacity: 0 },
          '100%': { transform: 'translateX(0)', opacity: 1 },
        },
        slideInUp: {
          '0%': { transform: 'translateY(100%)', opacity: 0 },
          '100%': { transform: 'translateY(0)', opacity: 1 },
        },
        slideInDown: {
          '0%': { transform: 'translateY(-100%)', opacity: 0 },
          '100%': { transform: 'translateY(0)', opacity: 1 },
        },
        zoomIn: {
          '0%': { transform: 'scale(0.95)', opacity: 0 },
          '100%': { transform: 'scale(1)', opacity: 1 },
        },
        zoomOut: {
          '0%': { transform: 'scale(1)', opacity: 1 },
          '100%': { transform: 'scale(0.95)', opacity: 0 },
        },
        expand: {
          '0%': { transform: 'scale(0.95)', opacity: 0 },
          '100%': { transform: 'scale(1)', opacity: 1 },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
        shake: {
          '10%, 90%': { transform: 'translate3d(-1px, 0, 0)' },
          '20%, 80%': { transform: 'translate3d(2px, 0, 0)' },
          '30%, 50%, 70%': { transform: 'translate3d(-4px, 0, 0)' },
          '40%, 60%': { transform: 'translate3d(4px, 0, 0)' },
        },
        scale: {
          '0%': { transform: 'scale(1)' },
          '100%': { transform: 'scale(1.05)' },
        },
        pop: {
          '0%': { transform: 'scale(0.95)', opacity: 0 },
          '40%': { transform: 'scale(1.02)', opacity: 1 },
          '100%': { transform: 'scale(1)', opacity: 1 },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'dot-pattern': 'radial-gradient(circle, #64748b 1px, transparent 1px)',
        'mesh-pattern': 'linear-gradient(0deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)',
        'grid-pattern': 'linear-gradient(to right, rgba(25, 25, 25, 0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(25, 25, 25, 0.03) 1px, transparent 1px)',
        'shimmer-light': 'linear-gradient(to right, rgba(255, 255, 255, 0) 0, rgba(255, 255, 255, 0.2) 20%, rgba(255, 255, 255, 0.5) 60%, rgba(255, 255, 255, 0))',
        'shimmer-dark': 'linear-gradient(to right, rgba(255, 255, 255, 0) 0, rgba(255, 255, 255, 0.1) 20%, rgba(255, 255, 255, 0.2) 60%, rgba(255, 255, 255, 0))',
        'glass-light': 'linear-gradient(135deg, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0.1) 100%)',
        'glass-dark': 'linear-gradient(135deg, rgba(20, 24, 33, 0.6) 0%, rgba(20, 24, 33, 0.2) 100%)',
      },
      backgroundSize: {
        'dot-lg': '20px 20px',
        'mesh-lg': '20px 20px',
        'grid-sm': '15px 15px',
        'grid-md': '30px 30px',
        'shimmer': '1000px 100%',
      },
      backdropBlur: {
        xs: '2px',
      },
      transitionProperty: {
        'height': 'height',
        'spacing': 'margin, padding',
        'width': 'width',
        'size': 'height, width',
        'position': 'top, right, bottom, left',
        'border': 'border-width, border-color',
        'all-transform': 'transform, opacity, filter, background-color, border-color, color, fill, stroke',
      },
      transitionDuration: {
        '0': '0ms',
        '400': '400ms',
        '600': '600ms',
        '800': '800ms',
        '1200': '1200ms',
        '1600': '1600ms',
        '2000': '2000ms',
      },
      transitionTimingFunction: {
        'bounce': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'soft': 'cubic-bezier(0.45, 0, 0.55, 1)',
        'snappy': 'cubic-bezier(0.5, 0, 0.1, 1)',
        'ease-out-back': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'elastic': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      },
    },
  },
  plugins: [],
} 