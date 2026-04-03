/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        heading: ['Syne', 'sans-serif'],
        body: ['DM Sans', 'sans-serif'],
      },
      colors: {
        navy: {
          950: '#030712',
          900: '#0a0f1e',
          800: '#0f172a',
          700: '#1e2a45',
        },
        cyan: {
          400: '#22d3ee',
          500: '#06b6d4',
        }
      }
    },
  },
  plugins: [],
}