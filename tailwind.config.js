/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#080808',
        surface: '#111111',
        border: '#222222',
        muted: '#555555',
        subtle: '#cccccc',
        accent: '#00ff87',
        secondary: '#ffffff',
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
