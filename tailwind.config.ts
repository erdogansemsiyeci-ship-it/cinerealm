/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cine: {
          dark: "#0f0f1a",
          card: "#1a1a2e",
          accent: "#e94560",
          gold: "#f5c518",
          muted: "#94a3b8",
        },
      },
    },
  },
  plugins: [],
};
