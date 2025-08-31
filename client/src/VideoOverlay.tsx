import { useRef, useEffect, useState, useCallback } from "react";
import { NormalizedLandmark, PoseLandmarker } from "@mediapipe/tasks-vision";
import { EDGES, LANDMARKS } from "./lib/poseTopology";
import { assignTracks, Track } from "./lib/poseTracker";

const PERSON_COLORS = [
  "rgba(99,102,241,0.9)", // indigo
  "rgba(16,185,129,0.9)", // emerald
];

interface VideoOverlayProps {
  ytUrl: string;
  poseLandmarker: PoseLandmarker;
}

type DrawingOptions = {
  color: string;
  showSkeleton: boolean;
  showLandmarks: boolean;
};

type DrawingContext = {
  width: number;
  height: number;
};

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
  lm: NormalizedLandmark[],
  drawingContext: DrawingContext,
  drawingOptions: DrawingOptions
) => {
  if (drawingOptions.showSkeleton) {
    EDGES.forEach(([a, b]) => {
      const pa = lm[a];
      const pb = lm[b];
      if (pa && pb) {
        ctx.beginPath();
        ctx.moveTo(pa.x * drawingContext.width, pa.y * drawingContext.height);
        ctx.lineTo(pb.x * drawingContext.width, pb.y * drawingContext.height);
        ctx.lineWidth = 3;
        ctx.strokeStyle = drawingOptions.color;
        ctx.stroke();
      }
    });
  }

  if (drawingOptions.showLandmarks) {
    ctx.fillStyle = drawingOptions.color;

    LANDMARKS.forEach((a) => {
      const p = lm[a];
      ctx.beginPath();
      ctx.arc(
        p.x * drawingContext.width,
        p.y * drawingContext.height,
        3,
        0,
        Math.PI * 2
      );
      ctx.fill();
    });
  }
};

export default function VideoOverlay({
  ytUrl,
  poseLandmarker,
}: VideoOverlayProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState("Idle");
  const [objUrl, setObjUrl] = useState<string | null>(null);

  // Prsistent tracks (0 and 1)
  const tracksRef = useRef<Track[]>([
    { id: 0, lm: null, anchor: null, lastSeenT: 0, active: false },
    { id: 1, lm: null, anchor: null, lastSeenT: 0, active: false },
  ]);

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

    const loop = async () => {
      if (video && (video.paused || video.ended)) {
      } else {
        clearCanvas(ctx, canvas);
        if (video) {
          syncCanvasToVideo(canvas, video);
          const nowMs = performance.now();
          const result = await poseLandmarker.detectForVideo(video, nowMs);
          const landmarks = result.landmarks;

          if (landmarks) {
            const tracks = tracksRef.current;
            const assignedLandmarks = assignTracks(landmarks, tracks, nowMs, {
              distanceGate: 0.3,
              maxMissedMs: 1000,
            });

            assignedLandmarks.forEach((landmarkData) => {
              drawResults(
                ctx,
                landmarkData.lm,
                { height: canvas.height, width: canvas.width },
                {
                  color: PERSON_COLORS[landmarkData.id % PERSON_COLORS.length],
                  showLandmarks: true,
                  showSkeleton: true,
                }
              );
            });
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
