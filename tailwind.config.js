// tailwind.config.js
/** @type {import('tailwindcss').Config} */

// The site's accent ("amber" in class names) is Bandhani red. Each shade reads
// a CSS variable (src/index.css), so dark mode can use lighter reds.
const shades = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900];
const amber = Object.fromEntries(shades.map((shade) => [shade, `rgb(var(--amber-${shade}) / <alpha-value>)`]));

module.exports = {
  content: [
    "./public/index.html",          // optional but fine
    "./src/**/*.{js,jsx,ts,tsx}",   // ← critical for CRA + JSX
  ],
  theme: {
    extend: {
      colors: { amber },
    },
  },
  plugins: [],
}
