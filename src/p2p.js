const WebSockets = require("ws"),
  Blockchain = require("./blockchain");

const {
  getNewestBlock,
  isBlockStructureValid,
  replaceChain,
  getBlockchain,
  addBlockToChain
} = Blockchain;

const sockets = [];

// Messages Types
const GET_LATEST = "GET_LATEST";
const GET_ALL = "GET_ALL";
const BLOCKCHAIN_RESPONSE = "BLOCKCHAIN_RESPONSE";

// Message Creators
const getLatest = () => {
  return {
    type: GET_LATEST,
    data: null
  };
};

const getAll = () => {
  return {
    type: GET_ALL,
    data: null
  };
};

const blockchainResponse = data => {
  return {
    type: BLOCKCHAIN_RESPONSE,
    data
  };
};

const getSockets = () => sockets;

const startP2PServer = server => {
  // 포트 3000, 4000 모두 각자 startP2PServer 함수 실행
  const wsServer = new WebSockets.Server({ server });
  
  // 포트 3000, 4000 모두 connection 이벤트가 등록된다.
  // 다만 발생은 연결되는 대상인 포트 4000만이 connection 이벤트 발생.
  wsServer.on("connection", ws => {
    initSocketConnection(ws);
  // 여기서 wsServer는 본인의 소켓, ws는 상대방의 소켓인듯?
  });
  console.log("Nomadcoin P2P Server running");
};

const initSocketConnection = ws => {
  sockets.push(ws);
  // sockets의 배열 길이를 확인해보면 포트 3000, 4000 모두 1이다.
  // 2라면, socket은 나와 상대방이겠지만
  // 1이면, socket은 나와 상대방의 연결점을 뜻한다.
  handleSocketMessages(ws);
  handleSocketError(ws);
  sendMessage(ws, getLatest());
  // 단순히 상대방의 최신 블록을 터미널 콘솔로 나타내는게 아니라
  // 자신의 최신 블록으로 저장까지 한다.
};

const parseData = data => {
  try {
    return JSON.parse(data);
  } catch (e) {
    console.log(e);
    return null;
  }
};

const handleSocketMessages = ws => {
// 다른 포트에서 전해온 메시지를 처리한다.
  ws.on("message", data => {
    const message = parseData(data);
    if (message === null) {
      return;
// init에서 handleSocketMessages(ws)가 아마 여기서 끝날 것이다.
// 메시지 이벤트를 등록만 하고 끝나는 것이다.
    }
    console.log(message);
    switch (message.type) {
      case GET_LATEST:
        sendMessage(ws, responseLatest());
        break;
      case GET_ALL:
        sendMessage(ws, responseAll());
        break;
// 나의 블록 또는 체인 정보를 읽어와서 상대 포트로 *쏜다*.
// const responseLatest = () => blockchainResponse([getNewestBlock()]);
// const responseAll    = () => blockchainResponse(getBlockchain());
// const sendMessage = (ws, message) => ws.send(JSON.stringify(message));

// 메시지를 *받는다*. 그리고 저장한다.
      case BLOCKCHAIN_RESPONSE:
        const receivedBlocks = message.data;
        if (receivedBlocks === null) {
          break;
        }
        handleBlockchainResponse(receivedBlocks);
        break;
    }
  });
};

const handleBlockchainResponse = receivedBlocks => {
  if (receivedBlocks.length === 0) {
    console.log("Received blocks have a length of 0");
    return;
  }
  const latestBlockReceived = receivedBlocks[receivedBlocks.length - 1];
  if (!isBlockStructureValid(latestBlockReceived)) {
    console.log("The block structure of the block received is not valid");
    return;
  }
  const newestBlock = getNewestBlock();
  if (latestBlockReceived.index > newestBlock.index) {
    if (newestBlock.hash === latestBlockReceived.previousHash) {
      addBlockToChain(latestBlockReceived);
    } else if (receivedBlocks.length === 1) {
      sendMessageToAll(getAll());
    } else {
      replaceChain(receivedBlocks);
    }
  }
};

const sendMessage = (ws, message) => ws.send(JSON.stringify(message));

const sendMessageToAll = message =>
  sockets.forEach(ws => sendMessage(ws, message));

const responseLatest = () => blockchainResponse([getNewestBlock()]);
const responseAll = () => blockchainResponse(getBlockchain());
// 왜 여기서 가져오는 블록과 체인이 내 것이 아닌 상대방 것이 되는 걸까?

const handleSocketError = ws => {
  const closeSocketConnection = ws => {
    ws.close();
    sockets.splice(sockets.indexOf(ws), 1);
  };
  ws.on("close", () => closeSocketConnection(ws));
  ws.on("error", () => closeSocketConnection(ws));
};

const connectToPeers = newPeer => {
  // newPeer : ws://localhost:4000
  // 포트 3000 쪽에서 ws를 콘솔로 열어보면 위 url이 들어있다.
  // 포트 4000 쪽에서 ws를 콘솔로 열어보면 url 항목 자체가 없다.
  const ws = new WebSockets(newPeer);
  // 여기서 ws는 4000에 대한 소켓이 된다.
  ws.on("open", () => {
    initSocketConnection(ws);
  });
};

module.exports = {
  startP2PServer,
  connectToPeers
};
