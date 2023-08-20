import { Participant, Room, RoomEvent } from "livekit-client";
import { ref } from "vue";

export const useLiveKitRoom = () => {
  const room = ref<Room | undefined>();
  const participants = ref<Participant[]>([]);
  const { $axios } = useNuxtApp();
  const config = useRuntimeConfig();

  async function createToken() {
    const token = await $axios
      .post("/v1/livekit/token", {
        participant_name: uuid(),
        room: "a-new-room",
      })
      .then((res) => res.data.token);

    room.value = new Room();
    room.value.connect(config.public.lkitUrl, token);

    triggerEvent();
  }

  function triggerEvent() {
    room.value?.on(RoomEvent.ParticipantConnected, async (participant) => {
      console.log("new Participant", participant);
      participants.value.push(participant);
    });

    room.value?.on(RoomEvent.ParticipantDisconnected, (participant) => {
      participants.value = participants.value.filter(
        (p) => p.sid !== participant.sid
      );
    });

    // room.value?.on(
    //   RoomEvent.TrackSubscribed,
    //   (track, publication, participant) => {
    //     //?
    //   }
    // );

    room.value?.on(RoomEvent.TrackUnsubscribed, (track) => {
      track.detach();
    });

    room.value?.on(RoomEvent.Disconnected, (reason) => {
      console.log("Disconnected from room");
      room.value = undefined;
    });

    room.value?.on(RoomEvent.SignalConnected, async () => {
      console.log("Signal Connect Event");
      console.log("signal events", room.value?.participants);
      await Promise.all([
        room.value?.localParticipant.setCameraEnabled(true),
        room.value?.localParticipant.setMicrophoneEnabled(true),
        // room.value?.localParticipant.setScreenShareEnabled(true),
      ]).catch((e) => {
        console.log(e);
      });
    });
  }
  return {
    room,
    createToken,
    participants,
  };
};
