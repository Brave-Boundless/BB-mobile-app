const { palette } = require('./src/theme/palette');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
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
