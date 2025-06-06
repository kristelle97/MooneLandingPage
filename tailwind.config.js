/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,js,jsx,ts,tsx,vue}",
    "./index.html",
    "./*.html",
    "./_includes/**/*.{html,js,md}",
    "_site/**/*.html"
  ],
  theme: {
    extend: {
      colors: {
        'moone-purple': '#a854f7',
        'moone-aubergine': '#4a2c5a',
        'moone-aubergine-light': '#6b5b7a',
        'moone-peach-light': '#fff1ec',
        'moone-peach':'#f8c3a0'
      },
      fontFamily: {
        'sans': ['Quicksand', 'sans-serif'],
        'quicksand': ['Quicksand', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      }
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}