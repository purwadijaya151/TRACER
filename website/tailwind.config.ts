import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: "#1A2B5F",
          light: "#2E4080",
          50: "#F0F2F8"
        },
        gold: {
          DEFAULT: "#C9A84C",
          light: "#E8D5A3"
        }
      },
      fontFamily: {
        sans: ["var(--font-dm-sans)", "DM Sans", "sans-serif"],
        heading: ["var(--font-poppins)", "Poppins", "sans-serif"]
      },
      boxShadow: {
        soft: "0 2px 8px rgba(0, 0, 0, 0.08)",
        overlay: "0 20px 60px rgba(21, 28, 39, 0.22)"
      }
    }
  },
  plugins: []
};

export default config;
