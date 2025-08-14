import ytdl from "ytdl-core";
import type { Response } from "express";

export class YtdlVideoStreamAdapter {
  async stream(url: string, res: Response) {
    if (!ytdl.validateURL(url)) throw new Error("Invalid YouTube URL");
    const info = await ytdl.getInfo(url);
    const formats = ytdl.filterFormats(info.formats, "audioandvideo");
    const chosen = formats.find((f) => f.container === "mp4") || formats[0];
    if (!chosen) throw new Error("No playable format found");

    res.setHeader("Content-Type", chosen.mimeType || "video/mp4");
    res.setHeader("Transfer-Encoding", "chunked");

    ytdl(url, { quality: chosen.itag, filter: "audioandvideo" }).pipe(res);
  }
}
