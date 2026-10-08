export class HlsPlayer {
  constructor(video, view) {
    this.video = video;
    this.view = view;
    this.hls = null;
    this.loadId = 0;
    this.retryCount = 0;
  }

  destroy() {
    if (this.hls) {
      try { this.hls.destroy(); } catch {}
      this.hls = null;
    }
  }

  async load(channel) {
    const loadId = ++this.loadId;
    this.retryCount = 0;
    this.view.setLoading(true);
    this.destroy();

    const url = channel.url;
    const canNative = this.video.canPlayType("application/vnd.apple.mpegurl");

    if (window.Hls && window.Hls.isSupported()) {
      const instance = new window.Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90
      });

      this.hls = instance;
      instance.loadSource(url);
      instance.attachMedia(this.video);

      instance.on(window.Hls.Events.MANIFEST_PARSED, () => {
        if (loadId !== this.loadId) return;
        this.video.play().catch(() => {});
      });

      instance.on(window.Hls.Events.ERROR, (_event, data) => {
        if (loadId !== this.loadId || !data?.fatal) return;

        if (this.retryCount < 3) {
          this.retryCount += 1;
          if (data.type === window.Hls.ErrorTypes.NETWORK_ERROR) {
            try { instance.startLoad(); return; } catch {}
          }
          if (data.type === window.Hls.ErrorTypes.MEDIA_ERROR) {
            try { instance.recoverMediaError(); return; } catch {}
          }
        }

        this.destroy();
        this.view.showError(`Kanál „${channel.name}“ se nepodařilo načíst`);
      });

      return;
    }

    if (canNative) {
      this.video.src = url;
      this.video.load();
      this.video.play().catch(() => {});
      return;
    }

    this.view.showError("HLS přehrávání není v tomto prohlížeči podporováno");
  }
}
