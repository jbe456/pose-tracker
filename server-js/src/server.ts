import { createServer } from "node:http";
import express from "express";
import cors from "cors";
import { FetchVideoStreamUseCase } from "./fetchVideoUseCase";

function createApp() {
  const app = express();
  app.use(cors());

  const fetchVideoStreamUsecase = new FetchVideoStreamUseCase();

  app.get("/api/videos/stream", (req, res) => {
    const url = String(req.query.url || "");
    fetchVideoStreamUsecase.execute(url, res);
  });

  return app;
}

const SERVER_JS_PORT = Number(process.env.SERVER_JS_PORT) || 3000;
const app = createApp();

createServer(app).listen(SERVER_JS_PORT, () => {
  console.log(`JS Server running at http://localhost:${SERVER_JS_PORT}`);
});
