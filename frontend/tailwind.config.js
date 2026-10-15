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
          50:  '#f2f8f4',
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
        sage: {
          50:  '#f0faf4',
          100: '#d8f3dc',
          200: '#b7e4c7',
          300: '#74c69d',
          400: '#52b788',
          500: '#40916c',
          600: '#2d6a4f',
          700: '#1b4332',
          800: '#163326',
          900: '#0d1f17',
        },
        bark: {
          50:  '#fdf8f2',
          100: '#f7edde',
          200: '#ede0d4',
          300: '#d4a574',
          400: '#b07540',
          500: '#7f4f24',
          600: '#582f0e',
          700: '#3f1f08',
        },
      },
      fontFamily: {
        sans:    ['Sora', 'Outfit', 'sans-serif'],
        display: ['Fraunces', 'Georgia', 'serif'],
        sora:    ['Sora', 'sans-serif'],
      },
      boxShadow: {
        'forest-sm':  '0 2px 8px rgba(45,106,79,0.18)',
        'forest-md':  '0 8px 24px rgba(45,106,79,0.22)',
        'forest-lg':  '0 16px 48px rgba(45,106,79,0.28)',
        'nature-glow': '0 0 24px rgba(132,212,167,0.2)',
      },
      borderRadius: {
        'xl2': '1.25rem',
        'xl3': '1.5rem',
        'xl4': '2rem',
      },
    },
  },
  plugins: [],
}
