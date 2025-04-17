/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,js,jsx,ts,tsx,vue}",
    "./index.html",
    "./*.html"
  ],
  theme: {
    extend: {
      colors: {
        'moone-purple': '#a854f7',
      }
    },
  },
  plugins: [],
}