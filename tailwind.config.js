/** Tailwind build config — generates assets/tailwind.css
 *  Rebuild after editing HTML classes:  npm run build:css
 */
module.exports = {
  content: ['./*.html'],
  safelist: [
    // Classes added at runtime by page scripts (Tailwind CLI can't see these)
    'hidden',
    'font-semibold',
    'text-green-600', 'text-red-600', 'text-green-700', 'text-red-700',
    'text-green-800', 'text-orange-800', 'text-blue-700', 'text-amber-700',
    'bg-green-50', 'bg-red-50', 'bg-orange-50',
    'bg-blue-100', 'bg-amber-100', 'bg-gray-100',
    'border-green-200', 'border-red-200', 'border-orange-200',
  ],
  theme: {
    extend: {
      colors: {
        navy: '#0B1C2D',
        greybg: '#F3F5F7',
        bluebg: '#F3F5F7',
        charcoal: '#2B2E34',
        accent: '#2EC4B6',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
