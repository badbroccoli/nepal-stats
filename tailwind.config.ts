import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        base: {
          950: "#050505",
          900: "#0b0b0b",
          850: "#121214",
          800: "#17181b",
          700: "#212226",
        },
        line: "#2a2b30",
        accent: {
          DEFAULT: "#3ddc97",
          muted: "#1f7a5a",
        },
        danger: "#ff5a5f",
        warn: "#ffb020",
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
