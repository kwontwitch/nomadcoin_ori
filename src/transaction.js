const CryptoJS = require("crypto-js"),
  elliptic = require("elliptic"),
  utils = require("./utils");

const ec = new elliptic.ec("secp256k1");

class TxOut {
  constructor(address, amount) {
    this.address = address;
    this.amount = amount;
  }
}

class TxIn {
  // uTxOutId
  // uTxOutIndex
  // Signature
}

class Transaction {
  // ID
  // txIns[]
  // txOuts[]
}

class UTxOut {
  constructor(txOutId, txOutIndex, address, amount) {
    this.txOutId = txOutId;
    this.txOutIndex = txOutIndex;
    this.address = address;
    this.amount = amount;
  }
}

let uTxOuts = [];

const getTxId = tx => {
  const txInContents = tx.txIns
    .map(txIn => txIn.uTxOutId + txIn.uTxOutIndex)
    .reduce((a, b) => a + b, "");
  // 받은 Tx의 In들을 전부 일렬로 나열하여, 문자열 그대로 이어 붙인다.

  const txOutContents = tx.txOuts
    .map(txOut => txOut.address + txOut.amount)
    .reduce((a, b) => a + b, "");
  // 받은 Tx의 Out들을 전부 일렬로 나열하여, 문자열 그대로 이어 붙인다.
  return CryptoJS.SHA256(txInContents + txOutContents).toString();
  // 위 두 결과를 다시 문자열 그대로 붙여서 해쉬로 만든다.
};

// uTxOutList에서 Id와 Index를 통해 검색한다.
const findUTxOut = (txOutId, txOutIndex, uTxOutList) => {
  return uTxOutList.find(
    uTxOut => uTxOut.txOutId === txOutId && uTxOut.txOutIndex === txOutIndex
  );
};

const signTxIn = (tx, txInIndex, privateKey, uTxOut) => {
  const txIn = tx.txIns[txInIndex];
  const dataToSign = tx.id;
  const referencedUTxOut = findUTxOut(txIn.txOutId, tx.txOutIndex, uTxOuts);
  if (referencedUTxOut === null) {
    return;
  }
  const key = ec.keyFromPrivate(privateKey, "hex");
  const signature = utils.toHexString(key.sign(dataToSign).toDER());
  return signature;
};

// 신규 UTxO와 기존 UTxO의 사용되지 않은 부분을 합쳐 최신 UTxO를 만든다.
const updateUTxOuts = (newTxs, uTxOutList) => {
  const newUTxOuts = newTxs 
  // 새로운 Tx의 Out을 배열로 만든다. 이들은 당연히 UTxOut들이다. 
    .map(tx => {            
      tx.txOuts.map((txOut, index) => {
        new UTxOut(tx.id, index, txOut.address, txOut.amount);
      });
    })
    .reduce((a, b) => a.concat(b), []);
  // Txs : 배열, tx : 객체, txOuts : 배열, [txOut : 객체, index : txOut의 인덱스]

    // spentTxOuts[]는 UTxOutList와 대조하여 사용된 UTxOut을 없애는데 쓰인다.
    const spentTxOuts = newTxs 
    .map(tx => tx.txIns) 
    // 새로운 모든 Tx로 인풋의 배열을 만든다.
    .reduce((a, b) => a.concat(b), []) 
    /// 위 배열의 empty item 제거.
    .map(txIn => new UTxOut(txIn.txOutId, txIn.txOutIndex, "", 0));  
    // 이 배열을 통해 사용된 TxOuts 배열을 만든다.
    ///새로운 Tx의 인풋은 spentTxOut이기 때문이다.
    ///OldUTxOuts -> 1) UTxOuts
    ///           -> 2) spentTXOuts == newTxIns
    ///이 

  const resultingUTxOuts = uTxOutList  
    .filter(uTxO => !findUTxOut(uTxO.txOutId, uTxO.txOutIndex, spentTxOuts))
    // 기존 UTxOutList에서 사용되지 않은 것만 필터링해서 남긴 후,
    // 새롭게 생성된 UTxOuts을 배열에 추가하여 resultingUTxOuts로 반환한다.
    ///  findUTxOut은 찾으면 value를, 못찾으면 undefined를 반환한다.
    /// !findUTxOut은 찾으면 false를, 못찾으면 true     를 반환한다. 
    /// filter는 callfunc이 1이 되는 것만을 배열에 남긴다.
    /// 즉, uTxOutList에서 spendTxOuts에서 찾아지지 않는 아이템만을 남긴다. 
    /// 이 아이템들은 OldUTxOuts라고 할 수 있다!
    /// 이 결과에 새로 생성된 newUTxOuts를 연결한다.
    .concat(newUTxOuts);
    // 반환한다. 끗.
  return resultingUTxOuts;
};
