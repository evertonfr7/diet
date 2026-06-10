import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#3a0d1b',
          50: '#fce8ed',
          100: '#f0bfca',
          200: '#da8fa4',
          300: '#be5e7a',
          400: '#9b3354',
          500: '#6b1a34',
          600: '#3a0d1b',
          700: '#26080f',
          800: '#180507',
          900: '#130407',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
