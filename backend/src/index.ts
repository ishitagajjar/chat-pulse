import http from "http";
import { Server } from "socket.io";
import app from "./app";
import { config } from "./config";
import { initializeSocket } from "./socket";

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: config.frontendUrl,
    credentials: true,
  },
});

initializeSocket(io);

server.listen(config.port, () => {
  console.log(`ChatPulse server running on port ${config.port}`);
});
