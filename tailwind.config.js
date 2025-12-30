/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Microsoft YaHei"', '"微软雅黑"', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'sans-serif'],
        mono: ['"Microsoft YaHei"', '"微软雅黑"', 'Consolas', '"Courier New"', 'monospace'],
      },
      colors: {
        stone: {
          50: '#fafaf9',
          100: '#f5f5f4',
          200: '#e7e5e4',
          500: '#78716c',
          900: '#1c1917',
        },
        emerald: {
          500: '#10b981',
          700: '#047857',
        },
        amber: {
          700: '#b45309',
        },
        void: '#000000',
        ash: '#be123c',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shatter': 'shatter 0.5s ease-out forwards',
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'slide-down': 'slideDown 0.3s ease-out forwards',
        'breathe-slow': 'breathe 10s ease-in-out infinite',
      },
      keyframes: {
        shatter: {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '100%': { transform: 'scale(1.1)', opacity: '0', filter: 'blur(4px)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        breathe: {
          '0%': { transform: 'scale(0.5) rotate(0deg)', opacity: '0.6' },
          '40%': { transform: 'scale(1.1) rotate(45deg)', opacity: '1' },
          '100%': { transform: 'scale(0.5) rotate(0deg)', opacity: '0.6' },
        }
      }
    },
  },
  plugins: [],
}
