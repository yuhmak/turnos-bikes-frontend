/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12'
        },
        // Panel "modo taller" (oscuro). Sobre accent el texto va negro: blanco da 3:1.
        accent: { DEFAULT: '#ff6a00', hover: '#ff8126' },
        taller: {
          bg: '#000000',
          surface: '#1c1c1c',
          surface2: '#282828',
          surface3: '#3f3f40',
          border: '#3f3f40',
          strong: '#505050',
          muted: '#adadad',
          faint: '#979899',
        },
        estado: {
          pen: '#f59e0b',
          ate: '#22c55e',
          anu: '#f87171',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        barlow: ['Barlow', 'system-ui', 'sans-serif'],
        display: ['"Barlow Condensed"', 'Barlow', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
