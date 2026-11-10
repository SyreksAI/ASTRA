import type { ComponentType } from 'react';
import CallScreenExpoGoStub from '../screens/CallScreenExpoGoStub';

/** В Expo Go / без native WebRTC — только заглушка (иначе приложение падает при require CallScreenImpl). */
export function getCallScreenComponent(): ComponentType<unknown> {
  return CallScreenExpoGoStub;
}
