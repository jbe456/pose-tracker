import { FilesetResolver, PoseLandmarker } from "@mediapipe/tasks-vision";

const POSE_LANDMARKER_ROOT_URL = `https://storage.googleapis.com/mediapipe-models/pose_landmarker`;
const POSE_LANDMARKER_MODEL_LITE = `${POSE_LANDMARKER_ROOT_URL}/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task`;
const POSE_LANDMARKER_MODEL_FULL = `${POSE_LANDMARKER_ROOT_URL}/pose_landmarker_full/float16/latest/pose_landmarker_full.task`;
const POSE_LANDMARKER_MODEL_HEAVY = `${POSE_LANDMARKER_ROOT_URL}/pose_landmarker_heavy/float16/latest/pose_landmarker_heavy.task`;

async function createPoseLandmarker(): Promise<PoseLandmarker> {
  const filesetResolver = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.11/wasm"
  );
  return PoseLandmarker.createFromOptions(filesetResolver, {
    baseOptions: {
      modelAssetPath: POSE_LANDMARKER_MODEL_LITE,
      delegate: "GPU",
    },
    runningMode: "VIDEO",
    numPoses: 2,
    minPoseDetectionConfidence: 0.3,
    minPosePresenceConfidence: 0.5,
    minTrackingConfidence: 0.5,
  });
}

let poseLandmarkerPromise: Promise<PoseLandmarker> | undefined;
export function getPoseLandmarker() {
  if (!poseLandmarkerPromise) {
    poseLandmarkerPromise = createPoseLandmarker();
  }
  return poseLandmarkerPromise;
}
