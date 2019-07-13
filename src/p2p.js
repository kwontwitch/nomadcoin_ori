const WebSockets = require("ws");

const sockets = [];

const getSockets = () => sockets;

const startP2PServer = server => {
  const wsServer = new WebSockets.Server({ server });
  wsServer.on("connection", ws => {
    initSocketConnection(ws);
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
  // 포트 3000에 포트 4000으로 연결하라는 포스트를 보내면
  // newPeer는 ws://localhost:4000이라는 값을 할당받는다.
  const ws = new WebSockets(newPeer);
  // 포트 4000에 해당하는 정보로 웹소켓이 생성된다.
  // !! 주의할점은 위 ws의 주체는 포트 3000이다.
  // !! 이는 포트 3000에게 포트 4000으로 연결하라는 포스트를 보냈을 때,
  // !! open 이벤트(아래 ws.on의 이벤트)가 포트 3000에만 일어나는 걸 통해 알 수 있다. (로그로 확인.)
  // !! 웹소켓이 포트 4000에 대한 정보를 받아 만들어 졌지만
  // !! ws가 3000을 토대로 만들어 졌음을 짐작할 수 있다.
  ws.on("open", () => {
    console.log('open 이벤트는 언제 발생될까요오 ~?');
    initSocketConnection(ws);
  });
};

module.exports = {
  startP2PServer,
  connectToPeers
};
