import { createView } from "./view.js";
import { HlsPlayer } from "../functions/hls-player.js";
import { restoreVolume, persistVolume } from "../functions/storage.js";
import { toggleFullscreen } from "../functions/fullscreen.js";
import { moveGridFocus } from "../functions/input.js";

const view = createView();
const player = new HlsPlayer(view.video, view);

let channels = [];
let activeIndex = 0;
let hoverIndex = 0;
let idleTimer = 0;
let volumeTimer = 0;
let clickTimer = 0;
let pendingUnmute = true;

async function loadChannels() {
  const response = await fetch("./data/channels.json", { cache: "no-store" });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = await response.json();
  if (!Array.isArray(data) || data.length === 0) throw new Error("Databáze kanálů je prázdná.");
  return data;
}

function resetIdleTimer() {
  view.setActiveUI();
  window.clearTimeout(idleTimer);
  idleTimer = window.setTimeout(() => view.setIdleUI(), 3000);
}

function showVolumePopup() {
  view.setVolumePopup(true);
  window.clearTimeout(volumeTimer);
  volumeTimer = window.setTimeout(() => {
    if (!view.volumeWrapper.matches(":hover")) view.setVolumePopup(false);
  }, 1800);
}

function changeVolume(delta) {
  pendingUnmute = false;
  view.hideHint();

  const next = Math.min(1, Math.max(0, (view.video.volume || 0) + delta));
  view.video.volume = next;
  view.video.muted = next === 0;
  view.volumeSlider.value = String(Math.round(next * 100));
  persistVolume(view.video);
  showVolumePopup();
  resetIdleTimer();
}

function toggleMute() {
  pendingUnmute = false;
  view.hideHint();

  if (view.video.muted || view.video.volume === 0) {
    view.video.muted = false;
    if (view.video.volume === 0) view.video.volume = 1;
    view.volumeSlider.value = String(Math.round(view.video.volume * 100));
  } else {
    view.video.muted = true;
    view.volumeSlider.value = "0";
  }

  persistVolume(view.video);
  showVolumePopup();
  resetIdleTimer();
}

function selectChannel(index) {
  if (!channels.length || !Number.isFinite(index)) return;
  activeIndex = ((index % channels.length) + channels.length) % channels.length;
  hoverIndex = activeIndex;

  const channel = channels[activeIndex];
  view.setActiveChannel(activeIndex, channel);
  view.setHover(activeIndex);
  player.load(channel);
  resetIdleTimer();
}

function setHover(index, scroll) {
  if (index < 0 || index >= channels.length) return;
  hoverIndex = index;
  view.setHover(index, scroll);
}

function openGrid() {
  setHover(activeIndex, true);
  view.setGridOpen(true);
  resetIdleTimer();
}

function closeGrid() {
  view.setGridOpen(false);
  resetIdleTimer();
}

function toggleGrid() {
  view.gridIsOpen() ? closeGrid() : openGrid();
}

function togglePlay() {
  if (view.video.paused) view.video.play().catch(() => {});
  else view.video.pause();
  resetIdleTimer();
}

function tryUnmuteOnGesture(event) {
  if (!pendingUnmute) return;
  const target = event?.target;
  if (target?.closest?.("#muteBtn, #volumePopup, .VolumeSliderContainer")) return;

  pendingUnmute = false;
  view.video.muted = false;
  view.volumeSlider.value = String(Math.round(view.video.volume * 100));
  persistVolume(view.video);
  view.hideHint();
}

function bindMediaEvents() {
  view.video.addEventListener("play", () => view.setPlaying(true));
  view.video.addEventListener("pause", () => view.setPlaying(false));
  view.video.addEventListener("playing", () => view.setLoading(false));
  view.video.addEventListener("canplay", () => view.setLoading(false));
  view.video.addEventListener("waiting", () => view.setLoading(true));
  view.video.addEventListener("volumechange", () => {
    view.volumeSlider.value = String(Math.round((view.video.volume || 0) * 100));
    view.setVolumeIcon(view.video.muted, view.video.volume);
  });
  view.video.addEventListener("error", () => {
    if (!player.hls) view.showError("Chyba přehrávání streamu");
  });
}

function bindUI() {
  view.centerPlay.addEventListener("click", (event) => { event.stopPropagation(); togglePlay(); });
  view.gridBtn.addEventListener("click", (event) => { event.stopPropagation(); toggleGrid(); });
  view.muteBtn.addEventListener("click", (event) => { event.stopPropagation(); toggleMute(); });
  view.fullscreenBtn.addEventListener("click", (event) => { event.stopPropagation(); toggleFullscreen(); });

  view.volumeSlider.addEventListener("input", () => {
    pendingUnmute = false;
    view.video.volume = Number(view.volumeSlider.value) / 100;
    view.video.muted = view.video.volume === 0;
    persistVolume(view.video);
    view.setVolumeIcon(view.video.muted, view.video.volume);
    showVolumePopup();
    resetIdleTimer();
  });

  view.muteBtn.addEventListener("mouseenter", () => {
    view.setVolumePopup(true);
    window.clearTimeout(volumeTimer);
    resetIdleTimer();
  });

  view.volumeWrapper.addEventListener("mouseenter", () => window.clearTimeout(volumeTimer));
  view.volumeWrapper.addEventListener("mouseleave", () => {
    window.clearTimeout(volumeTimer);
    volumeTimer = window.setTimeout(() => view.setVolumePopup(false), 1200);
  });

  view.overlay.addEventListener("click", (event) => {
    if (event.target === view.overlay) closeGrid();
  });

  document.addEventListener("click", (event) => {
    tryUnmuteOnGesture(event);
    if (event.target.closest(".CenterButtonsRow, .GridOverlay")) return;
    if (clickTimer) return;
    clickTimer = window.setTimeout(() => {
      clickTimer = 0;
      togglePlay();
    }, 180);
  });

  document.addEventListener("dblclick", (event) => {
    if (event.target.closest(".CenterButtonsRow, .GridOverlay")) return;
    window.clearTimeout(clickTimer);
    clickTimer = 0;
    toggleFullscreen();
  });

  document.addEventListener("contextmenu", (event) => event.preventDefault());

  window.addEventListener("mousemove", resetIdleTimer, { passive: true });
  window.addEventListener("mousedown", resetIdleTimer, { passive: true });
  window.addEventListener("touchstart", resetIdleTimer, { passive: true });

  document.addEventListener("touchstart", tryUnmuteOnGesture, { passive: true, capture: true });
  document.addEventListener("keydown", tryUnmuteOnGesture, { capture: true });

  window.addEventListener("wheel", (event) => {
    if (view.gridIsOpen() || !event.deltaY) return;
    changeVolume(event.deltaY < 0 ? 0.03 : -0.03);
  }, { passive: true });

  window.addEventListener("keydown", (event) => {
    resetIdleTimer();
    const gridOpen = view.gridIsOpen();

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      gridOpen ? (selectChannel(hoverIndex), closeGrid()) : togglePlay();
      return;
    }

    if (event.key === "Escape") {
      if (gridOpen) closeGrid();
      return;
    }

    if (event.key === "f" || event.key === "F") {
      toggleFullscreen();
      return;
    }

    if (event.key === "m" || event.key === "M") {
      toggleMute();
      return;
    }

    if (event.key === "g" || event.key === "G") {
      toggleGrid();
      return;
    }

    if (["ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown"].includes(event.key)) {
      event.preventDefault();
      if (gridOpen) {
        setHover(moveGridFocus(view.getGridItems(), hoverIndex, event.key), true);
        return;
      }
      if (event.key === "ArrowRight") selectChannel(activeIndex + 1);
      else if (event.key === "ArrowLeft") selectChannel(activeIndex - 1);
      else if (event.key === "ArrowUp") changeVolume(0.05);
      else changeVolume(-0.05);
    }
  });
}

async function init() {
  view.setPlaying(false);
  restoreVolume(view.video, view.volumeSlider);
  view.setVolumeIcon(view.video.muted, view.video.volume);
  bindMediaEvents();
  bindUI();

  try {
    channels = await loadChannels();
    view.renderChannels(channels, (index) => {
      selectChannel(index);
      closeGrid();
    }, setHover);
    selectChannel(0);
  } catch (error) {
    view.showError("Kanály se nepodařilo načíst.");
    console.error("[OKAP TV]", error);
  }

  window.setTimeout(() => {
    if (pendingUnmute) view.showHint();
  }, 1500);

  resetIdleTimer();
}

init();
