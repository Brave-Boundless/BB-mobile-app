import type { ImageSourcePropType } from 'react-native';

/** The website, then Brave & Boundless on social (the accounts linked from braveandboundless.com's footer). */
export interface SocialLink {
  key: 'website' | 'instagram' | 'tiktok' | 'facebook' | 'x';
  name: string;
  url: string;
  icon: ImageSourcePropType;
}

// Website: a plain globe drawn for the app. Logos: monochrome glyphs from Simple Icons (CC0), rendered to 96px white
// PNGs and tinted in the app, so no SVG library (a native module) is needed.
export const socialLinks: SocialLink[] = [
  { key: 'website', name: 'braveandboundless.com', url: 'https://braveandboundless.com', icon: require('../../assets/images/social/website.png') },
  { key: 'instagram', name: 'Instagram', url: 'https://www.instagram.com/braveandboundless/', icon: require('../../assets/images/social/instagram.png') },
  { key: 'tiktok', name: 'TikTok', url: 'https://www.tiktok.com/@braveandboundless', icon: require('../../assets/images/social/tiktok.png') },
  { key: 'facebook', name: 'Facebook', url: 'https://www.facebook.com/braveandboundless', icon: require('../../assets/images/social/facebook.png') },
  { key: 'x', name: 'X', url: 'https://x.com/BraveBoundless', icon: require('../../assets/images/social/x.png') },
];
