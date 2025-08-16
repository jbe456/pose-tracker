import { useRef, useEffect, useState } from "react";
import { DrawingUtils, PoseLandmarkerResult } from "@mediapipe/tasks-vision";
import { EDGES } from "./lib/edges";

interface VideoOverlayProps {
  ytUrl: string;
  poseLandmarker: any; // MediaPipe PoseLandmarker
}

const mirrorVideo = false;
const showLandmarks = true;
const showSkeleton = true;

function syncCanvasToVideo(canvas: HTMLCanvasElement, video: HTMLVideoElement) {
  if (!video.videoWidth || !video.videoHeight) return;
  const { videoWidth: w, videoHeight: h } = video;
  canvas.width = w;
  canvas.height = h;
}

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
      setStatus("Playing");
    })();
    return () => {
      if (objUrl && !revoked) {
        URL.revokeObjectURL(objUrl);
        revoked = true;
      }
    };
  }, [ytUrl]);

  // useEffect(() => {
  //   if (!ytUrl) return;
  //   (async () => {
  //     setStatus("Fetching video…");
  //     const resp = await fetch(
  //       `/api/videos/stream?url=${encodeURIComponent(ytUrl)}`
  //     );
  //     if (!resp.ok) return setStatus("Failed to load");
  //     const blob = await resp.blob();
  //     videoRef.current!.src = URL.createObjectURL(blob);
  //     await videoRef.current!.play();
  //     setStatus("Playing");
  //   })();
  // }, [ytUrl]);

  // useEffect(() => {
  //   let raf = 0;
  //   const ctx = canvasRef.current!.getContext("2d")!;
  //   const draw = new DrawingUtils(ctx);
  //   const loop = async () => {
  //     if (
  //       !videoRef.current ||
  //       videoRef.current.paused ||
  //       videoRef.current.ended
  //     )
  //       return;
  //     const result = await poseLandmarker.detectForVideo(
  //       videoRef.current,
  //       performance.now()
  //     );
  //     ctx.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);
  //     result.landmarks.forEach((lm: any) => draw.drawLandmarks(lm));
  //     raf = requestAnimationFrame(loop);
  //   };
  //   if (poseLandmarker) raf = requestAnimationFrame(loop);
  //   return () => cancelAnimationFrame(raf);
  // }, [poseLandmarker]);

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

  // return (
  //   <div className="relative">
  //     <video ref={videoRef} playsInline muted className="w-full" />
  //     <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
  //     <div className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
  //       {status}
  //     </div>
  //   </div>
  // );

  return (
    <div className="relative rounded-2xl overflow-hidden shadow-2xl">
      <video
        ref={videoRef}
        src={objUrl ?? undefined}
        className={`w-full ${mirrorVideo ? "scale-x-[-1]" : ""}`}
        playsInline
        autoPlay
        muted
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
