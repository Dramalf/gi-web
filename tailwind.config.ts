import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: "#1d9bf0",
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};

export default config;
