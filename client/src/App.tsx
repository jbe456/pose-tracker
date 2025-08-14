import { useState, useEffect } from "react";
import { FilesetResolver, PoseLandmarker } from "@mediapipe/tasks-vision";
import VideoOverlay from "./VideoOverlay";

export default function App() {
  const [ytUrl, setYtUrl] = useState("");
  const [poseLandmarker, setPoseLandmarker] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const filesetResolver = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.11/wasm"
      );
      const lm = await PoseLandmarker.createFromOptions(filesetResolver, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/latest/pose_landmarker_full.task",
        },
        runningMode: "VIDEO",
        numPoses: 2,
      });
      setPoseLandmarker(lm);
    })();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">YouTube Pose Tracker</h1>
      <input
        type="url"
        placeholder="YouTube URL"
        value={ytUrl}
        onChange={(e) => setYtUrl(e.target.value)}
        className="w-full p-2 mb-4 rounded bg-slate-900 border border-slate-700"
      />
      {poseLandmarker && (
        <VideoOverlay ytUrl={ytUrl} poseLandmarker={poseLandmarker} />
      )}
    </div>
  );
}
