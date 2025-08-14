import { z } from "zod";
import type { Response } from "express";
import type { VideoStreamPort } from "../../domain/ports/VideoStreamPort.js";

const UrlSchema = z.string().url();

export class FetchVideoStreamUseCase {
  constructor(private readonly streamPort: VideoStreamPort) {}

  async execute(
    url: string,
    res: Response
  ): Promise<{ ok: true } | { ok: false; error: string }> {
    const parsed = UrlSchema.safeParse(url);
    if (!parsed.success) {
      return { ok: false, error: "Invalid URL" };
    }
    try {
      await this.streamPort.stream(parsed.data, res);
      return { ok: true };
    } catch (e) {
      return { ok: false, error: (e as Error).message || "Stream failed" };
    }
  }
}
