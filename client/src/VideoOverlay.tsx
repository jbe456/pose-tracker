import { useRef, useEffect, useState, useCallback } from "react";
import {
  DrawingUtils,
  NormalizedLandmark,
  PoseLandmarker,
} from "@mediapipe/tasks-vision";
import { EDGES } from "./lib/edges";

interface VideoOverlayProps {
  ytUrl: string;
  poseLandmarker: PoseLandmarker;
}

function syncCanvasToVideo(canvas: HTMLCanvasElement, video: HTMLVideoElement) {
  if (!video.videoWidth || !video.videoHeight) return;
  const { videoWidth: w, videoHeight: h } = video;
  canvas.width = w;
  canvas.height = h;
}

function clearCanvas(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

const drawResults = (
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  draw: DrawingUtils,
  landmarks: NormalizedLandmark[][],
  showSkeleton: boolean,
  showLandmarks: boolean
) => {
  landmarks.forEach((lm) => {
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
          ctx.lineWidth = 3;
          ctx.strokeStyle = "rgba(99,102,241,0.9)";
          ctx.stroke();
        }
      });
    }
    if (showLandmarks) {
      draw.drawLandmarks(
        lm.map((p) => ({
          x: p.x * canvas.width,
          y: p.y * canvas.height,
          z: 0,
          visibility: 1,
        })),
        { radius: 3 }
      );
    }
  });
};

export default function VideoOverlay({
  ytUrl,
  poseLandmarker,
}: VideoOverlayProps) {
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
      setStatus("Ready");
    })();
    return () => {
      if (objUrl && !revoked) {
        URL.revokeObjectURL(objUrl);
        revoked = true;
      }
    };
  }, [ytUrl]);

  // Start detection loop
  useEffect(() => {
    let raf = 0;
    const video = videoRef.current!;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const draw = new DrawingUtils(ctx);

    const loop = async () => {
      if (video && (video.paused || video.ended)) {
      } else {
        clearCanvas(ctx, canvas);
        if (video) {
          syncCanvasToVideo(canvas, video);
          const nowMs = performance.now();
          const result = await poseLandmarker.detectForVideo(video, nowMs);
          if (result.landmarks) {
            drawResults(ctx, canvas, draw, result.landmarks, true, true);
          }
        }
      }

      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(raf);
  }, []);

  // Toggle handler
  const togglePlayback = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      void v.play(); // avoid unhandled promise
    } else {
      v.pause();
    }
  }, []);

  return (
    <div className="flex-1 relative rounded-2xl overflow-hidden shadow-2xl">
      <video
        ref={videoRef}
        src={objUrl ?? undefined}
        onPlay={() => setStatus("Playing")}
        onPause={() => setStatus("Paused")}
        onClick={togglePlayback}
        playsInline
        autoPlay
        muted
        loop
      />
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none"
      ></canvas>
      <div className="absolute top-3 left-3 text-xs bg-black/60 px-2 py-1 rounded">
        {status}
      </div>
    </div>
  );
}
