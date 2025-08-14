import { useRef, useEffect, useState } from "react";
import { DrawingUtils } from "@mediapipe/tasks-vision";

export default function VideoOverlay({ ytUrl, poseLandmarker }: any) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState("Idle");

  useEffect(() => {
    if (!ytUrl) return;
    (async () => {
      setStatus("Fetching video…");
      const resp = await fetch(
        `/api/videos/stream?url=${encodeURIComponent(ytUrl)}`
      );
      if (!resp.ok) return setStatus("Failed to load");
      const blob = await resp.blob();
      videoRef.current!.src = URL.createObjectURL(blob);
      await videoRef.current!.play();
      setStatus("Playing");
    })();
  }, [ytUrl]);

  useEffect(() => {
    let raf = 0;
    const ctx = canvasRef.current!.getContext("2d")!;
    const draw = new DrawingUtils(ctx);
    const loop = async () => {
      if (
        !videoRef.current ||
        videoRef.current.paused ||
        videoRef.current.ended
      )
        return;
      const result = await poseLandmarker.detectForVideo(
        videoRef.current,
        performance.now()
      );
      ctx.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);
      result.landmarks.forEach((lm: any) => draw.drawLandmarks(lm));
      raf = requestAnimationFrame(loop);
    };
    if (poseLandmarker) raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [poseLandmarker]);

  return (
    <div className="relative">
      <video ref={videoRef} playsInline muted className="w-full" />
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      <div className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
        {status}
      </div>
    </div>
  );
}
