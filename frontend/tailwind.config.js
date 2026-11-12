/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'DM Sans', 'Inter', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        card: '0 1px 2px rgba(15, 23, 42, 0.04), 0 12px 32px -16px rgba(79, 70, 229, 0.22)',
        glow: '0 0 0 4px rgba(99, 102, 241, 0.12)'
      },
      backgroundImage: {
        mesh: 'radial-gradient(1200px 500px at 10% -10%, rgba(99,102,241,.35), transparent), radial-gradient(800px 400px at 100% 0%, rgba(14,165,233,.28), transparent)'
      }
    }
  },
  plugins: []
};
