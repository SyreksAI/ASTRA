import { useEffect } from 'react';
import { useNavigationState } from '@react-navigation/native';
import ChatVideoNoteMiniPlayer from './ChatVideoNoteMiniPlayer';
import { useVideoNotePlayback } from '../context/VideoNotePlaybackContext';

export default function VideoNoteMiniPlayerTabHost() {
  const tabRoute = useNavigationState((state) => {
    const route = state?.routes[state.index];
    return route?.name;
  });
  const { setMiniPlayerHost } = useVideoNotePlayback();

  useEffect(() => {
    if (tabRoute && tabRoute !== 'Orbit') {
      setMiniPlayerHost('global');
    }
  }, [tabRoute, setMiniPlayerHost]);

  if (tabRoute === 'Orbit') return null;
  return <ChatVideoNoteMiniPlayer placement="global" />;
}
