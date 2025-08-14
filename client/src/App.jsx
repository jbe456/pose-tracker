import { useEffect, useMemo, useState } from "react";
import { createPoseLandmarker } from "./lib/poseLandmarker";
import VideoOverlay from "./components/VideoOverlay";
import { isNonEmptyUrl } from "./utils/url";

export default function App() {
  const [ytUrl, setYtUrl] = useState("");
  const [lmReady, setLmReady] = useState(false);
  const [showLandmarks, setShowLandmarks] = useState(true);
  const [showSkeleton, setShowSkeleton] = useState(true);
  const [mirrorVideo, setMirrorVideo] = useState(false);

  const [poseLandmarker, setPoseLandmarker] = useState < any > null;

  useEffect(() => {
    (async () => {
      const lm = await createPoseLandmarker();
      setPoseLandmarker(lm);
      setLmReady(true);
    })();
  }, []);

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">YouTube Pose Tracker</h1>
      <div className="grid gap-3 md:grid-cols-[1fr_auto] items-end mb-4">
        <input
          type="url"
          value={ytUrl}
          onChange={(e) => setYtUrl(e.target.value)}
          placeholder="https://www.youtube.com/watch?v=..."
          className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 focus:outline-none"
        />
        <span className="text-sm text-slate-400">
          {lmReady ? "Model ready" : "Loading model…"}
        </span>
      </div>
      <div className="mb-4 flex flex-wrap gap-4 text-sm">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={showLandmarks}
            onChange={(e) => setShowLandmarks(e.target.checked)}
          />{" "}
          Show landmarks
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={showSkeleton}
            onChange={(e) => setShowSkeleton(e.target.checked)}
          />{" "}
          Show skeleton
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={mirrorVideo}
            onChange={(e) => setMirrorVideo(e.target.checked)}
          />{" "}
          Mirror video
        </label>
      </div>

      {poseLandmarker && (
        <VideoOverlay
          ytUrl={isNonEmptyUrl(ytUrl) ? ytUrl : ""}
          poseLandmarker={poseLandmarker}
          showLandmarks={showLandmarks}
          showSkeleton={showSkeleton}
          mirrorVideo={mirrorVideo}
        />
      )}
    </div>
  );
}
