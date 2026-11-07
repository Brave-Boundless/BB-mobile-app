// Brave & Boundless palette — from the B&B Design System (tokens.json,
// 2026-10-13): black #0E0D0C ground, bone #f5f0e8 ink, orange #F17225 accent,
// crimson #8A1C1C, gold #C8A24A. Plain CommonJS so both tailwind.config.js
// and app code can import it.
//
// Token names (charcoal/bone/ash/ember) are kept from the first build so every
// screen picks up the brand values; the mapping is:
//   charcoal.950 = brand `black`   bone = brand `bone`   ash = brand `muted`
//   ember        = brand `orange`  crimson / gold        = brand colours
// charcoal.900–700 are bone laid over black at 5/10/20% — flat fields, not tints.
//
// Every text/background pair the UI uses is listed in TEXT_PAIRS and checked
// for WCAG contrast >= 4.5:1 in src/theme/__tests__/contrast.test.ts.
// Crimson on black is 2.1:1, so crimson never sits on the dark ground. The
// stamps use lightened inks instead (src/features/stamps/stamps.ts).

/** @type {const} */
const palette = {
  charcoal: {
    950: '#0E0D0C', // brand black: app ground
    900: '#1A1817', // cards, tab bar
    800: '#252422', // raised surfaces, pressed states
    700: '#3C3A38', // hairlines, borders
  },
  bone: '#F5F0E8', // brand bone: primary text; passport-page ground
  ash: '#B8B2A8', // brand muted: secondary text
  ember: {
    DEFAULT: '#F17225', // brand orange: the one accent
    soft: '#F17225', // accent text on dark (brand orange passes 6.6:1)
    // Rule-map shades of the accent (pre-blended on black).
    mid: '#964A1B', // mostly done
    dim: '#472612', // mostly dodged
  },
  // The four parts' colours, from the book and braveandboundless.com (book
  // page part cards). Tiles behind the pillar icons; never behind body text.
  part: {
    fire: '#800717',
    forge: '#C9512A',
    foundation: '#4E5C5F',
    field: '#47553C',
  },
  // Each part's colour lightened (same hue) until it reads on black at
  // >= 4.5:1, for the part-name headline. The exact colours above are 1.8-4.3:1.
  partText: {
    fire: '#D64A5D', // softer than the first pick, #F31C38 (Mark: too bright)
    forge: '#D1542C',
    foundation: '#6C7F83',
    field: '#6C825C',
  },
  crimson: '#8A1C1C', // stamp ink, on bone only
  gold: '#C8A24A', // brand gold
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
  ['charcoal.950', 'ember.DEFAULT'], // label on a filled orange button
  ['bone', 'ember.mid'], // rule-map cell text
  ['bone', 'ember.dim'], // rule-map cell text
  ['crimson', 'bone'], // stamp ink on the passport page
  ['charcoal.950', 'bone'], // text on the passport page
  ['charcoal.950', 'gold'],
  ['partText.fire', 'charcoal.950'], // part-name headlines (Rules list, milestones)
  ['partText.forge', 'charcoal.950'],
  ['partText.foundation', 'charcoal.950'],
  ['partText.field', 'charcoal.950'],
];

module.exports = { palette, TEXT_PAIRS };
