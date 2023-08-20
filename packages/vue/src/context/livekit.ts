import { Room } from "livekit-client";
import { InjectionKey, inject } from "vue";

export const livekit = Symbol() as InjectionKey<Room | undefined>;

export function useRoomContext() {
  const ctx = inject(livekit);

  if (!ctx) {
    throw new Error("No room Context");
  }

  return ctx;
}

export function useEnsureRoom(room?: Room) {
  const ctx = inject(livekit, room);

  const r = room ?? ctx;

  if (!r) {
    throw new Error(
      "No room provided, make sure you are inside a Room Context or pass the room explicitly"
    );
  }

  return r;
}
