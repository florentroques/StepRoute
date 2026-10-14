const STYLE_URL_LIGHT = 'https://tiles.openfreemap.org/styles/liberty';
const STYLE_URL_DARK = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

export function getMapStyleUrl(dark: boolean): string {
  return dark ? STYLE_URL_DARK : STYLE_URL_LIGHT;
}
