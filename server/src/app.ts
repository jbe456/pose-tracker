import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { YtdlVideoStreamAdapter } from "./youtubeAdapter";
import { FetchVideoStreamUseCase } from "./fetchVideoUseCase";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function createApp() {
  const app = express();
  app.use(cors());

  const adapter = new YtdlVideoStreamAdapter();
  const usecase = new FetchVideoStreamUseCase(adapter);

  app.get("/api/videos/stream", (req, res) => {
    const url = String(req.query.url || "");
    usecase.execute(url, res);
  });

  const clientDist = path.resolve(__dirname, "../../client/dist");
  app.use(express.static(clientDist));
  app.get("*", (_, res) => res.sendFile(path.join(clientDist, "index.html")));

  return app;
}
