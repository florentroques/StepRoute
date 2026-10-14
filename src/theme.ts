import { ColorSchemeName, useColorScheme } from 'react-native';
import { ThemePreference } from './store/useStore';

export function useAppScheme(preference: ThemePreference): ColorSchemeName {
  const systemScheme = useColorScheme();
  if (preference === 'system') return systemScheme;
  return preference;
}

// Every text colour reaches WCAG AAA (7:1) on each surface it is drawn on, in both modes.
// `controlBorder` outlines inputs and buttons that sit on a similar surface so they stay
// at 3:1 or more (WCAG 1.4.11). Filled buttons use `onAccent` / `onDanger` for their label.
export function getColors(scheme: ColorSchemeName) {
  const dark = scheme === 'dark';
  return {
    bg: dark ? '#0F1A24' : '#f2f7f2',
    card: dark ? '#182333' : '#fff',
    cardAlt: dark ? '#1E2D3F' : '#eef5ee',
    text: dark ? '#f0f0f0' : '#1a1a1a',
    subtext: dark ? '#b4cfdc' : '#2f4a39',
    muted: dark ? '#a3bccb' : '#35503f',
    border: dark ? '#1E2D3F' : '#d8ead8',
    separator: dark ? '#1E2D3F' : '#e4f0e4',
    controlBorder: dark ? '#7f9db0' : '#5f7a67',
    segmentBg: dark ? '#1E2D3F' : '#dceadc',
    tabBar: dark ? '#182333' : '#fff',
    tabBarBorder: dark ? '#1E2D3F' : '#d8ead8',
    accent: dark ? '#8fe07c' : '#165a14',
    onAccent: dark ? '#0a1410' : '#fff',
    danger: dark ? '#ffa59b' : '#8f1a1a',
    onDanger: dark ? '#1a0806' : '#fff',
    position: dark ? '#8ab8ff' : '#0050c8',
  };
}
