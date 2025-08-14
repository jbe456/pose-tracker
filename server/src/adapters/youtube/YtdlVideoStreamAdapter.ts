import ytdl from "ytdl-core";
import type { Response } from "express";
import type { VideoStreamPort } from "../../domain/ports/VideoStreamPort.js";

export class YtdlVideoStreamAdapter implements VideoStreamPort {
  async stream(url: string, res: Response): Promise<void> {
    if (!ytdl.validateURL(url)) {
      throw new Error("Invalid YouTube URL");
    }

    const info = await ytdl.getInfo(url);
    const formats = ytdl.filterFormats(info.formats, "audioandvideo");
    const mp4Muxed = formats
      .filter((f) => f.container === "mp4")
      .sort((a, b) => (a.itag || 0) - (b.itag || 0));

    const chosen = mp4Muxed[0] || formats[0];
    if (!chosen) throw new Error("No playable muxed format found");

    res.setHeader("Content-Type", chosen.mimeType || "video/mp4");
    res.setHeader("Transfer-Encoding", "chunked");

    const stream = ytdl(url, { quality: chosen.itag, filter: "audioandvideo" });
    stream.on("error", (err) => {
      if (!res.headersSent) res.status(500);
      res.end("Stream error");
    });
    stream.pipe(res);
  }
}
