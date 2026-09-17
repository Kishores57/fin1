/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          50: '#f2f8f4',
          100: '#e1efe6',
          200: '#c5dfd0',
          300: '#9bc6ad',
          400: '#6ca786',
          500: '#4c8b67',
          600: '#397050',
          700: '#2f5a41',
          800: '#274835',
          900: '#213c2d',
          950: '#112219',
        },
      },
      fontFamily: {
        sans: ['Sora', 'Outfit', 'sans-serif'],
        display: ['Fraunces', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
}
