import { useState, useEffect } from "react";
import { createPoseLandmarker } from "./lib/poseLandmarker";
import VideoOverlay from "./VideoOverlay";

export default function App() {
  const [ytUrl, setYtUrl] = useState("");
  const [poseLandmarker, setPoseLandmarker] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const lm = await createPoseLandmarker();
      setPoseLandmarker(lm);
    })();
  }, []);

  return (
    <div className="flex flex-col h-screen p-6">
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
