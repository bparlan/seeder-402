const net = require("net");
const fs = require("fs");
const CONTROL_SOCKET = process.env.CONTROL_SOCKET || "/data/ctrl/peer.sock";

const server = net.createServer((socket) => {
  console.log("peer control socket: client connected");
  socket.on("error", (err) =>
    console.error("peer control socket error:", err.message),
  );
  socket.on("end", () =>
    console.log("peer control socket: client disconnected"),
  );
});

if (fs.existsSync(CONTROL_SOCKET)) {
  fs.unlinkSync(CONTROL_SOCKET);
}

server.on("error", (err) => {
  console.error("peer control socket server error:", err.message);
});

server.listen(CONTROL_SOCKET, () => {
  console.log(`peer control socket listening on ${CONTROL_SOCKET}`);
});

setInterval(() => {
  console.log("peer stub alive");
}, 30000);
