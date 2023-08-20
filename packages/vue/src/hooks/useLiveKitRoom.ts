import { log } from "@livekit/components-core";
import {
  AudioCaptureOptions,
  ConnectionState,
  MediaDeviceFailure,
  Room,
  RoomConnectOptions,
  RoomEvent,
  RoomOptions,
  ScreenShareCaptureOptions,
  VideoCaptureOptions,
} from "livekit-client";
import { getCurrentScope, onScopeDispose, provide, ref, watch } from "vue";
import { livekit } from "../context/livekit";

export interface LiveKitRoomProps {
  serverUrl: string | undefined;

  token: string | undefined;

  audio?: AudioCaptureOptions | boolean;

  video?: VideoCaptureOptions | boolean;

  connect?: boolean;

  screen?: ScreenShareCaptureOptions | boolean;

  options?: RoomOptions;

  room?: Room;

  connectOptions?: RoomConnectOptions;

  simulateParticipants?: number;
}

interface UseLiveKitRoomProps extends LiveKitRoomProps {
  onConnected?: () => void;
  onDisconnected?: () => void;
  onError?: (e: Error) => void;
  onMediaDeviceFailure?: (failure?: MediaDeviceFailure) => void;
}

export const useLiveKitRoom = (props: UseLiveKitRoomProps) => {
  const room = ref<Room | undefined>();
  watch(
    () => [props.options, props.room],
    () => {
      room.value = props.room ?? new Room(props.options);
      provide(livekit, room.value);
      const connectionSateChangeListener = (state: ConnectionState) => {
        switch (state) {
          case ConnectionState.Connected:
            props.onConnected?.();
            break;
          case ConnectionState.Disconnected:
            props.onDisconnected?.();
            break;
          default:
            break;
        }
      };
      room.value.on(
        RoomEvent.ConnectionStateChanged,
        connectionSateChangeListener
      );

      if (getCurrentScope()) {
        onScopeDispose(() => {
          room.value?.off(
            RoomEvent.ConnectionStateChanged,
            connectionSateChangeListener
          );
        });
      }
    },
    { immediate: true }
  );

  watch(
    () => [props.room, props.audio, props.video, props.screen],
    () => {
      if (!room.value) return;

      const onSignalConnected = () => {
        if (!room.value) return;
        const localParticipant = room.value.localParticipant;

        log.debug("trying to publish local tracks");
        Promise.all([
          localParticipant.setMicrophoneEnabled(
            !!props.audio,
            typeof props.audio !== "boolean" ? props.audio : undefined
          ),
          localParticipant.setCameraEnabled(
            !!props.video,
            typeof props.video !== "boolean" ? props.video : undefined
          ),
          localParticipant.setScreenShareEnabled(
            !!props.screen,
            typeof props.screen !== "boolean" ? props.screen : undefined
          ),
        ]).catch((e) => {
          log.warn(e);
        });
      };

      const onMediaDeviceError = (e: Error) => {
        const mediaDeviceFailure = MediaDeviceFailure.getFailure(e);

        props.onMediaDeviceFailure?.(mediaDeviceFailure);
      };

      room.value.on(RoomEvent.SignalConnected, onSignalConnected);

      room.value.on(RoomEvent.MediaDevicesError, onMediaDeviceError);

      if (getCurrentScope()) {
        onScopeDispose(() => {
          room.value?.off(RoomEvent.SignalConnected, onSignalConnected);
          room.value?.off(RoomEvent.MediaDevicesError, onMediaDeviceError);
        });
      }
    },
    { immediate: true }
  );

  watch(
    () => [
      room.value,
      props.token,
      props.serverUrl,
      props.connectOptions,
      props.connect,
      props.simulateParticipants,
    ],
    () => {
      if (!room.value) return;

      if (props.simulateParticipants) {
        room.value.simulateParticipants({
          participants: {
            count: props.simulateParticipants,
          },
          publish: {
            audio: true,
            useRealTracks: true,
          },
        });
        return;
      }

      if (!props.token) {
        log.debug("no token yet");
        return;
      }

      if (!props.serverUrl) {
        log.warn("no livekit url provided");
        props.onError?.(Error("no livekit url provided"));
        return;
      }

      if (props.connect) {
        log.debug("connecting");
        room.value
          .connect(props.serverUrl, props.token, props.connectOptions)
          .catch((e) => {
            log.warn(e);
            props.onError?.(e);
          });
      } else {
        log.debug("disconnecting because connect is false");
        room.value.disconnect();
      }
    },
    { immediate: true }
  );
  if (getCurrentScope()) {
    onScopeDispose(() => {
      room.value?.disconnect();
    });
  }
  return {
    room,
  };
};
