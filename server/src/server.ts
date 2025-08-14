import { createServer } from "node:http";
import { createApp } from "./app.js";

const PORT = Number(process.env.PORT) || 3000;
const app = createApp();

createServer(app).listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
