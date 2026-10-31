// tailwind.config.js
// The site's warm "amber" and "orange" utilities (buttons, links, focus rings)
// are remapped to the midnight palette: #CCD0CF misty grey, #4A5C6A slate,
// #253745, #11212D and #06141B night blues.
const midnight = {
  50: "#EEF1F1",
  100: "#DDE1E0",
  200: "#CCD0CF",
  300: "#9BA8AB",
  400: "#7A8B95",
  500: "#5E707D",
  600: "#4A5C6A",
  700: "#3A4B58",
  800: "#253745",
  900: "#11212D",
  950: "#06141B",
};

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./public/index.html",          // optional but fine
    "./src/**/*.{js,jsx,ts,tsx}",   // ← critical for CRA + JSX
  ],
  theme: {
    extend: {
      colors: { amber: midnight, orange: midnight },
    },
  },
  plugins: [],
}
