const pending: HTMLAudioElement[] = [];
let current: HTMLAudioElement | null = null;
let detach: (() => void) | null = null;
let waitingForNext = false;

function release(audio: HTMLAudioElement) {
  if (current !== audio) return;
  detach?.();
  detach = null;
  current = null;
  waitingForNext = true;
  setTimeout(() => {
    waitingForNext = false;
    playNext();
  }, 300);
}

function playNext() {
  if (current || waitingForNext) return;
  const audio = pending.shift();
  if (!audio) return;
  current = audio;
  const finish = () => release(audio);
  audio.addEventListener("ended", finish);
  audio.addEventListener("error", finish);
  detach = () => {
    audio.removeEventListener("ended", finish);
    audio.removeEventListener("error", finish);
  };
  void audio.play().catch(finish);
}

export function enqueueTts(audio: HTMLAudioElement) {
  if (current === audio) {
    if (audio.paused) void audio.play().catch(() => release(audio));
    return;
  }
  if (!pending.includes(audio)) pending.push(audio);
  queueMicrotask(playNext);
}

export function cancelTts(audio: HTMLAudioElement) {
  const index = pending.indexOf(audio);
  if (index !== -1) pending.splice(index, 1);
  audio.pause();
  release(audio);
}
