/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: "#0f172a",       // slate-900
          card: "#1e293b",     // slate-800
          border: "#334155",   // slate-700
          highlight: "#0284c7" // sky-600
        }
      }
    },
  },
  plugins: [],
}
