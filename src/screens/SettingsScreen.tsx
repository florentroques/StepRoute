import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useStore, ThemePreference } from '../store/useStore';
import { heightToStrideLength } from '../services/stepService';
import { getColors, useAppScheme } from '../theme';
import { useTranslation, Language } from '../i18n';
import SegmentedControl from '../components/SegmentedControl';

export default function SettingsScreen() {
  const navigation = useNavigation();
  const {
    heightCm, setHeightCm,
    themePreference, setThemePreference,
    language, setLanguage,
    avoidHighways, setAvoidHighways,
    preferGreen, setPreferGreen,
  } = useStore();
  const [heightInput, setHeightInput] = useState(String(heightCm));

  const scheme = useAppScheme(themePreference);
  const c = getColors(scheme);
  const strideLength = heightToStrideLength(heightCm);
  const t = useTranslation();

  const THEME_OPTIONS: { label: string; value: ThemePreference }[] = [
    { label: t.settings.themes.system, value: 'system' },
    { label: t.settings.themes.light, value: 'light' },
    { label: t.settings.themes.dark, value: 'dark' },
  ];

  const LANGUAGE_OPTIONS: { label: string; value: Language }[] = [
    { label: t.settings.languages.en, value: 'en' },
    { label: t.settings.languages.fr, value: 'fr' },
  ];

  const ON_OFF_OPTIONS: { label: string; value: 'on' | 'off' }[] = [
    { label: t.settings.off, value: 'off' },
    { label: t.settings.on, value: 'on' },
  ];

  function handleHeightChange(text: string) {
    setHeightInput(text);
    const parsed = parseInt(text, 10);
    if (!isNaN(parsed) && parsed >= 100 && parsed <= 250) {
      setHeightCm(parsed);
    }
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: c.bg }]} contentContainerStyle={styles.inner}>
      <Text role="heading" aria-level={1} style={[styles.title, { color: c.text }]}>{t.settings.title}</Text>

      {/* Appearance */}
      <View role="group" aria-labelledby="settings-appearance" style={[styles.card, { backgroundColor: c.card }]}>
        <Text nativeID="settings-appearance" style={[styles.sectionTitle, { color: c.muted }]} role="heading" aria-level={2}>{t.settings.appearance}</Text>

        <View style={styles.field}>
          <Text nativeID="settings-theme-label" style={[styles.label, { color: c.text }]}>{t.settings.theme}</Text>
          <SegmentedControl
            labelledBy="settings-theme-label"
            options={THEME_OPTIONS}
            value={themePreference}
            onChange={setThemePreference}
            colors={c}
          />
        </View>

        <View style={[styles.divider, { backgroundColor: c.separator }]} />

        <View style={styles.field}>
          <Text nativeID="settings-language-label" style={[styles.label, { color: c.text }]}>{t.settings.language}</Text>
          <SegmentedControl
            labelledBy="settings-language-label"
            options={LANGUAGE_OPTIONS}
            value={language}
            onChange={setLanguage}
            colors={c}
          />
        </View>
      </View>

      <View style={styles.cardGap} />

      {/* Profile */}
      <View role="group" aria-labelledby="settings-profile" style={[styles.card, { backgroundColor: c.card }]}>
        <Text nativeID="settings-profile" style={[styles.sectionTitle, { color: c.muted }]} role="heading" aria-level={2}>{t.settings.profile}</Text>

        <View style={styles.field}>
          <Text nativeID="settings-height-label" style={[styles.label, { color: c.text }]}>{t.settings.height}</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={[styles.input, { backgroundColor: c.cardAlt, color: c.text, borderColor: c.controlBorder }]}
              value={heightInput}
              onChangeText={handleHeightChange}
              keyboardType="numeric"
              aria-labelledby="settings-height-label"
              placeholder="170"
              placeholderTextColor={c.muted}
            />
            <Text style={[styles.unit, { color: c.subtext }]} aria-hidden>cm</Text>
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: c.separator }]} />

        <View style={styles.field}>
          <Text style={[styles.label, { color: c.text }]}>{t.settings.strideLength}</Text>
          <Text style={[styles.valueText, { color: c.accent }]}>{(strideLength * 100).toFixed(1)} cm</Text>
          <Text style={[styles.hint, { color: c.muted }]}>
            {t.settings.strideHint(((strideLength * 10000) / 1000).toFixed(1))}
          </Text>
        </View>
      </View>

      <View style={styles.cardGap} />

      {/* Route preferences */}
      <View role="group" aria-labelledby="settings-routes" style={[styles.card, { backgroundColor: c.card }]}>
        <Text nativeID="settings-routes" style={[styles.sectionTitle, { color: c.muted }]} role="heading" aria-level={2}>{t.settings.parcours}</Text>

        <View style={styles.field}>
          <Text nativeID="settings-highways-label" style={[styles.label, { color: c.text }]}>{t.settings.avoidHighways}</Text>
          <SegmentedControl
            labelledBy="settings-highways-label"
            options={ON_OFF_OPTIONS}
            value={avoidHighways ? 'on' : 'off'}
            onChange={(v) => setAvoidHighways(v === 'on')}
            colors={c}
          />
        </View>

        <View style={[styles.divider, { backgroundColor: c.separator }]} />

        <View style={styles.field}>
          <Text nativeID="settings-green-label" style={[styles.label, { color: c.text }]}>{t.settings.preferGreen}</Text>
          <SegmentedControl
            labelledBy="settings-green-label"
            options={ON_OFF_OPTIONS}
            value={preferGreen ? 'on' : 'off'}
            onChange={(v) => setPreferGreen(v === 'on')}
            colors={c}
          />
        </View>
      </View>

      <View style={styles.cardGap} />

      {/* Legal */}
      <View role="group" aria-labelledby="settings-legal" style={[styles.card, { backgroundColor: c.card }]}>
        <Text nativeID="settings-legal" style={[styles.sectionTitle, { color: c.muted }]} role="heading" aria-level={2}>{t.settings.legal}</Text>
        <TouchableOpacity
          style={styles.linkRow}
          onPress={() => navigation.navigate('PrivacyPolicy' as never)}
        >
          <Text style={[styles.linkText, { color: c.text }]}>{t.settings.privacyPolicy}</Text>
          <Text style={[styles.chevron, { color: c.muted }]} aria-hidden>›</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { padding: 24, paddingBottom: 40 },
  title: { fontSize: 28, fontWeight: '700', marginBottom: 24, marginTop: 16 },
  card: {
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardGap: { height: 16 },
  sectionTitle: { fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 16 },
  field: { marginBottom: 4 },
  label: { fontSize: 15, fontWeight: '500', marginBottom: 8 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  input: {
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    width: 100,
    borderWidth: 1,
  },
  unit: { fontSize: 15 },
  valueText: { fontSize: 22, fontWeight: '600', marginBottom: 6 },
  hint: { fontSize: 13, lineHeight: 18 },
  divider: { height: 1, marginVertical: 16 },
  linkRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  linkText: { fontSize: 15, fontWeight: '500' },
  chevron: { fontSize: 20, lineHeight: 22 },
});
