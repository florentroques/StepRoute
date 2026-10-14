import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { HistoryEntry } from '../types';
import { useStore } from '../store/useStore';
import { getColors } from '../theme';
import { useTranslation } from '../i18n';
import { encodeRoute } from '../navigation/routeCodec';
import { canShareRoute, shareRoute } from '../utils/shareRoute';
import { showAlert } from '../utils/showAlert';
import { confirmAction } from '../utils/confirmAction';

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

export default function RouteCard({
  entry,
  colors: c,
  onPress,
  onToggleFavorite,
}: Props) {
  const t = useTranslation();
  const [linkCopied, setLinkCopied] = useState(false);
  const [focused, setFocused] = useState(false);
  const removeFromHistory = useStore((state) => state.removeFromHistory);

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

  async function handleRemove() {
    const confirmed = await confirmAction(
      t.history.deleteTitle,
      t.history.deleteMessage,
      t.history.delete,
      t.history.cancel,
    );
    if (confirmed) removeFromHistory(entry.id);
  }

  const typeLabel = t.history.routeTypes[entry.routeType] ?? entry.routeType;
  const summary = `${date}, ${typeLabel}, ${formatDistance(entry.distanceMeters)}, ${entry.steps.toLocaleString(t.history.locale)} ${t.history.steps}`;

  // The card itself is not a button: nesting the share and favorite buttons inside one would be
  // invalid. A focusable Pressable fills the card behind the content instead, and the content
  // lets presses through (box-none) except on those two buttons.
  return (
    <View style={[styles.card, { backgroundColor: c.card }]}>
      <Pressable
        style={[styles.cardPress, focused && { borderColor: c.accent }]}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onPress={onPress}
        role="button"
        aria-label={summary}
      />
      <View pointerEvents="box-none">
        <View style={styles.header} aria-hidden pointerEvents="none">
          <Text style={[styles.date, { color: c.subtext }]}>{date}</Text>
          <View
            style={[
              styles.typeBadge,
              { backgroundColor: c.cardAlt, borderColor: c.controlBorder },
            ]}
          >
            <Text style={[styles.typeText, { color: c.accent }]}>{typeLabel}</Text>
          </View>
        </View>
        <View style={styles.footer} pointerEvents="box-none">
          <View style={styles.stats} aria-hidden pointerEvents="none">
            <Text style={[styles.stat, { color: c.text }]}>
              {formatDistance(entry.distanceMeters)}
            </Text>
            <Text style={[styles.statSep, { color: c.muted }]} aria-hidden>
              ·
            </Text>
            <Text style={[styles.stat, { color: c.text }]}>
              {entry.steps.toLocaleString(t.history.locale)} {t.history.steps}
            </Text>
          </View>
          <View style={styles.actions}>
            {canShareRoute && (
              <TouchableOpacity
                style={[
                  styles.shareButton,
                  { backgroundColor: c.card, borderColor: c.controlBorder },
                ]}
                onPress={handleShare}
                accessibilityRole="button"
                accessibilityLabel={t.map.share}
              >
                <Text style={[styles.shareText, { color: c.accent }]} aria-live="polite">
                  {linkCopied ? t.map.linkCopied : t.map.share}
                  {linkCopied && <Text aria-hidden> ✓</Text>}
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[
                styles.iconButton,
                {
                  backgroundColor: entry.isFavorite ? c.cardAlt : c.card,
                  borderColor: entry.isFavorite ? c.accent : c.controlBorder,
                },
              ]}
              onPress={onToggleFavorite}
              accessibilityRole="button"
              accessibilityLabel={
                entry.isFavorite ? t.history.removeFavorite : t.history.addFavorite
              }
              accessibilityState={{ selected: !!entry.isFavorite }}
            >
              <Text
                style={[styles.star, { color: entry.isFavorite ? c.accent : c.muted }]}
                aria-hidden
              >
                {entry.isFavorite ? '★' : '☆'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.iconButton,
                { backgroundColor: c.card, borderColor: c.controlBorder },
              ]}
              onPress={handleRemove}
              accessibilityRole="button"
              accessibilityLabel={t.history.delete}
            >
              <Text style={[styles.deleteIcon, { color: c.danger }]} aria-hidden>
                ✕
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
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
  cardPress: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 12,
  },
  date: { fontSize: 13, flexShrink: 1 },
  typeBadge: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  typeText: { fontSize: 12, fontWeight: '700' },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
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
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 20,
  },
  star: { fontSize: 20 },
  deleteIcon: { fontSize: 16, fontWeight: '700' },
});
