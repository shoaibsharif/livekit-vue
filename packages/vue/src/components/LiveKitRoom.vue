<script setup lang="ts">
import { setupLiveKitRoom } from "@livekit/components-core";
import { LiveKitRoomProps, useLiveKitRoom } from "../hooks/useLiveKitRoom";
const props = withDefaults(defineProps<LiveKitRoomProps>(), {
  connect: true,
  audio: false,
  video: false,
});
const emits = defineEmits<{
  connected: [];
  disconnected: [];
}>();

useLiveKitRoom({
  ...props,
  onConnected() {
    emits("connected");
  },
  onDisconnected() {
    emits("disconnected");
  },
});

const { className } = setupLiveKitRoom();
</script>

<template>
  <div :class="className">
    <slot />
  </div>
</template>
