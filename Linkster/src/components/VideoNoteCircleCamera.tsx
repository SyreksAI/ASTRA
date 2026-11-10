import React, { memo, useCallback } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { CameraView } from 'expo-camera';

type CameraViewInstance = React.ComponentRef<typeof CameraView>;
import { linksterCanvas, talkBrand } from '../theme/talkTheme';

type Props = {
  size: number;
  cameraRef: React.RefObject<CameraViewInstance | null>;
  facing: 'front' | 'back';
  torch: boolean;
  canShow: boolean;
  onReady: () => void;
};

function VideoNoteCircleCamera({
  size,
  cameraRef,
  facing,
  torch,
  canShow,
  onReady,
}: Props) {
  const onCameraReady = useCallback(() => {
    onReady();
  }, [onReady]);

  return (
    <View style={[styles.clip, { width: size, height: size, borderRadius: size / 2 }]}>
      {canShow ? (
        <CameraView
          ref={cameraRef}
          style={{ width: size, height: size }}
          mode="video"
          facing={facing}
          mirror={facing === 'front'}
          enableTorch={torch && facing === 'back'}
          onCameraReady={onCameraReady}
        />
      ) : (
        <View style={styles.placeholder}>
          <ActivityIndicator color={talkBrand.accent} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  clip: {
    overflow: 'hidden',
    backgroundColor: linksterCanvas.dark,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default memo(
  VideoNoteCircleCamera,
  (prev, next) =>
    prev.size === next.size &&
    prev.facing === next.facing &&
    prev.torch === next.torch &&
    prev.canShow === next.canShow &&
    prev.cameraRef === next.cameraRef &&
    prev.onReady === next.onReady
);
