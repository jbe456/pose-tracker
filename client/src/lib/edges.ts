// BlazePose-like topology (selected subset)
export const EDGES: Array<[number, number]> = [
  [11, 13],
  [13, 15], // left arm
  [12, 14],
  [14, 16], // right arm
  [11, 12], // shoulders
  [23, 24], // hips
  [11, 23],
  [12, 24], // torso
  [23, 25],
  [25, 27],
  [27, 29],
  [29, 31], // left leg
  [24, 26],
  [26, 28],
  [28, 30],
  [30, 32], // right leg
];
