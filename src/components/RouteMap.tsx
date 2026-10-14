import MapLibreGL, { CameraRef } from '@maplibre/maplibre-react-native';
import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { Coordinates, LngLat } from '../types';
import { getMapStyleUrl } from './mapStyles';

MapLibreGL.setAccessToken(null);

export interface RouteMapHandle {
  /** Frames the whole route above the bottom overlay. */
  fitRoute(): void;
}

export interface RouteMapProps {
  geometry: Coordinates[];
  dark: boolean;
  accentColor: string;
  overlayHeight: number;
  bottomInset: number;
  isTracking: boolean;
  isFollowingUser: boolean;
  userPosition: LngLat | null;
  onUserInteraction: () => void;
}

const RouteMap = forwardRef<RouteMapHandle, RouteMapProps>(function RouteMap(
  {
    geometry,
    dark,
    accentColor,
    overlayHeight,
    bottomInset,
    isTracking,
    isFollowingUser,
    userPosition,
    onUserInteraction,
  },
  ref,
) {
  const cameraRef = useRef<CameraRef | null>(null);
  const hasInitialZoom = useRef(false);

  const start = geometry[0];
  const end = geometry[geometry.length - 1];
  const lngs = geometry.map((pt) => pt.longitude);
  const lats = geometry.map((pt) => pt.latitude);
  const ne: LngLat = [Math.max(...lngs), Math.max(...lats)];
  const sw: LngLat = [Math.min(...lngs), Math.min(...lats)];

  const routeGeoJSON: GeoJSON.Feature<GeoJSON.LineString> = {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'LineString',
      coordinates: geometry.map((pt) => [pt.longitude, pt.latitude]),
    },
  };

  useImperativeHandle(ref, () => ({
    fitRoute() {
      cameraRef.current?.fitBounds(ne, sw, [60, 40, overlayHeight + 16, 40], 500);
    },
  }));

  // Follow the user: zoom in on the first fix, then pan along.
  useEffect(() => {
    if (!isTracking) {
      hasInitialZoom.current = false;
      return;
    }
    if (!isFollowingUser || !userPosition) return;
    if (!hasInitialZoom.current) {
      cameraRef.current?.setCamera({
        centerCoordinate: userPosition,
        zoomLevel: 17,
        animationDuration: 500,
      });
      hasInitialZoom.current = true;
    } else {
      cameraRef.current?.moveTo(userPosition, 300);
    }
  }, [isTracking, isFollowingUser, userPosition]);

  return (
    <MapLibreGL.MapView
      style={StyleSheet.absoluteFill}
      mapStyle={getMapStyleUrl(dark)}
      rotateEnabled={true}
      compassEnabled={true}
      compassViewPosition={3}
      compassViewMargins={{ x: 16, y: bottomInset + overlayHeight + 76 }}
      onRegionWillChange={(payload) => {
        if (payload.properties?.isUserInteraction) onUserInteraction();
      }}
    >
      <MapLibreGL.Camera
        ref={cameraRef}
        bounds={
          isTracking
            ? undefined
            : {
                ne,
                sw,
                paddingTop: 60,
                paddingBottom: overlayHeight + 16,
                paddingLeft: 40,
                paddingRight: 40,
              }
        }
        animationDuration={500}
      />

      <MapLibreGL.ShapeSource id="route" shape={routeGeoJSON}>
        <MapLibreGL.LineLayer
          id="routeLine"
          style={{ lineColor: accentColor, lineWidth: 4, lineJoin: 'round', lineCap: 'round' }}
        />
      </MapLibreGL.ShapeSource>

      <MapLibreGL.PointAnnotation id="start" coordinate={[start.longitude, start.latitude]}>
        <View style={[styles.marker, styles.markerStart]} />
      </MapLibreGL.PointAnnotation>

      <MapLibreGL.PointAnnotation id="end" coordinate={[end.longitude, end.latitude]}>
        <View style={[styles.marker, styles.markerEnd]} />
      </MapLibreGL.PointAnnotation>

      {isTracking && userPosition && (
        <MapLibreGL.PointAnnotation
          id="userPosition"
          coordinate={userPosition}
          anchor={{ x: 0.5, y: 0.5 }}
        >
          <View style={styles.userDot} />
        </MapLibreGL.PointAnnotation>
      )}
    </MapLibreGL.MapView>
  );
});

export default RouteMap;

const styles = StyleSheet.create({
  marker: { width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: '#fff' },
  markerStart: { backgroundColor: '#5DBE4A' },
  markerEnd: { backgroundColor: '#e74c3c' },
  userDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#007AFF',
    borderWidth: 2.5,
    borderColor: '#fff',
  },
});
