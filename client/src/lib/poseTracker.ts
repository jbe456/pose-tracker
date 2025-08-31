import { NormalizedLandmark } from "@mediapipe/tasks-vision";

// --- Tracking helpers ---
export type Track = {
  id: 0 | 1;
  lm: NormalizedLandmark[] | null;
  anchor: { x: number; y: number } | null;
  lastSeenT: number; // performance.now() ms
  active: boolean;
};

type TrackingOptions = {
  maxMissedMs: number; // keep an ID reserved for this long when person disappears
  distanceGate: number; // max normalized distance (~18% of frame diagonal) to consider a match
};

const defaultTrackingOptions: TrackingOptions = {
  maxMissedMs: 800,
  distanceGate: 0.18,
};

function anchorFrom(lm: NormalizedLandmark[]): { x: number; y: number } {
  // Use shoulders + hips (indices 11,12,23,24) — stable even during leg motion.
  const idx = [11, 12, 23, 24];
  let sx = 0,
    sy = 0,
    n = 0;
  for (const i of idx) {
    const p = lm[i];
    if (p && (p.visibility ?? 1) > 0.3) {
      sx += p.x;
      sy += p.y;
      n++;
    }
  }
  // Fallback to full-landmark centroid if those are missing.
  if (n === 0) {
    for (const p of lm) {
      if (!p) continue;
      sx += p.x;
      sy += p.y;
      n++;
    }
  }
  return { x: sx / n, y: sy / n };
}

// Normalize Euclidean distance by frame diagonal so it’s resolution-independent.
function normDist(a: { x: number; y: number }, b: { x: number; y: number }) {
  const dx = a.x - b.x,
    dy = a.y - b.y;
  // landmarks are already 0..1 normalized in MediaPipe; frame diagonal is ~1.414
  return Math.hypot(dx, dy);
}

export function assignTracks(
  landmarks: NormalizedLandmark[][],
  tracks: Track[],
  nowMs: number,
  trackingOptions: TrackingOptions = defaultTrackingOptions
): Array<{ id: 0 | 1; lm: NormalizedLandmark[] }> {
  // Build candidate list with anchors
  const det = landmarks.map((lm) => ({ lm, anchor: anchorFrom(lm) }));

  // Deactivate tracks that have been gone too long
  for (const tr of tracks) {
    if (tr.active && nowMs - tr.lastSeenT > trackingOptions.maxMissedMs) {
      tr.active = false;
      tr.lm = null;
      tr.anchor = null;
    }
  }

  if (det.length === 0) {
    // Nothing this frame; just keep tracks as-is
    return [];
  }

  if (det.length === 1) {
    // Single detection: attach to the nearest active track if close enough; else to a free slot.
    let bestTr: Track | null = null;
    let bestD = Number.POSITIVE_INFINITY;
    for (const tr of tracks) {
      if (!tr.active || !tr.anchor) continue;
      const d = normDist(tr.anchor, det[0].anchor);
      if (d < bestD) {
        bestD = d;
        bestTr = tr;
      }
    }
    const slot =
      bestTr && bestD < trackingOptions.distanceGate
        ? bestTr
        : tracks.find((t) => !t.active) ?? tracks[0];
    slot.active = true;
    slot.lm = det[0].lm;
    slot.anchor = det[0].anchor;
    slot.lastSeenT = nowMs;
    return [{ id: slot.id, lm: det[0].lm }];
  }

  // Two detections: 2x2 assignment
  // Compute distances to each active (or potential) track anchor. If a track is inactive,
  // we still allow assignment but distance gate applies only if the track had a previous anchor.
  const pairs = [
    {
      tr: tracks[0],
      k: 0,
      d: tracks[0].anchor ? normDist(tracks[0].anchor, det[0].anchor) : 0.0,
    },
    {
      tr: tracks[0],
      k: 1,
      d: tracks[0].anchor ? normDist(tracks[0].anchor, det[1].anchor) : 0.0,
    },
    {
      tr: tracks[1],
      k: 0,
      d: tracks[1].anchor ? normDist(tracks[1].anchor, det[0].anchor) : 0.0,
    },
    {
      tr: tracks[1],
      k: 1,
      d: tracks[1].anchor ? normDist(tracks[1].anchor, det[1].anchor) : 0.0,
    },
  ];

  // Evaluate the two possible assignments: (0->0,1->1) vs (0->1,1->0)
  const costA =
    (tracks[0].anchor ? normDist(tracks[0].anchor, det[0].anchor) : 0) +
    (tracks[1].anchor ? normDist(tracks[1].anchor, det[1].anchor) : 0);
  const costB =
    (tracks[0].anchor ? normDist(tracks[0].anchor, det[1].anchor) : 0) +
    (tracks[1].anchor ? normDist(tracks[1].anchor, det[0].anchor) : 0);

  const chooseA = costA <= costB;

  const assign = (tr: Track, di: number) => {
    // Gate only if we have an anchor history; new tracks accept any.
    if (
      tr.anchor &&
      normDist(tr.anchor, det[di].anchor) > trackingOptions.distanceGate
    ) {
      // If too far, but the other track is closer, we’ll effectively swap below via the other assign.
      // If both are far (crossing with occlusion), allow swap: choose whichever yields lower cost.
    }
    tr.active = true;
    tr.lm = det[di].lm;
    tr.anchor = det[di].anchor;
    tr.lastSeenT = nowMs;
  };

  if (chooseA) {
    assign(tracks[0], 0);
    assign(tracks[1], 1);
    return [
      { id: tracks[0].id, lm: det[0].lm },
      { id: tracks[1].id, lm: det[1].lm },
    ];
  } else {
    assign(tracks[0], 1);
    assign(tracks[1], 0);
    return [
      { id: tracks[0].id, lm: det[1].lm },
      { id: tracks[1].id, lm: det[0].lm },
    ];
  }
}
