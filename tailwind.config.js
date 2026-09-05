/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        canvas: '#f6f4ef',
        cream: '#efebe2',
        night: '#171516',
        ink: '#2d292a',
        'ink-muted': '#746f70',
        line: '#ddd8d0',
        crimson: '#a41034',
        'crimson-light': '#e06a85',
        'crimson-soft': '#f5e5e9',
        forest: '#1f6d55',
        gold: '#8b6719',
        'gold-soft': '#f5edda',
      },
      fontFamily: {
        display: ['"IBM Plex Sans"', 'sans-serif'],
        body: ['"IBM Plex Sans"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
