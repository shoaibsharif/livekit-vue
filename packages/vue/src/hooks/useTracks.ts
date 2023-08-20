import {
  TrackReferencePlaceholder,
  isSourceWitOptions,
  isSourcesWithOptions,
  log,
  trackReferencesObservable,
  type SourcesArray,
  type TrackReference,
  type TrackReferenceOrPlaceholder,
  type TrackSourceWithOptions,
} from "@livekit/components-core";
import { Participant, Room, RoomEvent, Track } from "livekit-client";
import { computed, ref, unref, watch } from "vue";
import { useEnsureRoom } from "../context/livekit";

export type UseTrackOptions = {
  updateOnlyOn?: RoomEvent[];
  onlySubscribed?: boolean;
  room?: Room;
};
export type UseTracksHookReturnType<T> = T extends Track.Source[]
  ? TrackReference[]
  : T extends TrackSourceWithOptions[]
  ? TrackReferenceOrPlaceholder[]
  : never;

export function useTracks<T extends SourcesArray = Track.Source[]>(
  sources: T = [
    Track.Source.Camera,
    Track.Source.Microphone,
    Track.Source.ScreenShare,
    Track.Source.ScreenShareAudio,
    Track.Source.Unknown,
  ] as T,
  options: UseTrackOptions = {}
) {
  const room = useEnsureRoom(options.room);
  const trackReferences = ref<TrackReference[]>([]);
  const participants = ref<Participant[]>([]);

  watch(
    () => [sources, options.updateOnlyOn, room],
    (_, __, onCleanUp) => {
      const sources_ = sources.map((s) =>
        isSourceWitOptions(s) ? s.source : s
      );
      const subscription = trackReferencesObservable(
        unref(room) as Room,
        sources_,
        {
          additionalRoomEvents: options.updateOnlyOn,
          onlySubscribed: options.onlySubscribed,
        }
      ).subscribe((options) => {
        trackReferences.value = options.trackReferences;
        participants.value = options.participants;
      });

      onCleanUp(() => subscription.unsubscribe());
    },
    { immediate: true }
  );

  const maybeTrackReferences = computed(
    function (): UseTracksHookReturnType<T> {
      if (isSourcesWithOptions(sources)) {
        const requirePlaceholder = requiredPlaceholders(
          sources,
          participants.value as Participant[]
        );

        const trackReferencesWithPlaceholders = Array.from(
          trackReferences.value
        ) as TrackReferenceOrPlaceholder[];

        participants.value.forEach((participant) => {
          if (requirePlaceholder.has(participant.identity)) {
            const sourcesToAddPlaceholder =
              requirePlaceholder.get(participant.identity) ?? [];
            sourcesToAddPlaceholder.forEach((placeholderSource) => {
              if (
                trackReferences.value.find(
                  ({ participant: p, publication }) =>
                    participant.identity === p.identity &&
                    publication.source === placeholderSource
                )
              ) {
                return;
              }
              log.debug(
                `Add ${placeholderSource} placeholder for participant ${participant.identity}.`
              );

              const placeholder: TrackReferencePlaceholder = {
                participant: participant as Participant,
                source: placeholderSource,
              };

              trackReferencesWithPlaceholders.push(placeholder);
            });
          }
        });
        return trackReferencesWithPlaceholders as UseTracksHookReturnType<T>;
      } else {
        return trackReferences.value as UseTracksHookReturnType<T>;
      }
    }
  );

  return maybeTrackReferences;
}

function difference<T>(setA: Set<T>, setB: Set<T>): Set<T> {
  const _difference = new Set(setA);
  for (const elem of setB) {
    _difference.delete(elem);
  }
  return _difference;
}

function requiredPlaceholders<T extends SourcesArray>(
  sources: T,
  participants: Participant[]
): Map<Participant["identity"], Track.Source[]> {
  const placeholderMap = new Map<Participant["identity"], Track.Source[]>();
  if (isSourcesWithOptions(sources)) {
    const sourcesThatNeedPlaceholder = sources
      .filter((sourceWithOption) => sourceWithOption.withPlaceholder)
      .map((sourceWithOption) => sourceWithOption.source);

    participants.forEach((participant) => {
      const sourcesOfSubscribedTracks = participant
        .getTracks()
        .map((pub) => pub.track?.source)
        .filter(
          (trackSource): trackSource is Track.Source =>
            trackSource !== undefined
        );
      const placeholderNeededForThisParticipant = Array.from(
        difference(
          new Set(sourcesThatNeedPlaceholder),
          new Set(sourcesOfSubscribedTracks)
        )
      );
      // If the participant needs placeholder add it to the placeholder map.
      if (placeholderNeededForThisParticipant.length > 0) {
        placeholderMap.set(
          participant.identity,
          placeholderNeededForThisParticipant
        );
      }
    });
  }
  return placeholderMap;
}
