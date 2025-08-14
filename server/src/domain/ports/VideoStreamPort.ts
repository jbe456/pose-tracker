import type { Response } from "express";

export interface VideoStreamPort {
  /** Stream a muxed (audio+video) video for a given URL to the Express response. */
  stream(url: string, res: Response): Promise<void>;
}
