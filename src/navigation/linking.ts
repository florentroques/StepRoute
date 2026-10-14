import type { LinkingOptions } from '@react-navigation/native';

// Maps screens to URL paths so the browser address bar, back/forward buttons and
// deep links work on web. Route names stay as they are; only the paths are English.
export const linking: LinkingOptions<ReactNavigation.RootParamList> = {
  prefixes: [],
  config: {
    screens: {
      Tabs: {
        screens: {
          Accueil: '',
          Historique: 'history',
          Favoris: 'favorites',
          'Paramètres': 'settings',
        },
      },
      Map: 'route/:route',
      PrivacyPolicy: 'privacy',
    },
  },
};
