import ytdl from "ytdl-core";
import { z } from "zod";
import type { Response } from "express";

const UrlSchema = z.string().url();

export class FetchVideoStreamUseCase {
  async execute(url: string, res: Response) {
    try {
      const parsed = UrlSchema.safeParse(url);
      if (!parsed.success) throw new Error("Invalid URL");

      const safeUrl = parsed.data;
      if (!ytdl.validateURL(safeUrl)) throw new Error("Invalid YouTube URL");

      const info = await ytdl.getInfo(safeUrl);
      const formats = ytdl.filterFormats(info.formats, "audioandvideo");
      const chosen = formats.find((f) => f.container === "mp4") || formats[0];
      if (!chosen) throw new Error("No playable format found");

      res.setHeader("Content-Type", chosen.mimeType || "video/mp4");
      res.setHeader("Transfer-Encoding", "chunked");

      ytdl(safeUrl, { quality: chosen.itag, filter: "audioandvideo" }).pipe(
        res
      );
    } catch (e) {
      if (!res.headersSent)
        res.status(500).json({ error: (e as Error).message });
    }
  }
}
