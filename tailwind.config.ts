import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#16211D",
        cream: "#F6F0E6",
        sage: "#9BAE93",
        terracotta: "#C96B4B",
        moss: "#365448",
        sand: "#E8DDCD"
      },
      fontFamily: { display: ["Georgia", "serif"] },
      boxShadow: { soft: "0 20px 60px rgba(30,33,30,.12)" }
    }
  },
  plugins: []
};
export default config;
