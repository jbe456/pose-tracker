export function syncCanvasToVideo(
  canvas: HTMLCanvasElement,
  video: HTMLVideoElement
) {
  if (!video.videoWidth || !video.videoHeight) return;
  const { videoWidth: w, videoHeight: h } = video;
  canvas.width = w;
  canvas.height = h;
}
