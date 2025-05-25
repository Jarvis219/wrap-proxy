// proxy.js
import { createServer } from "socks5"; // Note the different import

const server = new createServer({
  port: 1080,
  address: "0.0.0.0",
  authentication: (username, password, callback) => {
    callback(username === "your_username" && password === "your_password");
  },
});

server.listen((err) => {
  if (err) {
    console.error(`Server error: ${err.message}`);
    return;
  }
  console.log("SOCKS5 Proxy running on port 1080");
});

server.on("connection", (socket) => {
  console.log(
    `New connection from ${socket.remoteAddress}:${socket.remotePort}`
  );
});
