/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eefbf3',
          100: '#d6f5e3',
          200: '#b0eaca',
          300: '#7ad9a9',
          400: '#45c084',
          500: '#22a568',
          600: '#158554',
          700: '#116a45',
          800: '#0f5438',
          900: '#0d452f',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
