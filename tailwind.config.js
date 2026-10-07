import containerQueries from "@tailwindcss/container-queries";
import plugin from "tailwindcss/plugin";
import colors from "tailwindcss/colors";

// ─── Light-theme tint overrides ───
// Dark-tuned translucent fills (bg-X-900/50) and borders (border-X-700) turn muddy on white.
// In data-theme="light" remap them to pale tints; solid fills (no opacity) are left alone.
const TINT_HUES = ["amber", "yellow", "orange", "red", "rose", "emerald", "green", "lime", "teal", "cyan", "sky", "blue", "violet", "purple", "fuchsia", "gray", "slate", "zinc", "stone", "neutral"];
const TINT_OPACITIES = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 60, 70, 80];

const toRgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(" ");

const lightTints = plugin(({ addBase }) => {
  const rules = {};
  for (const hue of TINT_HUES) {
    const palette = colors[hue];
    for (const shade of [700, 800, 900, 950]) {
      for (const pct of TINT_OPACITIES) {
        const alpha = Math.min(0.9, 0.3 + (pct / 100) * 1.2).toFixed(2);
        rules[`[data-theme="light"] .bg-${hue}-${shade}\\/${pct}`] = {
          backgroundColor: `rgb(${toRgb(palette[100])} / ${alpha})`,
        };
      }
    }
    for (const shade of [600, 700, 800, 900]) {
      rules[`[data-theme="light"] .border-${hue}-${shade}`] = { borderColor: palette[400] };
      for (const pct of TINT_OPACITIES) {
        const alpha = Math.min(1, 0.4 + (pct / 100) * 1.2).toFixed(2);
        rules[`[data-theme="light"] .border-${hue}-${shade}\\/${pct}`] = {
          borderColor: `rgb(${toRgb(palette[400])} / ${alpha})`,
        };
      }
    }
  }
  addBase(rules);
});

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [containerQueries, lightTints],
};
