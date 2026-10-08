const VOLUME_KEY = "okap_tv_volume_v1";

export function restoreVolume(video, slider) {
  let saved = Number.NaN;
  try {
    saved = Number.parseFloat(localStorage.getItem(VOLUME_KEY));
  } catch {}

  if (Number.isFinite(saved) && saved >= 0 && saved <= 1) {
    video.volume = saved;
    slider.value = String(Math.round(saved * 100));
    video.muted = saved === 0;
    return saved;
  }

  video.volume = 1;
  slider.value = "100";
  return 1;
}

export function persistVolume(video) {
  try {
    localStorage.setItem(VOLUME_KEY, String(video.muted ? 0 : video.volume));
  } catch {}
}
