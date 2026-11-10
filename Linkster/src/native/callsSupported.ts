import Constants, { ExecutionEnvironment } from 'expo-constants';

/** WebRTC / CallKeep — только custom dev/production build, не Expo Go */
export function isNativeCallsSupported(): boolean {
  if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) {
    return false;
  }
  if (Constants.appOwnership === 'expo') {
    return false;
  }
  return true;
}
