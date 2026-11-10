import type { ImageStyle } from 'react-native';
import { talkLogoHeightForWidth } from './talkLogoConstants';

/** Единый размер логотипа на Welcome, Login, Register, AstraConnect */
export const AUTH_LOGO_WIDTH = 280;

export const authLogoStyle: ImageStyle = {
  width: '100%',
  maxWidth: AUTH_LOGO_WIDTH,
  height: talkLogoHeightForWidth(AUTH_LOGO_WIDTH),
  alignSelf: 'center',
  marginBottom: 16,
};
