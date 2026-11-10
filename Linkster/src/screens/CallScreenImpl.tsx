// src/screens/CallScreen.tsx
import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Alert,
  PermissionsAndroid,
  StatusBar,
} from 'react-native';
import {
  RTCPeerConnection,
  RTCIceCandidate,
  RTCSessionDescription,
  mediaDevices,
  RTCView,
} from 'react-native-webrtc';
import RNCallKeep from 'react-native-callkeep';
import InCallManager from 'react-native-incall-manager';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { chatWebSocketUrl } from '../config/api';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    // Для продакшена обязательно добавь свой TURN:
    // { urls: 'turn:your.domain:3478', username: 'user', credential: 'pass' },
  ],
};

type CallState = 'idle' | 'outgoing' | 'incoming' | 'active' | 'ended';
type CallType = 'audio' | 'video';

interface CallScreenProps {
  route?: { params?: { targetUser?: any; callType?: CallType; isIncoming?: boolean; callId?: string } };
  navigation?: any;
  // Альтернативно: можно использовать как модалку, а не экран
  visible?: boolean;
  onClose?: () => void;
}

export default function CallScreen({ route, navigation, visible, onClose }: CallScreenProps) {
  const { token, user } = useAuth();
  const insets = useSafeAreaInsets();

  const params = route?.params || {};
  const [callState, setCallState] = useState<CallState>(params.isIncoming ? 'incoming' : 'outgoing');
  const [callType, setCallType] = useState<CallType>(params.callType || 'audio');
  const [callId, setCallId] = useState<string>(params.callId || '');
  const [remoteUser, setRemoteUser] = useState<any>(params.targetUser || null);
  const [isMuted, setIsMuted] = useState(false);
  const [isFrontCamera, setIsFrontCamera] = useState(true);
  const [localStream, setLocalStream] = useState<any>(null);
  const [remoteStream, setRemoteStream] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [incomingOffer, setIncomingOffer] = useState<any>(null);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const localStreamRef = useRef<any>(null);
  const pendingCandidates = useRef<any[]>([]);
  const callAnsweredRef = useRef(false);

  // ============================================
  // 1. Настройка CallKeep (показ системного вызова)
  // ============================================
  useEffect(() => {
    const setupCallKeep = async () => {
      try {
        await RNCallKeep.setup({
          ios: {
            appName: 'Linkster',
            supportsVideo: true,
            maximumCallGroups: '1',
            maximumCallsPerCallGroup: '1',
          },
          android: {
            alertTitle: 'Требуется разрешение',
            alertDescription: 'Разрешите показ входящих звонков',
            cancelButton: 'Отмена',
            okButton: 'ОК',
            imageName: 'ic_launcher',
            additionalPermissions: [],
          },
        });
        RNCallKeep.setAvailable(true);
      } catch (e) {
        console.warn('CallKeep setup error:', e);
      }
    };
    setupCallKeep();

    RNCallKeep.addEventListener('answerCall', ({ callUUID }) => {
      handleAcceptCall(callUUID);
    });
    RNCallKeep.addEventListener('endCall', ({ callUUID }) => {
      handleEndCall();
    });

    return () => {
      RNCallKeep.removeEventListener('answerCall');
      RNCallKeep.removeEventListener('endCall');
    };
  }, []);

  // ============================================
  // 2. Подключение WebSocket для сигналинга
  // ============================================
  useEffect(() => {
    if (!token) return;
    const ws = new WebSocket(chatWebSocketUrl(token));
    wsRef.current = ws;

    ws.onopen = () => {
      // Если исходящий — отправляем invite
      if (callState === 'outgoing' && remoteUser && !callId) {
        ws.send(JSON.stringify({
          type: 'call:invite',
          target_user_id: remoteUser.id,
          call_type: callType,
        }));
      }
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        handleSignal(data);
      } catch (e) {}
    };

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [token]);

  // ============================================
  // 3. Обработка сигналов
  // ============================================
  const handleSignal = async (data: any) => {
    switch (data.type) {
      case 'call:ringing':
        // Сервер подтвердил наш исходящий звонок
        setCallId(data.call_id);
        break;

      case 'call:incoming':
        // Входящий звонок — покажем экран через CallKit
        setCallId(data.call_id);
        setRemoteUser(data.caller);
        setCallType(data.call_type || 'audio');
        setCallState('incoming');
        RNCallKeep.displayIncomingCall(
          data.call_id,
          data.caller?.username || 'Пользователь',
          `${data.call_type === 'video' ? 'Видеозвонок' : 'Аудиозвонок'}`,
          'generic',
          true,
        );
        break;

      case 'call:accepted':
        setCallState('active');
        setIsConnected(true);
        // Инициатор создаёт offer
        if (callState === 'outgoing' || !callAnsweredRef.current) {
          await createAndSendOffer();
        }
        break;

      case 'call:declined':
      case 'call:ended':
        setCallState('ended');
        cleanup();
        setTimeout(() => onClose?.() || navigation?.goBack(), 800);
        break;

      case 'call:offer':
        setIncomingOffer(data.sdp);
        break;

      case 'call:answer':
        if (pcRef.current) {
          await pcRef.current.setRemoteDescription(new RTCSessionDescription(data.sdp));
          // Применяем накопленные ICE
          for (const c of pendingCandidates.current) {
            try { await pcRef.current.addIceCandidate(c); } catch (e) {}
          }
          pendingCandidates.current = [];
        }
        break;

      case 'call:ice':
        if (data.candidate) {
          const cand = new RTCIceCandidate(data.candidate);
          if (pcRef.current && pcRef.current.remoteDescription) {
            try { await pcRef.current.addIceCandidate(cand); } catch (e) {}
          } else {
            pendingCandidates.current.push(cand);
          }
        }
        break;
    }
  };

  // ============================================
  // 4. Создание медиа + peer connection
  // ============================================
  const createPeerConnection = () => {
    const pc = new RTCPeerConnection(ICE_SERVERS);
    pcRef.current = pc;

    pc.onicecandidate = (event: any) => {
      if (event.candidate && wsRef.current) {
        wsRef.current.send(JSON.stringify({
          type: 'call:ice',
          call_id: callId,
          candidate: event.candidate,
        }));
      }
    };

    pc.ontrack = (event: any) => {
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') {
        setIsConnected(true);
      }
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        handleEndCall();
      }
    };

    return pc;
  };

  const startLocalMedia = async () => {
    // Разрешения на Android
    if (Platform.OS === 'android') {
      await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        PermissionsAndroid.PERMISSIONS.CAMERA,
      ]);
    }

    const stream = await mediaDevices.getUserMedia({
      audio: true,
      video: callType === 'video'
        ? { facingMode: isFrontCamera ? 'user' : 'environment', width: 640, height: 480, frameRate: 30 }
        : false,
    });

    localStreamRef.current = stream;
    setLocalStream(stream);

    InCallManager.start({ media: callType === 'video' ? 'video' : 'audio' });
    InCallManager.setForceSpeakerphoneOn(callType === 'video');
  };

  const createAndSendOffer = async () => {
    if (!pcRef.current || !localStreamRef.current) return;
    localStreamRef.current.getTracks().forEach((track: any) => {
      pcRef.current!.addTrack(track, localStreamRef.current);
    });

    const offer = await pcRef.current.createOffer({});
    await pcRef.current.setLocalDescription(offer);

    wsRef.current?.send(JSON.stringify({
      type: 'call:offer',
      call_id: callId,
      sdp: offer,
    }));
  };

  // ============================================
  // 5. Действия пользователя
  // ============================================
  const handleAcceptCall = async (uuid?: string) => {
    if (callAnsweredRef.current) return;
    callAnsweredRef.current = true;

    setCallState('active');
    await startLocalMedia();
    createPeerConnection();

    // Сообщаем серверу, что приняли
    wsRef.current?.send(JSON.stringify({
      type: 'call:accept',
      call_id: callId,
    }));

    // Если offer уже пришёл — применим
    if (incomingOffer) {
      await pcRef.current!.setRemoteDescription(new RTCSessionDescription(incomingOffer));
      localStreamRef.current.getTracks().forEach((track: any) => {
        pcRef.current!.addTrack(track, localStreamRef.current);
      });
      const answer = await pcRef.current!.createAnswer();
      await pcRef.current!.setLocalDescription(answer);
      wsRef.current?.send(JSON.stringify({
        type: 'call:answer',
        call_id: callId,
        sdp: answer,
      }));
    }

    if (uuid) RNCallKeep.setCurrentCallActive(uuid);
  };

  const handleDeclineCall = () => {
    wsRef.current?.send(JSON.stringify({
      type: 'call:decline',
      call_id: callId,
    }));
    cleanup();
    setTimeout(() => onClose?.() || navigation?.goBack(), 300);
  };

  const handleEndCall = () => {
    wsRef.current?.send(JSON.stringify({
      type: 'call:end',
      call_id: callId,
    }));
    setCallState('ended');
    cleanup();
    setTimeout(() => onClose?.() || navigation?.goBack(), 300);
  };

  const cleanup = () => {
    InCallManager.stop();
    try { localStreamRef.current?.getTracks().forEach((t: any) => t.stop()); } catch (e) {}
    try { pcRef.current?.close(); } catch (e) {}
    pcRef.current = null;
    localStreamRef.current = null;
    setLocalStream(null);
    setRemoteStream(null);
    RNCallKeep.endAllCalls?.();
  };

  useEffect(() => {
    return () => { cleanup(); };
  }, []);

  const toggleMute = () => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const audioTrack = stream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = isMuted; // переключаем
      setIsMuted(!isMuted);
    }
  };

  const switchCamera = () => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const videoTrack = stream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack._switchCamera();
      setIsFrontCamera(!isFrontCamera);
    }
  };

  // ============================================
  // UI
  // ============================================
  const remoteName = remoteUser?.full_name || remoteUser?.username || 'Звонок';
  const statusText =
    callState === 'outgoing' ? 'Вызов…'
    : callState === 'incoming' ? 'Входящий звонок'
    : callState === 'active' && !isConnected ? 'Соединение…'
    : callState === 'active' ? 'В эфире'
    : 'Завершено';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Удалённое видео */}
      {callType === 'video' && remoteStream && (
        <RTCView
          streamURL={remoteStream.toURL()}
          style={StyleSheet.absoluteFill}
          objectFit="cover"
        />
      )}

      {/* Фон для аудио или пока нет видео */}
      {(callType === 'audio' || !remoteStream) && (
        <View style={styles.background}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{remoteName[0]?.toUpperCase()}</Text>
          </View>
        </View>
      )}

      {/* Локальное видео */}
      {callType === 'video' && localStream && (
        <View style={styles.localVideoWrap}>
          <RTCView
            streamURL={localStream.toURL()}
            style={styles.localVideo}
            objectFit="cover"
            mirror={isFrontCamera}
          />
        </View>
      )}

      {/* Верхняя панель */}
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <Text style={styles.name}>{remoteName}</Text>
        <Text style={styles.status}>{statusText}</Text>
      </View>

      {/* Нижние кнопки */}
      <View style={[styles.controls, { paddingBottom: insets.bottom + 30 }]}>
        {callState === 'incoming' ? (
          <>
            <TouchableOpacity style={[styles.bigBtn, styles.declineBtn]} onPress={handleDeclineCall}>
              <Ionicons name="close" size={36} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.bigBtn, styles.acceptBtn]} onPress={() => handleAcceptCall()}>
              <Ionicons name={callType === 'video' ? 'videocam' : 'call'} size={36} color="#fff" />
            </TouchableOpacity>
          </>
        ) : callState === 'outgoing' ? (
          <TouchableOpacity style={[styles.bigBtn, styles.declineBtn]} onPress={handleEndCall}>
            <Ionicons name="close" size={36} color="#fff" />
          </TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity style={styles.smallBtn} onPress={toggleMute}>
              <Ionicons name={isMuted ? 'mic-off' : 'mic'} size={26} color="#fff" />
            </TouchableOpacity>

            {callType === 'video' && (
              <TouchableOpacity style={styles.smallBtn} onPress={switchCamera}>
                <Ionicons name="camera-reverse" size={26} color="#fff" />
              </TouchableOpacity>
            )}

            <TouchableOpacity style={[styles.bigBtn, styles.declineBtn]} onPress={handleEndCall}>
              <Ionicons name="close" size={36} color="#fff" />
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b0b0f' },
  background: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1a1a2e' },
  avatar: {
    width: 140, height: 140, borderRadius: 70,
    backgroundColor: '#1d9bf0',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontSize: 56, fontWeight: '700' },
  header: {
    position: 'absolute', top: 0, left: 0, right: 0,
    alignItems: 'center',
  },
  name: { color: '#fff', fontSize: 24, fontWeight: '700', marginBottom: 4 },
  status: { color: 'rgba(255,255,255,0.7)', fontSize: 15 },
  localVideoWrap: {
    position: 'absolute', top: 80, right: 16,
    width: 120, height: 160,
    borderRadius: 12, overflow: 'hidden',
    backgroundColor: '#000',
    elevation: 4,
  },
  localVideo: { flex: 1 },
  controls: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 20,
  },
  bigBtn: {
    width: 72, height: 72, borderRadius: 36,
    alignItems: 'center', justifyContent: 'center',
  },
  acceptBtn: { backgroundColor: '#22c55e' },
  declineBtn: { backgroundColor: '#ef4444' },
  smallBtn: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
});