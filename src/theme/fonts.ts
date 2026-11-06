import { Jost_400Regular, Jost_500Medium, Jost_700Bold } from '@expo-google-fonts/jost';

// Stand-in for Brandon Grotesque until Mark supplies the licensed files.
// To swap: drop the .otf files in assets/fonts/, map them here under the same
// keys' roles, and update fontFamily in tailwind.config.js.
export const appFonts = {
  Jost_400Regular,
  Jost_500Medium,
  Jost_700Bold,
};

export const fontFamily = {
  regular: 'Jost_400Regular',
  medium: 'Jost_500Medium',
  bold: 'Jost_700Bold',
} as const;
