import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useStore } from '../store/useStore';
import { encodeRoute } from '../navigation/routeCodec';
import { HistoryEntry } from '../types';
import { getColors, useAppScheme } from '../theme';
import { useTranslation } from '../i18n';
import RouteCard from '../components/RouteCard';

export default function FavoritesScreen() {
  const navigation = useNavigation();
  const { history, toggleFavorite, themePreference } = useStore();
  const c = getColors(useAppScheme(themePreference));
  const insets = useSafeAreaInsets();
  const t = useTranslation();

  const favorites = history.filter((e) => e.isFavorite);

  function handleSelectEntry(entry: HistoryEntry) {
    navigation.navigate('Map', { route: encodeRoute(entry) });
  }

  const header = (
    <Text style={[styles.title, { color: c.text, marginTop: insets.top + 8 }]}>{t.favorites.title}</Text>
  );

  if (favorites.length === 0) {
    return (
      <View style={[styles.empty, { backgroundColor: c.bg }]}>
        {header}
        <Text style={styles.emptyIcon}>⭐</Text>
        <Text style={[styles.emptyText, { color: c.subtext }]}>{t.favorites.empty}</Text>
      </View>
    );
  }

  return (
    <FlatList
      style={[styles.list, { backgroundColor: c.bg }]}
      contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 16 }]}
      data={favorites}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={header}
      renderItem={({ item }) => (
        <RouteCard
          entry={item}
          colors={c}
          onPress={() => handleSelectEntry(item)}
          onToggleFavorite={() => toggleFavorite(item.id)}
        />
      )}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1 },
  listContent: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24 },
  title: { fontSize: 28, fontWeight: '700', marginBottom: 20 },
  separator: { height: 10 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 24 },
  emptyIcon: { fontSize: 48 },
  emptyText: { fontSize: 15 },
});
