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
      },
      fontFamily: {
        'sans': ['Quicksand', 'sans-serif'],
        'quicksand': ['Quicksand', 'sans-serif'],
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}