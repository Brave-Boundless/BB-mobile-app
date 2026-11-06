// Brave & Boundless palette — dark theme first.
// Ember/charcoal with a single warm accent (ember). Plain CommonJS so both
// tailwind.config.js and app code can import it.
//
// Every text/background pair the UI uses is listed in TEXT_PAIRS and checked
// for WCAG contrast >= 4.5:1 in src/theme/__tests__/contrast.test.ts.

/** @type {const} */
const palette = {
  charcoal: {
    950: '#0F0D0C', // app background
    900: '#1A1716', // cards, tab bar
    800: '#26211F', // raised surfaces, pressed states
    700: '#3A3330', // hairlines, borders
  },
  bone: '#F3EEE7', // primary text
  ash: '#A89F96', // secondary text
  ember: {
    DEFAULT: '#F06A2A', // the one accent: primary actions, active tab
    soft: '#F58A55', // accent text on dark surfaces
  },
};

/** Foreground/background pairs that must meet 4.5:1. */
const TEXT_PAIRS = [
  ['bone', 'charcoal.950'],
  ['bone', 'charcoal.900'],
  ['bone', 'charcoal.800'],
  ['ash', 'charcoal.950'],
  ['ash', 'charcoal.900'],
  ['ember.soft', 'charcoal.950'],
  ['ember.soft', 'charcoal.900'],
  ['ember.DEFAULT', 'charcoal.950'],
  ['charcoal.950', 'ember.DEFAULT'], // label on a filled ember button
];

module.exports = { palette, TEXT_PAIRS };
