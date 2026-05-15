/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Wired to CSS vars set per-tenant from theme_config.
        brand: 'var(--brand-primary, #0066cc)',
        'brand-accent': 'var(--brand-secondary, #00b8d9)',
      },
    },
  },
  plugins: [],
};
