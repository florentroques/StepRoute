import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { HistoryEntry } from '../types';
import { getColors } from '../theme';
import { useTranslation } from '../i18n';
import { encodeRoute } from '../navigation/routeCodec';
import { canShareRoute, shareRoute } from '../utils/shareRoute';
import { showAlert } from '../utils/showAlert';

interface Props {
  entry: HistoryEntry;
  colors: ReturnType<typeof getColors>;
  onPress: () => void;
  onToggleFavorite: () => void;
}

function formatDistance(meters: number) {
  if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`;
  return `${Math.round(meters)} m`;
}

export default function RouteCard({ entry, colors: c, onPress, onToggleFavorite }: Props) {
  const t = useTranslation();
  const [linkCopied, setLinkCopied] = useState(false);

  const date = new Date(entry.date).toLocaleDateString(t.history.locale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  async function handleShare() {
    try {
      const outcome = await shareRoute(encodeRoute(entry), t.map.myRoute);
      if (outcome !== 'copied') return;
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      showAlert(t.map.share, t.map.shareFailed);
    }
  }

  return (
    <TouchableOpacity style={[styles.card, { backgroundColor: c.card }]} onPress={onPress}>
      <View style={styles.header}>
        <Text style={[styles.date, { color: c.subtext }]}>{date}</Text>
        <View style={[styles.typeBadge, { backgroundColor: c.cardAlt, borderColor: c.controlBorder }]}>
          <Text style={[styles.typeText, { color: c.accent }]}>
            {t.history.routeTypes[entry.routeType] ?? entry.routeType}
          </Text>
        </View>
      </View>
      <View style={styles.footer}>
        <View style={styles.stats}>
          <Text style={[styles.stat, { color: c.text }]}>{formatDistance(entry.distanceMeters)}</Text>
          <Text style={[styles.statSep, { color: c.muted }]}>·</Text>
          <Text style={[styles.stat, { color: c.text }]}>
            {entry.steps.toLocaleString(t.history.locale)} {t.history.steps}
          </Text>
        </View>
        <View style={styles.actions}>
          {canShareRoute && (
            <TouchableOpacity
              style={[styles.shareButton, { backgroundColor: c.card, borderColor: c.controlBorder }]}
              onPress={handleShare}
              accessibilityRole="button"
              accessibilityLabel={t.map.share}
            >
              <Text style={[styles.shareText, { color: c.accent }]}>
                {linkCopied ? t.map.linkCopied : t.map.share}
              </Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[
              styles.favoriteButton,
              {
                backgroundColor: entry.isFavorite ? c.cardAlt : c.card,
                borderColor: entry.isFavorite ? c.accent : c.controlBorder,
              },
            ]}
            onPress={onToggleFavorite}
            accessibilityRole="button"
            accessibilityLabel={entry.isFavorite ? t.history.removeFavorite : t.history.addFavorite}
            accessibilityState={{ selected: !!entry.isFavorite }}
          >
            <Text style={[styles.star, { color: entry.isFavorite ? c.accent : c.muted }]}>
              {entry.isFavorite ? '★' : '☆'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 12 },
  date: { fontSize: 13, flexShrink: 1 },
  typeBadge: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  typeText: { fontSize: 12, fontWeight: '700' },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  stats: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 },
  stat: { fontSize: 15, fontWeight: '600' },
  statSep: { fontSize: 15 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  shareButton: {
    minHeight: 40,
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
  },
  shareText: { fontSize: 13, fontWeight: '600' },
  favoriteButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 20,
  },
  star: { fontSize: 20 },
});
