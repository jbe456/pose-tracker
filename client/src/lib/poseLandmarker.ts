import {
  FilesetResolver,
  PoseLandmarker,
  type PoseLandmarker as PoseLMType,
} from "@mediapipe/tasks-vision";

const POSE_LANDMARKER_MODEL_FULL =
  "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/latest/pose_landmarker_full.task";
const POSE_LANDMARKER_MODEL_HEAVY =
  "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_heavy/float16/latest/pose_landmarker_heavy.task";

export async function createPoseLandmarker(): Promise<PoseLMType> {
  const filesetResolver = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.11/wasm"
  );
  return PoseLandmarker.createFromOptions(filesetResolver, {
    baseOptions: {
      modelAssetPath: POSE_LANDMARKER_MODEL_FULL,
    },
    runningMode: "VIDEO",
    numPoses: 2,
    minPoseDetectionConfidence: 0.5,
    minPosePresenceConfidence: 0.5,
    minTrackingConfidence: 0.5,
  });
}
