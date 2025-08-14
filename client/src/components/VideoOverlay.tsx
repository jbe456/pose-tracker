import { useEffect, useRef, useState } from "react";
import {
  DrawingUtils,
  type PoseLandmarkerResult,
} from "@mediapipe/tasks-vision";
import { syncCanvasToVideo } from "../utils/canvas";
import { EDGES } from "../lib/edges";

interface Props {
  ytUrl: string;
  poseLandmarker: any; // MediaPipe PoseLandmarker
  showLandmarks: boolean;
  showSkeleton: boolean;
  mirrorVideo: boolean;
}

export default function VideoOverlay({
  ytUrl,
  poseLandmarker,
  showLandmarks,
  showSkeleton,
  mirrorVideo,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState("Idle");
  const [objUrl, setObjUrl] = useState<string | null>(null);

  // Load / stream the YouTube video via backend
  useEffect(() => {
    let revoked = false;
    (async () => {
      if (!ytUrl) return;
      setStatus("Fetching video…");
      const resp = await fetch(
        `/api/videos/stream?url=${encodeURIComponent(ytUrl)}`
      );
      if (!resp.ok) {
        setStatus("Failed to load");
        return;
      }
      const blob = await resp.blob();
      const u = URL.createObjectURL(blob);
      setObjUrl(u);
      setStatus("Playing");
    })();
    return () => {
      if (objUrl && !revoked) {
        URL.revokeObjectURL(objUrl);
        revoked = true;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ytUrl]);

  // Start detection loop
  useEffect(() => {
    let raf = 0;
    const video = videoRef.current!;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const draw = new DrawingUtils(ctx);

    const drawResults = (result: PoseLandmarkerResult) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (!result.landmarks) return;

      if (mirrorVideo) {
        ctx.save();
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }

      result.landmarks.forEach((lm) => {
        if (showSkeleton) {
          EDGES.forEach(([a, b]) => {
            const pa = lm[a];
            const pb = lm[b];
            if (
              pa &&
              pb &&
              (pa.visibility ?? 1) > 0.5 &&
              (pb.visibility ?? 1) > 0.5
            ) {
              ctx.beginPath();
              ctx.moveTo(pa.x * canvas.width, pa.y * canvas.height);
              ctx.lineTo(pb.x * canvas.width, pb.y * canvas.height);
              ctx.lineWidth = 4;
              ctx.strokeStyle = "rgba(99,102,241,0.9)";
              ctx.stroke();
            }
          });
        }
        if (showLandmarks) {
          draw.drawLandmarks(
            lm.map((p) => ({ x: p.x * canvas.width, y: p.y * canvas.height })),
            { radius: 3 }
          );
        }
      });

      if (mirrorVideo) ctx.restore();
    };

    const loop = async () => {
      if (!video || video.paused || video.ended) return;
      syncCanvasToVideo(canvas, video);
      const nowMs = performance.now();
      const result = await poseLandmarker.detectForVideo(video, nowMs);
      drawResults(result);
      raf = requestAnimationFrame(loop);
    };

    if (poseLandmarker && video) {
      raf = requestAnimationFrame(loop);
    }
    return () => cancelAnimationFrame(raf);
  }, [poseLandmarker, showLandmarks, showSkeleton, mirrorVideo]);

  return (
    <div className="relative rounded-2xl overflow-hidden shadow-2xl">
      <video
        ref={videoRef}
        src={objUrl ?? undefined}
        className={`w-full ${mirrorVideo ? "scale-x-[-1]" : ""}`}
        playsInline
        muted
        autoPlay
      />
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
      ></canvas>
      <div className="absolute top-3 left-3 text-xs bg-black/60 px-2 py-1 rounded">
        {status}
      </div>
    </div>
  );
}
