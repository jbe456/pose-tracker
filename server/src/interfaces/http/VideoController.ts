import type { Request, Response } from "express";
import { FetchVideoStreamUseCase } from "../../application/usecases/FetchVideoStreamUseCase.js";

export class VideoController {
  constructor(private readonly fetchStream: FetchVideoStreamUseCase) {}

  streamFromUrl = async (req: Request, res: Response) => {
    const url = String(req.query.url || "");
    const result = await this.fetchStream.execute(url, res);
    if (!result.ok && !res.headersSent) {
      res.status(400).json({ error: result.error });
    }
  };
}
