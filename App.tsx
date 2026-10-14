import { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { Platform, Text } from 'react-native';
import HomeScreen from './src/screens/HomeScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import MapScreen from './src/screens/MapScreen';
import FavoritesScreen from './src/screens/FavoritesScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import PrivacyPolicyScreen from './src/screens/PrivacyPolicyScreen';
import { getColors, useAppScheme } from './src/theme';
import { useStore } from './src/store/useStore';
import { useTranslation } from './src/i18n';
import { linking } from './src/navigation/linking';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function TabNavigator() {
  const { themePreference } = useStore();
  const scheme = useAppScheme(themePreference);
  const c = getColors(scheme);
  const t = useTranslation();
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: c.accent,
        tabBarInactiveTintColor: c.muted,
        // Accent and muted are close in lightness, so the active tab also gets a background.
        tabBarActiveBackgroundColor: c.cardAlt,
        tabBarStyle: {
          backgroundColor: c.tabBar,
          borderTopColor: c.tabBarBorder,
          // Browsers report inconsistent bottom insets, so the web bar has a fixed size.
          ...(Platform.OS === 'web' && { height: 64, paddingTop: 6, paddingBottom: 8 }),
        },
      }}
    >
      <Tab.Screen
        name="Accueil"
        component={HomeScreen}
        options={{
          tabBarLabel: t.tabs.home,
          tabBarIcon: ({ color }) => <Text aria-hidden style={{ fontSize: 18, color }}>🗺️</Text>,
        }}
      />
      <Tab.Screen
        name="Historique"
        component={HistoryScreen}
        options={{
          tabBarLabel: t.tabs.history,
          tabBarIcon: ({ color }) => <Text aria-hidden style={{ fontSize: 18, color }}>📋</Text>,
        }}
      />
      <Tab.Screen
        name="Favoris"
        component={FavoritesScreen}
        options={{
          tabBarLabel: t.tabs.favorites,
          tabBarIcon: ({ color }) => <Text aria-hidden style={{ fontSize: 18, color }}>⭐</Text>,
        }}
      />
      <Tab.Screen
        name="Paramètres"
        component={SettingsScreen}
        options={{
          tabBarLabel: t.tabs.settings,
          tabBarIcon: ({ color }) => <Text aria-hidden style={{ fontSize: 18, color }}>⚙️</Text>,
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const { themePreference } = useStore();
  const scheme = useAppScheme(themePreference);
  const { tabBar } = getColors(scheme);

  // Any gap below the app (e.g. when the mobile URL bar resizes the viewport) shows the
  // page background, so keep it in the tab bar's colour instead of the browser's white.
  useEffect(() => {
    if (Platform.OS === 'web') document.documentElement.style.backgroundColor = tabBar;
  }, [tabBar]);

  return (
    <NavigationContainer
      linking={Platform.OS === 'web' ? linking : undefined}
      documentTitle={{ enabled: false }}
    >
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Tabs" component={TabNavigator} />
        <Stack.Screen name="Map" component={MapScreen} />
        <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
