import { Platform } from 'react-native';

/**
 * Base URL for the shared Elara FastAPI backend (via nginx).
 *
 * Override with EXPO_PUBLIC_API_URL in Frontend-app/.env
 * Examples:
 *   Android emulator: http://10.0.2.2:8080
 *   iOS simulator:    http://127.0.0.1:8080
 *   Physical device:  http://192.168.x.x:8080
 */
const DEFAULT_HOST =
  Platform.OS === 'android' ? 'http://10.0.2.2:8080' : 'http://127.0.0.1:8080';

export const API_BASE_URL = (process.env.EXPO_PUBLIC_API_URL || DEFAULT_HOST).replace(/\/$/, '');
