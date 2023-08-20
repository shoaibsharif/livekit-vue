import { setupDeviceSelector } from "@livekit/components-core";
import { LocalAudioTrack, LocalVideoTrack, Room } from "livekit-client";
import { ref, watch } from "vue";
import { useEnsureRoom } from "../context/livekit";

/** @public */
interface UseMediaDeviceSelectProps {
  kind: MediaDeviceKind;
  room?: Room;
  track?: LocalAudioTrack | LocalVideoTrack;
  /**
   * this will call getUserMedia if the permissions are not yet given to enumerate the devices with device labels.
   * in some browsers multiple calls to getUserMedia result in multiple permission prompts.
   * It's generally advised only flip this to true, once a (preview) track has been acquired successfully with the
   * appropriate permissions.
   *
   * @see {@link MediaDeviceMenu}
   * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/enumerateDevices | MDN enumerateDevices}
   */
  requestPermissions?: boolean;
}

export function useMediaDeviceSelect({
  kind,
  room,
  track,
}: UseMediaDeviceSelectProps) {
  const roomCtx = useEnsureRoom(room);
  const currentDeviceId = ref("");

  const { className, activeDeviceObservable, setActiveMediaDevice } =
    setupDeviceSelector(kind, roomCtx, track);

  watch(
    () => activeDeviceObservable,
    (_, __, needsCleanup) => {
      const listener = activeDeviceObservable.subscribe((deviceId) => {
        if (deviceId) {
          currentDeviceId.value = deviceId;
        }
      });

      needsCleanup(() => {
        listener?.unsubscribe();
      });
    }
  );

  return { currentDeviceId, setActiveMediaDevice, className };
}
