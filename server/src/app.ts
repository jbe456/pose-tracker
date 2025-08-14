import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { YtdlVideoStreamAdapter } from "./adapters/youtube/YtdlVideoStreamAdapter.js";
import { FetchVideoStreamUseCase } from "./application/usecases/FetchVideoStreamUseCase.js";
import { VideoController } from "./interfaces/http/VideoController.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  // Wiring (composition root)
  const adapter = new YtdlVideoStreamAdapter();
  const usecase = new FetchVideoStreamUseCase(adapter);
  const controller = new VideoController(usecase);

  app.get("/api/videos/stream", controller.streamFromUrl);

  // Serve client build (when built)
  const clientDist = path.resolve(__dirname, "../../client/dist");
  app.use(express.static(clientDist));
  app.get("*", (_, res) => res.sendFile(path.join(clientDist, "index.html")));

  return app;
}
