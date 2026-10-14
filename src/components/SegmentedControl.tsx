import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getColors } from '../theme';

interface Option<T extends string> {
  label: string;
  value: T;
}

interface Props<T extends string> {
  /** id of the visible <Text> that labels the group. */
  labelledBy: string;
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
  colors: ReturnType<typeof getColors>;
}

/** Single-choice control exposed to assistive tech as a labelled radio group. */
export default function SegmentedControl<T extends string>({ labelledBy, options, value, onChange, colors: c }: Props<T>) {
  return (
    <View
      role="radiogroup"
      aria-labelledby={labelledBy}
      style={[styles.segmented, { backgroundColor: c.segmentBg, borderColor: c.controlBorder }]}
    >
      {options.map((opt) => {
        const selected = value === opt.value;
        return (
          <TouchableOpacity
            key={opt.value}
            role="radio"
            aria-checked={selected}
            style={[styles.segment, selected && { backgroundColor: c.card, borderColor: c.accent }]}
            onPress={() => onChange(opt.value)}
          >
            <Text style={[styles.segmentText, { color: c.muted }, selected && { color: c.text, fontWeight: '600' }]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  segmented: { flexDirection: 'row', borderRadius: 10, padding: 3, borderWidth: 1 },
  segment: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8, borderWidth: 2, borderColor: 'transparent' },
  segmentText: { fontSize: 13, fontWeight: '500' },
});
