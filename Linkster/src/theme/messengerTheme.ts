import { Platform, StyleSheet, type TextStyle, type ViewStyle } from 'react-native';
import { getTalkColors, linksterCanvas, talkBrand, talkShadow, type TalkColors } from './talkTheme';

/** Отступы и скругления Linkster Messenger 2 */
export const messengerLayout = {
  screenPaddingH: 16,
  listGap: 10,
  rowRadius: 18,
  avatarSize: 52,
  bubbleRadius: 18,
  bubbleTail: 6,
  fabSize: 58,
  headerAccentHeight: 3,
} as const;

export type MessengerSurfaces = {
  listBg: string;
  rowBg: string;
  rowBorder: string;
  rowPressed: string;
  chatWallpaper: string;
  composerBg: string;
  composerBorder: string;
};

export function getMessengerSurfaces(isDark: boolean): MessengerSurfaces {
  const c = getTalkColors(isDark);
  if (isDark) {
    return {
      listBg: linksterCanvas.dark,
      rowBg: linksterCanvas.dark,
      rowBorder: c.border,
      rowPressed: '#1A1A1A',
      chatWallpaper: linksterCanvas.dark,
      composerBg: linksterCanvas.dark,
      composerBorder: c.border,
    };
  }
  return {
    listBg: linksterCanvas.light,
    rowBg: linksterCanvas.light,
    rowBorder: 'rgba(15, 23, 42, 0.06)',
    rowPressed: '#F5F5F5',
    chatWallpaper: linksterCanvas.light,
    composerBg: linksterCanvas.light,
    composerBorder: c.border,
  };
}

export function conversationRowStyle(isDark: boolean, pressed?: boolean): ViewStyle {
  const s = getMessengerSurfaces(isDark);
  return {
    backgroundColor: pressed ? s.rowPressed : s.rowBg,
    borderRadius: messengerLayout.rowRadius,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: s.rowBorder,
    marginHorizontal: messengerLayout.screenPaddingH,
    marginBottom: messengerLayout.listGap,
    ...talkShadow(isDark, isDark ? 0 : 2),
  };
}

export function messageBubbleStyle(isDark: boolean, isMe: boolean): ViewStyle {
  if (isMe) {
    return {
      backgroundColor: talkBrand.accent,
      borderBottomRightRadius: messengerLayout.bubbleTail,
    };
  }
  const c = getTalkColors(isDark);
  return {
    backgroundColor: isDark ? '#152A3A' : '#FFFFFF',
    borderBottomLeftRadius: messengerLayout.bubbleTail,
    borderWidth: isDark ? 0 : StyleSheet.hairlineWidth,
    borderColor: c.border,
  };
}

export function messageTextStyle(isMe: boolean): TextStyle {
  return {
    fontSize: 16,
    lineHeight: 22,
    color: isMe ? '#FFFFFF' : undefined,
  };
}

export function openChatHeaderSubtitle(isOnline: boolean, isDark: boolean): TextStyle {
  return {
    fontSize: 13,
    fontWeight: '500',
    color: isOnline ? talkBrand.online : getTalkColors(isDark).textSecondary,
  };
}

export function fabStyle(isDark: boolean): ViewStyle {
  return {
    width: messengerLayout.fabSize,
    height: messengerLayout.fabSize,
    borderRadius: messengerLayout.fabSize / 2,
    backgroundColor: talkBrand.accent,
    justifyContent: 'center',
    alignItems: 'center',
    ...talkShadow(isDark, Platform.OS === 'android' ? 6 : 8),
  };
}

export function hubAccentBar(): ViewStyle {
  return {
    height: messengerLayout.headerAccentHeight,
    backgroundColor: talkBrand.accent,
    opacity: 0.85,
    marginHorizontal: messengerLayout.screenPaddingH,
    borderRadius: 2,
    marginTop: 4,
    marginBottom: 8,
  };
}

export type { TalkColors };
