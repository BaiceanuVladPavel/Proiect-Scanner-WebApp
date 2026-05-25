export function triggerHaptic(duration = 12) {
  if (typeof navigator === "undefined") {
    return;
  }

  if ("vibrate" in navigator) {
    navigator.vibrate(duration);
  }
}
