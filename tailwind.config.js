export default {
  darkMode: 'class',
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'primary': {
          50: '#fcfaf7',
          100: '#f7f2ea',
          200: '#eae0cf',
          300: '#d7c4a9',
          400: '#bfa580',
          500: '#ab8b5e',
          600: '#9c7a4f',
          700: '#81623f',
          800: '#694e33',
          900: '#57402c',
          950: '#312317',
        },
        'accent': {
          50: '#fafaf9',
          100: '#f5f5f4',
          200: '#e7e5e4',
          300: '#d6d3d1',
          400: '#a8a29e',
          500: '#78716c',
          600: '#57534e',
          700: '#44403c',
          800: '#292524',
          900: '#1c1917',
          950: '#0c0a09',
        },
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'Avenir', 'Helvetica', 'Arial', 'sans-serif'],
      },
      keyframes: {
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-5px)' },
          '20%, 40%, 60%, 80%': { transform: 'translateX(5px)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-down': {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'glow': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(171, 139, 94, 0.3)' },
          '50%': { boxShadow: '0 0 30px rgba(171, 139, 94, 0.5)' },
        },
      },
      animation: {
        shake: 'shake 0.8s cubic-bezier(.36,.07,.19,.97) both',
        'fade-in': 'fade-in 0.5s ease-in-out',
        'slide-down': 'slide-down 0.4s ease-out',
        'slide-up': 'slide-up 0.4s ease-out',
        'glow': 'glow 2s ease-in-out infinite',
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'sm-glow': '0 4px 15px rgba(171, 139, 94, 0.15)',
        'md-glow': '0 8px 25px rgba(171, 139, 94, 0.25)',
        'lg-glow': '0 12px 35px rgba(171, 139, 94, 0.35)',
        'xl-glow': '0 16px 45px rgba(171, 139, 94, 0.4)',
      },
    },
  },
  plugins: [],
} 