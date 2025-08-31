// BlazePose-like topology (selected subset)
export const EDGES: Array<[number, number]> = [
  // left arm
  [11, 13], // shoulder → elbow
  [13, 15], // elbow → wrist

  // right arm
  [12, 14], // shoulder → elbow
  [14, 16], // elbow → wrist

  // shoulders (across the chest)
  [11, 12],

  // hips (across the pelvis)
  [23, 24],

  // torso vertical connections
  [11, 23], // left shoulder → left hip
  [12, 24], // right shoulder → right hip

  // left leg
  [23, 25], // hip → knee
  [25, 27], // knee → ankle
  [27, 29], // ankle → heel
  [29, 31], // heel → toe

  // right leg
  [24, 26], // hip → knee
  [26, 28], // knee → ankle
  [28, 30], // ankle → heel
  [30, 32], // heel → toe
];

export const LANDMARKS = [
  11, // left shoulder
  12, // right shoulder
  13, // left elbow
  14, // right elbow
  15, // left wrist
  16, // right wrist

  23, // left hip
  24, // right hip
  25, // left knee
  26, // right knee
  27, // left ankle
  28, // right ankle
  29, // left heel
  30, // right heel
  31, // left foot index (toe)
  32, // right foot index (toe)
];
