import {useEnsureRoom} from "../context/livekit.ts";
import {LocalParticipant} from "livekit-client";
import {participantPermissionObserver} from "@livekit/components-core";
import {useObservableState} from "./internal/useObserableState.ts";

export function useLocalParticipantPermission() {
    const room = useEnsureRoom();

    const permissionObserver = participantPermissionObserver(
        room.localParticipant as LocalParticipant
    );

    return useObservableState(permissionObserver, room.localParticipant.permissions);
}