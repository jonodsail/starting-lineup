/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        void: '#0a0a0f',
        surface: '#12121a',
        border: '#1e1e2e',
        muted: '#4a4a6a',
        subtle: '#e0e0ff',
        accent: '#00d4ff',
        secondary: '#ff6b35',
        purple: '#7c3aed',
      },
      fontFamily: {
        display: ['"Bebas Neue"', 'sans-serif'],
        body: ['"IBM Plex Sans"', 'sans-serif'],
      },
      keyframes: {
        'slide-in': {
          from: { transform: 'translateX(100%)' },
          to: { transform: 'translateX(0)' },
        },
      },
      animation: {
        'slide-in': 'slide-in 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
}
