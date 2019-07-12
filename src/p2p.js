const WebSockets = require("ws");

const sockets = [];

const getSockets = () => sockets;

const startP2PServer = server => {
  const wsServer = new WebSockets.Server({ server });
  wsServer.on("connection", ws => {
    initSocketConnection(ws);
    console.log('connection 이벤트 발생. initSocketConnection 실행됨.');
// 포트 3000에게 포트 4000으로 연결하라는 포스트를 보낼 경우,
// 위 로그가 포트 4000에만 표시된다.
// 그런데 어째서 같은 선상의 함수 initSocketConnection이 가지고 있는 로그 welcome은
// 양쪽 포트의 터미널 모두에 표시되는 걸까? - 문제 (1 of 1)

  });
  console.log("Nomadcoin P2P Server running");
};

const initSocketConnection = socket => {
  sockets.push(socket);
  socket.on("message", data => {
    console.log(data);
  });
  setTimeout(() => {
    socket.send("welcome");
  }, 5000);
};

const connectToPeers = newPeer => {
  const ws = new WebSockets(newPeer);
  ws.on("open", () => {
    initSocketConnection(ws);
  });
};

module.exports = {
  startP2PServer,
  connectToPeers
};
