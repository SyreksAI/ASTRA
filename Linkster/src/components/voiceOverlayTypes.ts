import type { MutableRefObject } from 'react';

export type MicAnchor = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type ComposerScreenRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type VoiceRecordOverlayState = {
  visible: boolean;
  isDark: boolean;
  fingerDown: boolean;
  gestureDx: number;
  gestureDy: number;
  paddingBottom: number;
  micAnchor: MicAnchor | null;
  fingerPage: { x: number; y: number } | null;
  composerRect: ComposerScreenRect | null;
  voicePanHandlers: Record<string, unknown>;
  onClose: () => void;
  onRecorded: (uri: string, durationSec: number) => Promise<void>;
};

export type VideoNoteMeta = {
  durationSec: number;
  width: number;
  height: number;
};

export type VideoNoteGestureRef = {
  dx: number;
  dy: number;
};

export type VideoNoteOverlayState = {
  visible: boolean;
  isDark: boolean;
  fingerDown: boolean;
  /** Обновляется из PanResponder без ре-рендера ChatScreen */
  gestureRef: MutableRefObject<VideoNoteGestureRef>;
  paddingBottom: number;
  camAnchor: MicAnchor | null;
  composerRect: ComposerScreenRect | null;
  videoPanHandlers: Record<string, unknown>;
  onClose: () => void;
  onRecorded: (uri: string, meta: VideoNoteMeta) => Promise<void>;
};
