const { palette } = require('./src/theme/palette');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    // The brand is square: radius-0 is its only radius (B&B Design System).
    borderRadius: { none: '0px', DEFAULT: '0px', sm: '0px', md: '0px', lg: '0px', xl: '0px', '2xl': '0px', full: '0px' },
    extend: {
      colors: palette,
      fontFamily: {
        // Brandon Grotesque is the brand face (licensed; files pending from Mark).
        // Until then, Jost — a free geometric sans — stands in. Swap in src/theme/fonts.ts.
        sans: ['Jost_400Regular'],
        medium: ['Jost_500Medium'],
        bold: ['Jost_700Bold'],
      },
    },
  },
  plugins: [],
};
