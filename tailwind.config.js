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
        'moone-purple': '#a855f7',
        'moone-lilac': '#c4b5fd',
        'moone-lilac-light': '#ddd6fe',
        'moone-slate': '#475569',
        'moone-slate-light': '#64748b',
      },
      fontFamily: {
        'sans': ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        'inter': ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
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