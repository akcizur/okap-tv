export function getFullscreenElement() {
  return document.fullscreenElement || document.webkitFullscreenElement || null;
}

export function toggleFullscreen() {
  if (!getFullscreenElement()) {
    const element = document.documentElement;
    const request = element.requestFullscreen || element.webkitRequestFullscreen;
    if (request) {
      const promise = request.call(element);
      promise?.catch?.(() => {});
    }
    return;
  }

  const exit = document.exitFullscreen || document.webkitExitFullscreen;
  if (exit) {
    const promise = exit.call(document);
    promise?.catch?.(() => {});
  }
}
