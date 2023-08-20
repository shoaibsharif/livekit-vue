import {
  CaptureOptionsBySource,
  setupManualToggle,
  setupMediaToggle,
  ToggleSource,
} from "@livekit/components-core";
import { useEnsureRoom } from "../context/livekit.ts";
import { computed, onMounted, unref } from "vue";
import { useObservableState } from "./internal/useObserableState.ts";

export function useTrackToggle<T extends ToggleSource>({
  source,
  initialState,
  captureOptions,
}: {
  source: T;
  initialState: boolean;
  captureOptions?: CaptureOptionsBySource<T>;
}) {
  const room = useEnsureRoom();
  const track = room?.localParticipant?.getTrack(unref(source));
  const option = computed(() =>
    room ? setupMediaToggle(source, room, captureOptions) : setupManualToggle()
  );

  const pending = useObservableState(option.value.pendingObserver, false);

  const enabled = useObservableState(
    option.value.enabledObserver,
    initialState ?? !!track?.isEnabled
  );

  onMounted(() => {
    if (initialState !== undefined) {
      option.value.toggle(initialState);
    }
  });

  return {
    toggle: option.value.toggle,
    enabled,
    pending,
    track,
  };
}
