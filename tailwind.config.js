/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#FFC72C",
          50: "#FFFAF0",
          100: "#FFF6E0",
          200: "#FFEDC2",
          300: "#FFE4A3",
          400: "#FFDB85",
          500: "#FFC72C",
          600: "#EBB200",
          700: "#BD8F00",
          800: "#8F6C00",
          900: "#614800",
        },
      },
    },
  },
  plugins: [],
};
