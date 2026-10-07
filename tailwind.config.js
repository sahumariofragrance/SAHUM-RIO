// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./public/index.html",          // optional but fine
    "./src/**/*.{js,jsx,ts,tsx}",   // ← critical for CRA + JSX
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}