import { useNavigation } from '@react-navigation/native';
import React, { useRef, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import RouteInfo from '../components/RouteInfo';
import RouteMap, { RouteMapHandle } from '../components/RouteMap';
import { useWalkTracking } from '../hooks/useWalkTracking';
import { getOptimizedRoute } from '../services/routeService';
import { heightToStrideLength, stepsToMeters } from '../services/stepService';
import { useStore } from '../store/useStore';
import { getColors, useAppScheme } from '../theme';
import { openInMaps } from '../utils/openInMaps';
import { useTranslation } from '../i18n';

export default function MapScreen() {
  const { routeData, startLocation, steps, heightCm, routeType, avoidHighways, preferGreen, setRouteData, replaceLastHistory, themePreference } = useStore();
  const navigation = useNavigation();
  const [regenerating, setRegenerating] = useState(false);
  const [overlayHeight, setOverlayHeight] = useState(220);
  const mapRef = useRef<RouteMapHandle | null>(null);
  const { isTracking, liveSteps, userPosition, isFollowingUser, startWalk, stopWalk, followUser, handleUserInteraction } = useWalkTracking();

  const scheme = useAppScheme(themePreference);
  const c = getColors(scheme);
  const insets = useSafeAreaInsets();
  const t = useTranslation();

  if (!routeData || routeData.geometry.length < 2) return null;

  async function handleRegenerate() {
    if (!startLocation) return;
    setRegenerating(true);
    try {
      const strideLength = heightToStrideLength(heightCm);
      const distanceM = stepsToMeters(steps, strideLength);
      const newRoute = await getOptimizedRoute(startLocation, distanceM, routeType, strideLength, avoidHighways, preferGreen);
      setRouteData(newRoute);
      replaceLastHistory({
        id: Date.now().toString(),
        date: new Date().toISOString(),
        routeType,
        steps,
        distanceMeters: newRoute.distanceMeters,
        geometry: newRoute.geometry,
        ascent: newRoute.ascent,
        descent: newRoute.descent,
      });
    } finally {
      setRegenerating(false);
    }
  }

  async function handleOpenInMaps() {
    if (!routeData) return;
    try {
      await openInMaps(routeData.geometry);
    } catch (e) {
      Alert.alert('Open in Maps', String(e));
    }
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
        style={[styles.recenterButton, { backgroundColor: c.card, bottom: insets.bottom + overlayHeight + 24 }]}
        onPress={handleRecenter}
        accessibilityLabel={t.map.recenter}
      >
        <Text style={[styles.recenterIcon, { color: isTracking && !isFollowingUser ? c.subtext : '#5DBE4A' }]}>⊙</Text>
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
            <TouchableOpacity style={styles.stopButton} onPress={handleStopWalk}>
              <Text style={[styles.actionButtonText, { color: '#fff' }]}>{t.map.stopWalk}</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: c.card }, regenerating && styles.actionButtonDisabled]}
                onPress={handleRegenerate}
                disabled={regenerating}
              >
                {regenerating ? (
                  <ActivityIndicator color={c.accent} size="small" />
                ) : (
                  <Text style={[styles.actionButtonText, { color: c.accent }]}>{t.map.regenerate}</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity style={[styles.actionButton, styles.startButton]} onPress={startWalk}>
                <Text style={[styles.actionButtonText, { color: '#fff' }]}>{t.map.startWalk}</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={[styles.actionButton, styles.openMapsButton, { backgroundColor: c.card }]} onPress={handleOpenInMaps}>
              <Text style={[styles.actionButtonText, { color: c.accent }]}>{t.map.openInMaps}</Text>
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: c.card }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={[styles.backButtonText, { color: c.accent }]}>{t.map.newRoute}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  recenterButton: {
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
  startButton: { backgroundColor: '#5DBE4A' },
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
  openMapsButton: { flex: undefined },
  stopButton: {
    borderRadius: 12,
    paddingVertical: 9,
    paddingHorizontal: 16,
    alignItems: 'center' as const,
    backgroundColor: '#e74c3c',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 4,
  },
  backButton: {
    borderRadius: 12,
    paddingVertical: 9,
    paddingHorizontal: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 4,
  },
  backButtonText: { fontSize: 15, fontWeight: '500' },
});
