import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { Coordinates } from '../types';
import { getMapStyleUrl } from './mapStyles';
import type { RouteMapHandle, RouteMapProps } from './RouteMap';

const ROUTE_SOURCE = 'route';
const ROUTE_LAYER = 'routeLine';

function getBounds(geometry: Coordinates[]): [[number, number], [number, number]] {
  const lngs = geometry.map((pt) => pt.longitude);
  const lats = geometry.map((pt) => pt.latitude);
  return [
    [Math.min(...lngs), Math.min(...lats)],
    [Math.max(...lngs), Math.max(...lats)],
  ];
}

function fitPadding(overlayHeight: number) {
  return { top: 60, bottom: overlayHeight + 16, left: 40, right: 40 };
}

function createDot(color: string, size: number, borderWidth: number): HTMLElement {
  const el = document.createElement('div');
  el.style.cssText = [
    `width:${size}px`,
    `height:${size}px`,
    'border-radius:50%',
    `background:${color}`,
    `border:${borderWidth}px solid #fff`,
    'box-sizing:border-box',
  ].join(';');
  return el;
}

/** Adds or refreshes the route line. Safe to call again after a style swap. */
function installRoute(map: maplibregl.Map, geometry: Coordinates[], color: string) {
  const data: GeoJSON.Feature<GeoJSON.LineString> = {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'LineString',
      coordinates: geometry.map((pt) => [pt.longitude, pt.latitude]),
    },
  };
  const source = map.getSource(ROUTE_SOURCE) as maplibregl.GeoJSONSource | undefined;
  if (source) {
    source.setData(data);
  } else {
    map.addSource(ROUTE_SOURCE, { type: 'geojson', data });
  }
  if (map.getLayer(ROUTE_LAYER)) {
    map.setPaintProperty(ROUTE_LAYER, 'line-color', color);
  } else {
    map.addLayer({
      id: ROUTE_LAYER,
      type: 'line',
      source: ROUTE_SOURCE,
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: { 'line-color': color, 'line-width': 4 },
    });
  }
}

const RouteMap = forwardRef<RouteMapHandle, RouteMapProps>(function RouteMap(
  {
    geometry,
    dark,
    accentColor,
    overlayHeight,
    isTracking,
    isFollowingUser,
    userPosition,
    onUserInteraction,
  },
  ref,
) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const styleReadyRef = useRef(false);
  const appliedStyleRef = useRef(getMapStyleUrl(dark));
  const userMarkerRef = useRef<maplibregl.Marker | null>(null);
  const hasInitialZoom = useRef(false);
  const isFirstFit = useRef(true);
  const latest = useRef({ geometry, accentColor, overlayHeight, onUserInteraction });

  useEffect(() => {
    latest.current = { geometry, accentColor, overlayHeight, onUserInteraction };
  });

  useImperativeHandle(ref, () => ({
    fitRoute() {
      mapRef.current?.fitBounds(getBounds(latest.current.geometry), {
        padding: fitPadding(latest.current.overlayHeight),
        duration: 500,
      });
    },
  }));

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const map = new maplibregl.Map({
      container,
      style: appliedStyleRef.current,
      attributionControl: false,
      bounds: getBounds(latest.current.geometry),
      fitBoundsOptions: { padding: fitPadding(latest.current.overlayHeight) },
    });
    map.addControl(new maplibregl.AttributionControl({ compact: true }), 'top-left');
    map.addControl(
      new maplibregl.NavigationControl({ showZoom: false, visualizePitch: false }),
      'top-right',
    );
    map.on('style.load', () => {
      styleReadyRef.current = true;
      installRoute(map, latest.current.geometry, latest.current.accentColor);
    });
    map.on('movestart', (e) => {
      if (e.originalEvent) latest.current.onUserInteraction();
    });
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      styleReadyRef.current = false;
      userMarkerRef.current = null;
    };
  }, []);

  // Light/dark basemap swap; style.load re-installs the route layer.
  useEffect(() => {
    const url = getMapStyleUrl(dark);
    if (!mapRef.current || appliedStyleRef.current === url) return;
    appliedStyleRef.current = url;
    styleReadyRef.current = false;
    mapRef.current.setStyle(url);
  }, [dark]);

  // New geometry (regenerate) or accent colour.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !styleReadyRef.current) return;
    installRoute(map, geometry, accentColor);
  }, [geometry, accentColor]);

  // Start / end markers.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const start = geometry[0];
    const end = geometry[geometry.length - 1];
    const markers = [
      new maplibregl.Marker({ element: createDot('#5DBE4A', 16, 2) })
        .setLngLat([start.longitude, start.latitude])
        .addTo(map),
      new maplibregl.Marker({ element: createDot('#e74c3c', 16, 2) })
        .setLngLat([end.longitude, end.latitude])
        .addTo(map),
    ];
    return () => markers.forEach((marker) => marker.remove());
  }, [geometry]);

  // Frame the route above the overlay whenever it is not being followed on a walk.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || isTracking) return;
    if (isFirstFit.current) {
      isFirstFit.current = false;
      return;
    }
    map.fitBounds(getBounds(geometry), { padding: fitPadding(overlayHeight), duration: 500 });
  }, [geometry, overlayHeight, isTracking]);

  // User position dot.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (isTracking && userPosition) {
      if (userMarkerRef.current) {
        userMarkerRef.current.setLngLat(userPosition);
      } else {
        userMarkerRef.current = new maplibregl.Marker({ element: createDot('#007AFF', 16, 2.5) })
          .setLngLat(userPosition)
          .addTo(map);
      }
    } else if (userMarkerRef.current) {
      userMarkerRef.current.remove();
      userMarkerRef.current = null;
    }
  }, [isTracking, userPosition]);

  // Follow the user: zoom in on the first fix, then pan along.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (!isTracking) {
      hasInitialZoom.current = false;
      return;
    }
    if (!isFollowingUser || !userPosition) return;
    if (!hasInitialZoom.current) {
      map.easeTo({ center: userPosition, zoom: 17, duration: 500 });
      hasInitialZoom.current = true;
    } else {
      map.easeTo({ center: userPosition, duration: 300 });
    }
  }, [isTracking, isFollowingUser, userPosition]);

  return <div ref={containerRef} style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }} />;
});

export default RouteMap;
