let context: AudioContext | null = null;
export type Playback = {
  buffer: AudioBuffer;
  onPlaying: (playing: boolean) => void;
  onBlocked: () => void;
};
const pending: Playback[] = [];
let current: { item: Playback; source: AudioBufferSourceNode } | null = null;
let timer: ReturnType<typeof setTimeout> | undefined;

// Invoke directly from a user gesture, before any asynchronous work.
export function unlockTts() {
  context ??= new AudioContext();
  return context.resume().then(playNext);
}

function playNext() {
  if (current || timer || !pending.length) return;
  if (!context || context.state !== "running") {
    pending.forEach((item) => item.onBlocked());
    return;
  }
  const item = pending.shift()!;
  const source = context.createBufferSource();
  source.buffer = item.buffer;
  source.connect(context.destination);
  current = { item, source };
  source.onended = () => {
    source.disconnect();
    if (current?.source !== source) return;
    current = null;
    item.onPlaying(false);
    timer = setTimeout(() => {
      timer = undefined;
      playNext();
    }, 300);
  };
  source.start();
  item.onPlaying(true);
}

export async function prepareTts(data: Blob) {
  context ??= new AudioContext();
  return context.decodeAudioData(await data.arrayBuffer());
}

export function enqueueTts(item: Playback) {
  if (current?.item === item || pending.includes(item)) return;
  pending.push(item);
  playNext();
}

export function cancelTts(item: Playback) {
  const index = pending.indexOf(item);
  if (index !== -1) pending.splice(index, 1);
  if (current?.item === item) {
    const { source } = current;
    current = null;
    source.stop();
    source.disconnect();
    item.onPlaying(false);
    playNext();
  }
}
