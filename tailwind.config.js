module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./public/index.html"],
  theme: {
    extend: {
      colors: {
        primary: "#ff00ff", // Neonowy różowy
        secondary: "#00ffff", // Cyjan
        accent: "#ffdd00", // Bursztynowy
        background: "#0d0a1e", // Ciemny fioletowo-niebieski
        success: "#00ff9f", // Neonowy zielony
        warning: "#ffcc00", // Żółty
        error: "#ff3366", // Różowo-czerwony
        "indigo-900": "#1a0f35", // Ciemny indygo
        "indigo-800": "#2d1a5c", // Jaśniejszy indygo
        "purple-500": "#8855ff", // Fioletowy
        "purple-700": "#5e35b1", // Ciemniejszy fioletowy
        "purple-400": "#ac80ff", // Jaśniejszy fioletowy
        "teal-700": "#00796b", // Ciemny turkusowy
        "teal-600": "#00897b", // Średni turkusowy
        "teal-500": "#009688", // Turkusowy
        "teal-400": "#26a69a", // Jaśniejszy turkusowy
        "teal-300": "#4db6ac", // Bardzo jasny turkusowy
        "amber-300": "#ffdd00", // Bursztynowy
        "amber-100": "#fff8cc", // Bardzo jasny bursztynowy
      },
      fontFamily: {
        pixel: ['"Press Start 2P"', "cursive"],
      },
      boxShadow: {
        neon: '0 0 5px theme("colors.primary"), 0 0 10px rgba(255, 0, 255, 0.5)',
        "neon-strong":
          '0 0 10px theme("colors.primary"), 0 0 20px rgba(255, 0, 255, 0.8)',
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        float: "float 5s infinite ease-in-out",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
    },
  },
  plugins: [],
};
