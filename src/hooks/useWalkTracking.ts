import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import * as Location from 'expo-location';
import { useEffect, useRef, useState } from 'react';
import { Alert, AppState } from 'react-native';
import { useTranslation } from '../i18n';
import { StepSubscription, watchSteps } from '../services/stepCounter';
import { useStore } from '../store/useStore';
import { LngLat } from '../types';

export function useWalkTracking() {
  const t = useTranslation();
  const {
    isTracking: storedIsTracking,
    liveStepsSnapshot,
    setIsTracking: setStoredIsTracking,
    setLiveStepsSnapshot,
  } = useStore();
  const [isTracking, setIsTracking] = useState(false);
  const [liveSteps, setLiveSteps] = useState(0);
  const [userPosition, setUserPosition] = useState<LngLat | null>(null);
  const [isFollowingUser, setIsFollowingUser] = useState(false);
  const stepWatchRef = useRef<StepSubscription | null>(null);
  const locationWatchRef = useRef<Location.LocationSubscription | null>(null);
  const isFollowingUserRef = useRef(false);
  const isTrackingRef = useRef(false);
  const liveStepsRef = useRef(0);

  useEffect(() => {
    isFollowingUserRef.current = isFollowingUser;
  }, [isFollowingUser]);

  useEffect(() => {
    isTrackingRef.current = isTracking;
  }, [isTracking]);

  useEffect(() => {
    liveStepsRef.current = liveSteps;
  }, [liveSteps]);

  // Auto-resume tracking after app was killed in background
  useEffect(() => {
    if (storedIsTracking && !isTracking) {
      resumeTracking();
    }
  }, [storedIsTracking]);

  // Save step count snapshot when app goes to background
  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState) => {
      if ((nextState === 'background' || nextState === 'inactive') && isTrackingRef.current) {
        setLiveStepsSnapshot(liveStepsRef.current);
      }
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    return () => {
      stepWatchRef.current?.remove();
      locationWatchRef.current?.remove();
      deactivateKeepAwake();
    };
  }, []);

  async function startSubscriptions(stepsBaseline: number) {
    await activateKeepAwakeAsync();
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t.map.locationPermissionDeniedTitle, t.map.locationPermissionDeniedMessage);
    } else {
      setIsFollowingUser(true);
      isFollowingUserRef.current = true;
      locationWatchRef.current = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.BestForNavigation, distanceInterval: 3 },
        (loc) => setUserPosition([loc.coords.longitude, loc.coords.latitude]),
      );
    }
    stepWatchRef.current = await watchSteps((steps) => setLiveSteps(stepsBaseline + steps));
  }

  async function startWalk() {
    setLiveSteps(0);
    liveStepsRef.current = 0;
    setStoredIsTracking(true);
    setLiveStepsSnapshot(0);
    setIsTracking(true);
    isTrackingRef.current = true;
    await startSubscriptions(0);
  }

  async function resumeTracking() {
    setIsTracking(true);
    isTrackingRef.current = true;
    setLiveSteps(liveStepsSnapshot);
    liveStepsRef.current = liveStepsSnapshot;
    await startSubscriptions(liveStepsSnapshot);
  }

  function stopWalk() {
    deactivateKeepAwake();
    stepWatchRef.current?.remove();
    stepWatchRef.current = null;
    locationWatchRef.current?.remove();
    locationWatchRef.current = null;
    setUserPosition(null);
    setIsFollowingUser(false);
    isFollowingUserRef.current = false;
    setLiveSteps(0);
    liveStepsRef.current = 0;
    setIsTracking(false);
    isTrackingRef.current = false;
    setStoredIsTracking(false);
    setLiveStepsSnapshot(0);
  }

  /** Re-attaches the camera to the user after they panned away. */
  function followUser() {
    setIsFollowingUser(true);
    isFollowingUserRef.current = true;
  }

  /** Called when the user drags the map: stop auto-following during a walk. */
  function handleUserInteraction() {
    if (isTrackingRef.current && isFollowingUserRef.current) {
      isFollowingUserRef.current = false;
      setIsFollowingUser(false);
    }
  }

  return {
    isTracking,
    liveSteps,
    userPosition,
    isFollowingUser,
    startWalk,
    stopWalk,
    followUser,
    handleUserInteraction,
  };
}
