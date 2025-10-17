/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./src/**/*.{html,ts}"
  ],
  theme: {
    extend: {
      colors: {
        primary: '#005f73',
        accent: '#0a9396',
        'status-active': '#2a9d8f',
        'status-inactive': '#adb5bd',
        'background-light': '#f8f9fa',
        'background-dark': '#111418',
        'text-light': '#212529',
        'text-dark': '#f8f9fa',
      },
      fontFamily: {
        "display": ["Inter", "sans-serif"]
      },
      borderRadius: {
        "DEFAULT": "0.25rem",
        "lg": "0.5rem",
        "xl": "0.75rem",
        "full": "9999px"
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms')
  ],
}

