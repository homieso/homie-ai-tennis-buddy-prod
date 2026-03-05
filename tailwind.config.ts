import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        "primary-light": "var(--primary-light)",
        "secondary-light": "var(--secondary-light)",
        "accent-blue": "var(--accent-blue)",
        "accent-purple": "var(--accent-purple)",
        "accent-green": "var(--accent-green)",
        "accent-pink": "var(--accent-pink)",
        "accent-yellow": "var(--accent-yellow)",
        "bg-light": "var(--bg-light)",
        "text-soft": "var(--text-soft)",
      },
      fontFamily: {
        quicksand: ["Quicksand", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
