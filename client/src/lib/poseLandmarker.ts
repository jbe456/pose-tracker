import {
  FilesetResolver,
  PoseLandmarker,
  type PoseLandmarker as PoseLMType,
} from "@mediapipe/tasks-vision";

export async function createPoseLandmarker(): Promise<PoseLMType> {
  const filesetResolver = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.11/wasm"
  );
  return PoseLandmarker.createFromOptions(filesetResolver, {
    baseOptions: {
      modelAssetPath:
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.11/wasm/pose_landmarker_full.task",
    },
    runningMode: "VIDEO",
    numPoses: 2,
    minPoseDetectionConfidence: 0.5,
    minPosePresenceConfidence: 0.5,
    minTrackingConfidence: 0.5,
  });
}
