/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#0B0F19',
        surface: {
          DEFAULT: '#111827',
          elevated: '#1E293B',
          highlight: '#334155',
          low: '#171B26',
          card: '#111827',
          highest: '#313540',
        },
        primary: {
          DEFAULT: '#635BFF',
          hover: '#7A74FF',
          dark: '#4C42E9',
          container: '#635BFF',
          glow: 'rgba(99, 91, 255, 0.25)',
        },
        secondary: {
          DEFAULT: '#8B5CF6',
          hover: '#9D78F7',
          container: '#571BC1',
        },
        accent: {
          cyan: '#06B6D4',
          emerald: '#10B981',
          amber: '#F59E0B',
          rose: '#EF4444',
        },
        content: {
          primary: '#F8FAFC',
          secondary: '#C7C4D8',
          muted: '#94A3B8',
          dim: '#64748B',
        },
      },
      fontFamily: {
        heading: ['"Plus Jakarta Sans"', 'sans-serif'],
        sans: ['Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        glass: '0 4px 20px -2px rgba(0, 0, 0, 0.5)',
        glow: '0 0 20px -2px rgba(99, 91, 255, 0.35)',
        'glow-lg': '0 0 30px -4px rgba(99, 91, 255, 0.55)',
        card: '0 12px 28px -4px rgba(0, 0, 0, 0.65)',
      },
      borderRadius: {
        '2xl': '1rem',
        xl: '0.75rem',
        lg: '0.5rem',
      },
      maxWidth: {
        'content-max': '90rem',
      },
    },
  },
  plugins: [],
};
