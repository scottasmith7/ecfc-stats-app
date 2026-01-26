/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'ecfc-blue': '#1e40af',
        'ecfc-green': '#22c55e',
        'pos-gk': '#FCD34D',
        'pos-def': '#60A5FA',
        'pos-mid': '#4ADE80',
        'pos-fwd': '#F87171',
      },
      minHeight: {
        'touch': '48px',
      },
      minWidth: {
        'touch': '48px',
      },
    },
  },
  plugins: [],
}
