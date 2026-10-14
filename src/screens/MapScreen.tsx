import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import RouteInfo from '../components/RouteInfo';
import RouteMap, { RouteMapHandle } from '../components/RouteMap';
import { useWalkTracking } from '../hooks/useWalkTracking';
import { getOptimizedRoute } from '../services/routeService';
import { heightToStrideLength, stepsToMeters } from '../services/stepService';
import { decodeRoute, encodeRoute } from '../navigation/routeCodec';
import type { RootStackParamList } from '../navigation/types';
import { useStore } from '../store/useStore';
import { HistoryEntry, RouteData } from '../types';
import { getColors, useAppScheme } from '../theme';
import { openInMaps } from '../utils/openInMaps';
import { canShareRoute, shareRoute } from '../utils/shareRoute';
import { showAlert } from '../utils/showAlert';
import { useTranslation } from '../i18n';

export default function MapScreen() {
  const { history, addToHistory, updateHistoryEntry, startLocation, steps, heightCm, avoidHighways, preferGreen, themePreference } = useStore();
  const navigation = useNavigation();
  const { route: encodedRoute } = useRoute<RouteProp<RootStackParamList, 'Map'>>().params;
  const shared = decodeRoute(encodedRoute);
  const [regenerating, setRegenerating] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [overlayHeight, setOverlayHeight] = useState(220);
  const mapRef = useRef<RouteMapHandle | null>(null);
  const { isTracking, liveSteps, userPosition, isFollowingUser, startWalk, stopWalk, followUser, handleUserInteraction } = useWalkTracking();

  const scheme = useAppScheme(themePreference);
  const c = getColors(scheme);
  const insets = useSafeAreaInsets();
  const t = useTranslation();

  // The URL can carry a mistyped or truncated route.
  useEffect(() => {
    if (!shared) navigation.reset({ index: 0, routes: [{ name: 'Tabs' }] });
  }, [shared, navigation]);

  if (!shared) return null;
  const routeData: RouteData = {
    geometry: shared.geometry,
    distanceMeters: shared.distanceMeters,
    estimatedSteps: shared.steps,
    ascent: shared.ascent,
    descent: shared.descent,
  };

  async function handleRegenerate() {
    if (!shared) return;
    // Fall back to the route's own start when the live location is unknown (e.g. shared link).
    const start = startLocation ?? shared.geometry[0];
    setRegenerating(true);
    try {
      const strideLength = heightToStrideLength(heightCm);
      const distanceM = stepsToMeters(steps, strideLength);
      const newRoute = await getOptimizedRoute(start, distanceM, shared.routeType, strideLength, avoidHighways, preferGreen);
      const updated: HistoryEntry = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        routeType: shared.routeType,
        steps,
        distanceMeters: newRoute.distanceMeters,
        geometry: newRoute.geometry,
        ascent: newRoute.ascent,
        descent: newRoute.descent,
      };
      // Replace the history entry being viewed; a shared link not in history is added instead.
      const current = history.find((e) => encodeRoute(e) === encodedRoute);
      if (current) updateHistoryEntry({ ...updated, id: current.id, isFavorite: current.isFavorite });
      else addToHistory(updated);
      navigation.setParams({ route: encodeRoute(updated) });
    } finally {
      setRegenerating(false);
    }
  }

  async function handleOpenInMaps() {
    try {
      await openInMaps(routeData.geometry);
    } catch (e) {
      showAlert('Open in Maps', String(e));
    }
  }

  async function handleShare() {
    try {
      const outcome = await shareRoute(encodedRoute, t.map.myRoute);
      if (outcome !== 'copied') return;
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      showAlert(t.map.share, t.map.shareFailed);
    }
  }

  function handleBack() {
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.reset({ index: 0, routes: [{ name: 'Tabs' }] });
  }

  function handleRecenter() {
    if (isTracking) {
      followUser();
      return;
    }
    mapRef.current?.fitRoute();
  }

  function handleStopWalk() {
    stopWalk();
    setTimeout(() => mapRef.current?.fitRoute(), 50);
  }

  return (
    <View style={styles.container}>
      <View style={styles.map}>
        <RouteMap
          ref={mapRef}
          geometry={routeData.geometry}
          dark={scheme === 'dark'}
          accentColor={c.accent}
          overlayHeight={overlayHeight}
          bottomInset={insets.bottom}
          isTracking={isTracking}
          isFollowingUser={isFollowingUser}
          userPosition={userPosition}
          onUserInteraction={handleUserInteraction}
        />
      </View>

      {/* Bouton recentrer flottant — bas droit, juste au-dessus de l'overlay */}
      <TouchableOpacity
        style={[styles.recenterButton, { backgroundColor: c.card, borderColor: c.controlBorder, bottom: insets.bottom + overlayHeight + 24 }]}
        onPress={handleRecenter}
        accessibilityLabel={t.map.recenter}
        role="button"
      >
        <Text aria-hidden style={[styles.recenterIcon, { color: isTracking && !isFollowingUser ? c.subtext : c.accent }]}>⊙</Text>
      </TouchableOpacity>

      <View
        style={[styles.infoContainer, { bottom: insets.bottom + 16 }]}
        onLayout={(e) => setOverlayHeight(e.nativeEvent.layout.height)}
      >
        <RouteInfo routeData={routeData} />

        {isTracking ? (
          <>
            <View style={[styles.stepCounterCard, { backgroundColor: c.card }]}>
              <Text style={[styles.stepCounterNumber, { color: c.accent }]}>
                {liveSteps.toLocaleString()}
              </Text>
              <Text style={[styles.stepCounterLabel, { color: c.subtext }]}>
                {t.map.stepsWalked}
              </Text>
            </View>
            <TouchableOpacity style={[styles.stopButton, { backgroundColor: c.danger }]} onPress={handleStopWalk}>
              <Text style={[styles.actionButtonText, { color: c.onDanger }]}>{t.map.stopWalk}</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: c.card, borderColor: c.controlBorder }, regenerating && styles.actionButtonDisabled]}
                onPress={handleRegenerate}
                disabled={regenerating}
                aria-busy={regenerating}
                aria-label={t.map.regenerate}
              >
                {regenerating ? (
                  <ActivityIndicator color={c.accent} size="small" />
                ) : (
                  <Text style={[styles.actionButtonText, { color: c.accent }]}>{t.map.regenerate}</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity style={[styles.actionButton, { backgroundColor: c.accent, borderColor: c.accent }]} onPress={startWalk}>
                <Text style={[styles.actionButtonText, { color: c.onAccent }]}>{t.map.startWalk}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity style={[styles.actionButton, { backgroundColor: c.card, borderColor: c.controlBorder }]} onPress={handleOpenInMaps}>
                <Text style={[styles.actionButtonText, { color: c.accent }]}>{t.map.openInMaps}</Text>
              </TouchableOpacity>

              {canShareRoute && (
                <TouchableOpacity style={[styles.actionButton, { backgroundColor: c.card, borderColor: c.controlBorder }]} onPress={handleShare}>
                  <Text style={[styles.actionButtonText, { color: c.accent }]} aria-live="polite">
                    {linkCopied ? t.map.linkCopied : t.map.share}
                    {linkCopied && <Text aria-hidden> ✓</Text>}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </>
        )}
      </View>

      <TouchableOpacity
        style={[styles.backButton, { backgroundColor: c.card, borderColor: c.controlBorder, top: insets.top + 12 }]}
        onPress={handleBack}
        accessibilityLabel={t.map.back}
        role="button"
      >
        <Text aria-hidden style={[styles.backIcon, { color: c.accent }]}>←</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  recenterButton: {
    borderWidth: 1,
    position: 'absolute',
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 5,
  },
  recenterIcon: { fontSize: 22, lineHeight: 24 },
  infoContainer: {
    position: 'absolute',
    left: 16,
    right: 16,
    gap: 10,
  },
  buttonRow: { flexDirection: 'row', gap: 10 },
  actionButton: {
    borderWidth: 1,
    flex: 1,
    borderRadius: 12,
    paddingVertical: 9,
    paddingHorizontal: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 4,
  },
  actionButtonDisabled: { opacity: 0.6 },
  actionButtonText: { fontSize: 14, fontWeight: '600' },
  stepCounterCard: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center' as const,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 4,
  },
  stepCounterNumber: { fontSize: 28, fontWeight: '700', lineHeight: 32 },
  stepCounterLabel: { fontSize: 12, fontWeight: '500', marginTop: 2 },
  stopButton: {
    borderRadius: 12,
    paddingVertical: 9,
    paddingHorizontal: 16,
    alignItems: 'center' as const,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 4,
  },
  backButton: {
    borderWidth: 1,
    position: 'absolute',
    left: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 5,
  },
  backIcon: { fontSize: 22, lineHeight: 24 },
});
