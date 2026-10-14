import type { NavigatorScreenParams } from '@react-navigation/native';

export type TabParamList = {
  Accueil: undefined;
  Historique: undefined;
  Favoris: undefined;
  'Paramètres': undefined;
};

export type RootStackParamList = {
  Tabs: NavigatorScreenParams<TabParamList> | undefined;
  /** `route` is the whole route, encoded by `encodeRoute`, so a URL is self-contained. */
  Map: { route: string };
  PrivacyPolicy: undefined;
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace ReactNavigation {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface RootParamList extends RootStackParamList {}
  }
}
