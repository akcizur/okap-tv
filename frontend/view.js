import { icons } from "./icons.js";

export function createView() {
  const els = {
    body: document.body,
    video: document.querySelector("#video"),
    loading: document.querySelector("#loading"),
    error: document.querySelector("#errorToast"),
    unmuteHint: document.querySelector("#unmuteHint"),
    overlay: document.querySelector("#gridOverlay"),
    grid: document.querySelector("#gridContainer"),
    centerPlay: document.querySelector("#centerPlayBtn"),
    gridBtn: document.querySelector("#gridBtn"),
    muteBtn: document.querySelector("#muteBtn"),
    fullscreenBtn: document.querySelector("#fullscreenBtn"),
    volumeWrapper: document.querySelector("#volumeWrapper"),
    volumeSlider: document.querySelector("#volumeSlider"),
    volumeIcon: document.querySelector("#volumeIcon"),
    channelName: document.querySelector("#channelName"),
    channelLogo: document.querySelector("#channelLogo")
  };

  let gridItems = [];
  let errorTimer = null;

  function setLoading(active) {
    els.loading.classList.toggle("show", Boolean(active));
  }

  function showError(message) {
    setLoading(false);
    els.error.textContent = message;
    els.error.classList.add("show");
    window.clearTimeout(errorTimer);
    errorTimer = window.setTimeout(() => els.error.classList.remove("show"), 4200);
  }

  function renderChannels(channels, onSelect, onHover) {
    els.grid.replaceChildren();
    gridItems = channels.map((channel, index) => {
      const item = document.createElement("button");
      item.type = "button";
      item.className = "GridItem";
      item.dataset.index = String(index);
      item.setAttribute("aria-label", channel.name);
      item.title = channel.name;
      item.innerHTML = `<img src="${channel.logo}" alt="" draggable="false" loading="eager" decoding="async">`;
      item.addEventListener("mouseenter", () => onHover(index, false));
      item.addEventListener("focus", () => onHover(index, false));
      item.addEventListener("click", (event) => {
        event.stopPropagation();
        onSelect(index);
      });
      els.grid.appendChild(item);
      const preload = new Image();
      preload.src = channel.logo;
      return item;
    });
  }

  function setActiveChannel(index, channel) {
    els.channelName.textContent = channel.name;
    els.channelLogo.src = channel.logo;
    els.channelLogo.alt = channel.name;
    gridItems.forEach((item, i) => item.classList.toggle("active", i === index));
  }

  function setHover(index, scroll = false) {
    gridItems.forEach((item, i) => item.classList.toggle("hovered", i === index));
    if (scroll && gridItems[index]) {
      gridItems[index].scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }

  function focusHover() {
    const index = gridItems.findIndex((item) => item.classList.contains("hovered"));
    if (index >= 0) gridItems[index].focus({ preventScroll: true });
  }

  function setGridOpen(open) {
    els.overlay.classList.toggle("active", open);
    els.overlay.setAttribute("aria-hidden", String(!open));
    if (open) focusHover();
  }

  function gridIsOpen() {
    return els.overlay.classList.contains("active");
  }

  function getGridItems() {
    return gridItems;
  }

  function setPlaying(playing) {
    els.body.classList.toggle("isPaused", !playing);
    els.centerPlay.innerHTML = playing ? icons.pause : icons.play;
  }

  function setVolumeIcon(muted, volume) {
    els.volumeIcon.innerHTML = muted || volume === 0 ? icons.volumeOff : icons.volumeOn;
  }

  function setActiveUI() {
    els.body.classList.remove("IdleUI");
  }

  function setIdleUI() {
    els.body.classList.add("IdleUI");
    els.volumeWrapper.classList.remove("open");
  }

  function setVolumePopup(open) {
    els.volumeWrapper.classList.toggle("open", open);
  }

  function showHint() {
    els.unmuteHint.classList.add("show");
    els.unmuteHint.setAttribute("aria-hidden", "false");
  }

  function hideHint() {
    els.unmuteHint.classList.remove("show");
    els.unmuteHint.setAttribute("aria-hidden", "true");
  }

  return {
    ...els,
    setLoading,
    showError,
    renderChannels,
    setActiveChannel,
    setHover,
    setGridOpen,
    gridIsOpen,
    getGridItems,
    setPlaying,
    setVolumeIcon,
    setActiveUI,
    setIdleUI,
    setVolumePopup,
    showHint,
    hideHint
  };
}
