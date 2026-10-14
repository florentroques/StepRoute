import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useStore } from '../store/useStore';
import { getCurrentLocation } from '../services/locationService';
import { AddressSuggestion, searchAddress, suggestAddresses } from '../services/geocodingService';
import { stepsToMeters, heightToStrideLength } from '../services/stepService';
import { getOptimizedRoute } from '../services/routeService';
import { encodeRoute } from '../navigation/routeCodec';
import { HistoryEntry, RouteType } from '../types';
import { getColors, useAppScheme } from '../theme';
import { useTranslation } from '../i18n';
import SegmentedControl from '../components/SegmentedControl';

export default function HomeScreen() {
  const navigation = useNavigation();
  const {
    steps,
    heightCm,
    routeType,
    startLocation,
    isLoading,
    error,
    themePreference,
    avoidHighways,
    preferGreen,
    setSteps,
    setRouteType,
    setStartLocation,
    setLoading,
    setError,
    addToHistory,
  } = useStore();

  const [stepsInput, setStepsInput] = useState(String(steps));
  const [addressInput, setAddressInput] = useState('');
  const [addressLabel, setAddressLabel] = useState('');
  const [isGeocodingLoading, setGeocodingLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [progressMsg, setProgressMsg] = useState('');
  const [usingCurrentLocation, setUsingCurrentLocation] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const addressSectionYRef = useRef(0);

  const scheme = useAppScheme(themePreference);
  const c = getColors(scheme);
  const strideLength = heightToStrideLength(heightCm);
  const t = useTranslation();

  const ROUTE_TYPES: { label: string; value: RouteType }[] = [
    { label: t.home.routeTypes.loop, value: 'loop' },
    { label: t.home.routeTypes['round-trip'], value: 'round-trip' },
    { label: t.home.routeTypes['one-way'], value: 'one-way' },
  ];

  function handleAddressChange(text: string) {
    setAddressInput(text);
    setUsingCurrentLocation(false);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!text.trim()) {
      setSuggestions([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      const results = await suggestAddresses(text.trim());
      setSuggestions(results);
    }, 400);
  }

  function handleSelectSuggestion(s: AddressSuggestion) {
    setStartLocation({ latitude: s.latitude, longitude: s.longitude });
    setAddressLabel(s.label);
    setAddressInput(s.label.split(',')[0].trim());
    setUsingCurrentLocation(false);
    setSuggestions([]);
  }

  async function handleUseLocation() {
    setError(null);
    setSuggestions([]);
    try {
      const coords = await getCurrentLocation();
      setStartLocation(coords);
      setAddressLabel('');
      setAddressInput('');
      setUsingCurrentLocation(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : t.home.errors.locationFailed);
    }
  }

  async function handleSearchAddress() {
    if (!addressInput.trim()) return;
    setError(null);
    setSuggestions([]);
    setGeocodingLoading(true);
    try {
      const result = await searchAddress(addressInput.trim());
      setStartLocation({ latitude: result.latitude, longitude: result.longitude });
      setAddressLabel(result.label);
      setUsingCurrentLocation(false);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : t.home.errors.addressNotFound);
    } finally {
      setGeocodingLoading(false);
    }
  }

  async function handleGenerate() {
    const parsedSteps = parseInt(stepsInput, 10);
    if (isNaN(parsedSteps) || parsedSteps < 100) {
      setError(t.home.errors.invalidSteps);
      return;
    }
    if (parsedSteps > 40000) {
      setError(t.home.errors.tooManySteps);
      return;
    }
    if (!startLocation) {
      setError(t.home.errors.noStart);
      return;
    }

    setError(null);
    setLoading(true);
    setProgressMsg('');
    setSteps(parsedSteps);

    try {
      const distanceM = stepsToMeters(parsedSteps, strideLength);
      const routeData = await getOptimizedRoute(
        startLocation,
        distanceM,
        routeType,
        strideLength,
        avoidHighways,
        preferGreen,
        (n, max) => setProgressMsg(t.home.optimizing(n, max)),
      );
      const entry: HistoryEntry = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        routeType,
        steps: parsedSteps,
        distanceMeters: routeData.distanceMeters,
        geometry: routeData.geometry,
        ascent: routeData.ascent,
        descent: routeData.descent,
      };
      addToHistory(entry);
      navigation.navigate('Map', { route: encodeRoute(entry) });
    } catch (e: unknown) {
      setError(
        e instanceof Error
          ? `Error: ${e.message}`
          : t.home.errors.generationFailed,
      );
    } finally {
      setLoading(false);
      setProgressMsg('');
    }
  }

  const addressConfirmText = addressLabel
    ? addressLabel.split(',').slice(0, 2).join(',')
    : null;

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: c.bg }]}
      behavior="padding"
    >
      <ScrollView ref={scrollViewRef} contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
        <Text style={[styles.title, { color: c.text }]}>StepRoute</Text>
        <Text style={[styles.subtitle, { color: c.subtext }]}>{t.home.subtitle}</Text>

        <View style={styles.section}>
          <Text nativeID="home-steps-label" style={[styles.label, { color: c.subtext }]}>{t.home.stepCount}</Text>
          <TextInput
            style={[styles.input, { backgroundColor: c.card, color: c.text, borderColor: c.controlBorder }]}
            value={stepsInput}
            onChangeText={setStepsInput}
            keyboardType="numeric"
            aria-labelledby="home-steps-label"
            placeholder={t.home.stepPlaceholder}
            placeholderTextColor={c.muted}
          />
        </View>

        <View style={styles.section}>
          <Text nativeID="home-route-type-label" style={[styles.label, { color: c.subtext }]}>{t.home.routeType}</Text>
          <SegmentedControl
            labelledBy="home-route-type-label"
            options={ROUTE_TYPES}
            value={routeType}
            onChange={setRouteType}
            colors={c}
          />
        </View>

        <View role="group" aria-labelledby="home-start-label" style={styles.section} onLayout={(e) => { addressSectionYRef.current = e.nativeEvent.layout.y; }}>
          <Text nativeID="home-start-label" style={[styles.label, { color: c.subtext }]}>{t.home.startingPoint}</Text>

          <TouchableOpacity
            style={[
              styles.locationButton,
              usingCurrentLocation
                ? { backgroundColor: c.accent, borderColor: c.accent }
                : { backgroundColor: c.card, borderColor: c.controlBorder },
            ]}
            onPress={handleUseLocation}
          >
            <Text
              style={[
                styles.locationButtonText,
                { color: usingCurrentLocation ? c.onAccent : c.accent },
              ]}
            >
              {usingCurrentLocation ? t.home.locationActive : t.home.useLocation}
            </Text>
          </TouchableOpacity>

          <Text style={[styles.orText, { color: c.muted }]}>{t.home.or}</Text>

          <View style={styles.addressWrapper}>
            <View style={styles.addressRow}>
              <TextInput
                style={[styles.input, styles.addressInput, { backgroundColor: c.card, color: c.text, borderColor: c.controlBorder }]}
                value={addressInput}
                onChangeText={handleAddressChange}
                aria-label={t.home.searchAddress}
                aria-expanded={suggestions.length > 0}
                aria-autocomplete="list"
                placeholder={t.home.searchAddress}
                placeholderTextColor={c.muted}
                returnKeyType="search"
                onSubmitEditing={handleSearchAddress}
                onFocus={() => {
                  setTimeout(() => {
                    scrollViewRef.current?.scrollTo({ y: addressSectionYRef.current, animated: true });
                  }, 150);
                }}
              />
              <TouchableOpacity
                style={[styles.searchButton, { backgroundColor: c.accent }]}
                onPress={handleSearchAddress}
                disabled={isGeocodingLoading}
                aria-label={t.home.search}
                aria-busy={isGeocodingLoading}
              >
                {isGeocodingLoading ? (
                  <ActivityIndicator color={c.onAccent} size="small" />
                ) : (
                  <Text style={[styles.searchArrow, { color: c.onAccent }]} aria-hidden>→</Text>
                )}
              </TouchableOpacity>
            </View>

            {suggestions.length > 0 && (
              <View role="list" aria-label={t.home.suggestions} style={[styles.suggestionsList, { backgroundColor: c.card }]}>
                {suggestions.map((s, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[styles.suggestionItem, i < suggestions.length - 1 && { borderBottomWidth: 1, borderBottomColor: c.separator }]}
                    onPress={() => handleSelectSuggestion(s)}
                  >
                    <Text style={[styles.suggestionText, { color: c.text }]} numberOfLines={2}>
                      {s.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {addressConfirmText ? (
            <Text style={[styles.locationConfirm, { color: c.accent }]} numberOfLines={1} aria-live="polite">
              <Text aria-hidden>✓ </Text>
              {addressConfirmText}
            </Text>
          ) : null}
        </View>

        {error ? <Text role="alert" style={[styles.error, { color: c.danger }]}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.generateButton, { backgroundColor: c.accent }, isLoading && styles.generateButtonDisabled]}
          onPress={handleGenerate}
          disabled={isLoading}
          aria-busy={isLoading}
          aria-label={isLoading ? progressMsg || t.home.generating : t.home.generate}
        >
          {isLoading ? (
            <ActivityIndicator color={c.onAccent} />
          ) : (
            <Text style={[styles.generateButtonText, { color: c.onAccent }]}>{t.home.generate}</Text>
          )}
        </TouchableOpacity>

        {isLoading && progressMsg ? (
          <Text aria-live="polite" style={[styles.progressMsg, { color: c.subtext }]}>{progressMsg}</Text>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { padding: 24, paddingBottom: 40, ...(Platform.OS === 'web' && { paddingTop: 12 }) },
  // The 40 px clears the native status bar; a browser has no status bar to clear.
  title: { fontSize: 32, fontWeight: '700', marginBottom: 4, marginTop: Platform.OS === 'web' ? 0 : 40 },
  subtitle: { fontSize: 15, marginBottom: 32 },
  section: { marginBottom: 22 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  locationButton: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  locationButtonText: { fontSize: 15, fontWeight: '500' },
  orText: { textAlign: 'center', marginVertical: 10, fontSize: 13 },
  addressWrapper: { position: 'relative', zIndex: 10 },
  addressRow: { flexDirection: 'row', gap: 8, alignItems: 'stretch' },
  addressInput: { flex: 1 },
  searchButton: {
    borderRadius: 12,
    width: 48,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  searchArrow: { fontSize: 18, lineHeight: 18, includeFontPadding: false },
  suggestionsList: {
    borderRadius: 12,
    marginTop: 4,
    maxHeight: 220,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
    overflow: 'hidden',
  },
  suggestionItem: { paddingHorizontal: 16, paddingVertical: 12 },
  suggestionText: { fontSize: 14, lineHeight: 20 },
  locationConfirm: { marginTop: 8, fontSize: 13, paddingHorizontal: 4 },
  error: { fontSize: 13, marginBottom: 16, textAlign: 'center' },
  generateButton: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  generateButtonDisabled: { opacity: 0.6 },
  generateButtonText: { fontSize: 17, fontWeight: '700' },
  progressMsg: { marginTop: 10, textAlign: 'center', fontSize: 13 },
});
