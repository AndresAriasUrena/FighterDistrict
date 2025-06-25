import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        'raven-light': ['RavenHell-LightGothic', 'sans-serif'],
        'raven-regular': ['RavenHell-RegularGothic', 'sans-serif'],
        'raven-medium': ['RavenHell-MediumGothic', 'sans-serif'],
        'raven-bold': ['RavenHell-BoldGothic', 'sans-serif'],
        'raven-black': ['RavenHell-BlackGothic', 'sans-serif'],
        'urbanist': ['Urbanist', 'sans-serif'],
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
    },
  },
  plugins: [],
} satisfies Config

export default config 