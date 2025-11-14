/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {colors: {
      primary: {500: '#D600FF', 
               600: '#C000E0'
    },
    'gray-800': '#1A1A1A',
        'gray-900': '#111111',

    }},
  },
  plugins: [],
}

