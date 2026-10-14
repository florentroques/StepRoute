import React, { forwardRef, useImperativeHandle } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { RouteMapHandle } from './RouteMap';

/** Placeholder until the maplibre-gl implementation lands. */
const RouteMap = forwardRef<RouteMapHandle, object>(function RouteMap(_props, ref) {
  useImperativeHandle(ref, () => ({ fitRoute() {} }));
  return (
    <View style={styles.placeholder}>
      <Text>Map not available yet on web.</Text>
    </View>
  );
});

export default RouteMap;

const styles = StyleSheet.create({
  placeholder: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
});
