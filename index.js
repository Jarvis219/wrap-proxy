import net from "net";

// Tạo SOCKS5 proxy server
const server = net.createServer((clientSocket) => {
  console.log("Client connected");

  // Tạo kết nối đến Telegram MTProto (api.telegram.org:443)
  const telegramSocket = net.connect({
    host: "api.telegram.org",
    port: 443,
  });

  // Pipe dữ liệu giữa client và Telegram
  clientSocket.pipe(telegramSocket);
  telegramSocket.pipe(clientSocket);

  clientSocket.on("end", () => {
    console.log("Client disconnected");
    telegramSocket.end();
  });
});

server.listen(1080, () => {
  console.log("SOCKS5 Proxy Server running on port 1080");
});
