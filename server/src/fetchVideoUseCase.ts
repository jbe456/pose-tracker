import { z } from "zod";
import type { Response } from "express";
import { YtdlVideoStreamAdapter } from "./youtubeAdapter.js";

const UrlSchema = z.string().url();

export class FetchVideoStreamUseCase {
  constructor(private adapter: YtdlVideoStreamAdapter) {}

  async execute(url: string, res: Response) {
    const parsed = UrlSchema.safeParse(url);
    if (!parsed.success) return res.status(400).json({ error: "Invalid URL" });
    try {
      await this.adapter.stream(parsed.data, res);
    } catch (e) {
      if (!res.headersSent)
        res.status(500).json({ error: (e as Error).message });
    }
  }
}
