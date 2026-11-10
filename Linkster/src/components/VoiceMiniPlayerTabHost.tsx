import { useEffect } from 'react';
import { useNavigationState } from '@react-navigation/native';
import ChatVoiceMiniPlayer from './ChatVoiceMiniPlayer';
import { useVoicePlayback } from '../context/VoicePlaybackContext';

/** Плавающий мини-плеер на вкладках, кроме экрана «Чаты». */
export default function VoiceMiniPlayerTabHost() {
  const tabRoute = useNavigationState((state) => {
    const route = state?.routes[state.index];
    return route?.name;
  });
  const voice = useVoicePlayback();

  const { setMiniPlayerHost } = voice;

  useEffect(() => {
    if (tabRoute && tabRoute !== 'Orbit') {
      setMiniPlayerHost('global');
    }
  }, [tabRoute, setMiniPlayerHost]);

  if (tabRoute === 'Orbit') return null;
  return <ChatVoiceMiniPlayer placement="global" />;
}
