import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        mv: {
          primary: '#6B4EFF',
          yellow: '#FFD84D',
          teal: '#5CE1E6',
          lavender: '#D9CFFF',
          green: '#5FD38D',
          dark: '#1C1F2E',
          light: '#F8F8FF',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-fredoka)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
