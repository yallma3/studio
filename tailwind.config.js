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
      keyframes: {
        dropdown: {
          "0%": { opacity: 0, transform: "scale(0.95)" },
          "100%": { opacity: 1, transform: "scale(1)" },
        },
        "fade-in-up": {
          "0%": { opacity: 0, transform: "translateY(10px) translateX(-50%)" },
          "100%": { opacity: 1, transform: "translateY(0) translateX(-50%)" },
        },
        "fade-out-down": {
          "0%": { opacity: 1, transform: "translateY(0) translateX(-50%)" },
          "100%": {
            opacity: 0,
            transform: "translateY(10px) translateX(-50%)",
          },
        },
      },
      animation: {
        dropdown: "dropdown 0.2s ease-out",
        "fade-in-up": "fade-in-up 0.3s ease-out forwards",
        "fade-out-down": "fade-out-down 0.3s ease-out forwards",
      },
    },
  },
  plugins: [],
};
