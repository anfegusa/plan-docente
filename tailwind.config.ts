import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: { dark: "#1B3A5C", mid: "#2E75B6", light: "#D6E4F0", bg: "#F0F2F5" },
        ok: { DEFAULT: "#92D050", dark: "#548235" },
        warn: "#FFC000",
        err: "#E63946",
        ora: "#ED7D31",
        pur: "#7C3AED",
        muted: "#6B7280",
      },
    },
  },
  plugins: [],
};
export default config;
