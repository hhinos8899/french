/* =========================================
   复杂规则 A+B 稳定版
   - 只用 A / B
   - 满4手才预测
   - 连错4才切换
   - 命中立即清空
   - 无25局限制
========================================= */

/* ================= 工具 ================= */
function suffix(arr, n) {
  if (arr.length < n) return null;
  return arr.slice(arr.length - n).join("");
}
function byId(id) { return document.getElementById(id); }

/* ================= 原复杂规则 A ================= */
const RULES_A = new Map([
  ["BBPP","P"],["BBPB","P"],["BPPPBB","P"],["BPPPBP","B"],
  ["BPPPP","B"],["BBBB","B"],["BBBPB","P"],["BBBPPP","P"],
  ["BPPBB","B"],["BPPBP","B"],["BBBPPB","P"],["BPBP","B"],
  ["BPBB","B"],["BPB","P"],["PPBB","B"],["PPBPB","B"],
  ["PPBPP","P"],["PBBBP","P"],["PBBBB","P"],["PPPBB","P"],
  ["PPPP","P"],["PBPB","P"],["PPPBP","B"],["PBBP","P"],
  ["PBPP","P"]
]);

let aWindowN = 4;

function predictA(history) {
  if (history.length < 4) return null;
  const maxLen = Math.min(aWindowN, history.length);
  for (let len = maxLen; len >= 3; len--) {
    const s = suffix(history, len);
    if (s && RULES_A.has(s)) {
      aWindowN = 4;
      return RULES_A.get(s);
    }
  }
  if (aWindowN < 6) aWindowN++;
  return null;
}

/* ================= 原复杂规则 B ================= */
const RULES_B = new Map([
  ["PBPB","B"],["PPBP","P"],["PBBB","B"],["PPPB","B"],
  ["PPPP","P"],["PPBB","P"],["PBBP","P"],["PBPP","P"],
  ["BBPP","P"],["BBPB","B"],["BPPP","P"],["BPBP","P"],
  ["BBBB","B"],["BBBP","P"],["BPPB","P"],["BPBB","B"]
]);

function predictB(history) {
  if (history.length < 4) return null;
  return RULES_B.get(suffix(history, 4)) || null;
}

/* ================= 引擎 ================= */

function makeAlgo(name, predictor) {
  return { name, predictor, loseStreak: 0 };
}

const ALGOS = [
  makeAlgo("A", predictA),
  makeAlgo("B", predictB),
];

let gameHistory = [];
let lockedAlgoName = null;
let pendingPred = null;

/* ================= UI ================= */

function showIdle(msg) {
  const label = byId("resultLabel");
  const pct = byId("resultPct");
  const text = byId("predictionText");

  if (label) {
    label.textContent = "AI";
    label.classList.remove("player","banker");
  }
  if (pct) pct.textContent = "";
  if (text) text.textContent = msg || "请稍候...";
}

function showResult(side) {
  const label = byId("resultLabel");
  const text = byId("predictionText");

  if (label) {
    label.textContent = side;
    label.classList.remove("player","banker");
    label.classList.add(side==="B"?"banker":"player");
  }
  if (text) text.textContent = side;
}

function renderHistory() {
  const el = byId("recordDisplay");
  if (!el) return;
  el.innerHTML = "";
  gameHistory.forEach(t=>{
    const d=document.createElement("div");
    d.className="record-item "+t.toLowerCase();
    d.textContent=t;
    el.appendChild(d);
  });
}

/* ================= 预测 ================= */

function computePrediction() {

  if (gameHistory.length < 4) {
    showIdle("请至少输入4手后开始预测");
    return;
  }

  if (!lockedAlgoName) lockedAlgoName = "A";

  const algo = ALGOS.find(a=>a.name===lockedAlgoName);
  const pred = algo.predictor(gameHistory);

  if (!pred){
    showIdle("无预测");
    return;
  }

  pendingPred = pred;
  showResult(pred);
}

/* ================= 录入 ================= */

window.recordResult = function(type){

  if (type!=="B" && type!=="P") return;

  if (pendingPred){
    const algo = ALGOS.find(a=>a.name===lockedAlgoName);

    if (pendingPred === type){

      // 命中 → 清空
      gameHistory = [];
      lockedAlgoName = null;
      pendingPred = null;
      aWindowN = 4;

      ALGOS.forEach(a=>a.loseStreak=0);

      renderHistory();
      showIdle("命中！已重新开始");
      return;

    } else {

      algo.loseStreak++;

      if (algo.loseStreak >= 4){
        lockedAlgoName = lockedAlgoName==="A"?"B":"A";
      }
    }
  }

  gameHistory.push(type);
  renderHistory();
  computePrediction();
};

/* ================= 撤销 ================= */

window.undoLastMove = function(){
  gameHistory.pop();
  renderHistory();
  computePrediction();
};

/* ================= 重置 ================= */

window.resetGame = function(){
  gameHistory=[];
  lockedAlgoName=null;
  pendingPred=null;
  aWindowN=4;
  ALGOS.forEach(a=>a.loseStreak=0);
  renderHistory();
  showIdle("请稍候...");
};

/* ================= 初始化 ================= */

document.addEventListener("DOMContentLoaded", function(){
  renderHistory();
  showIdle("请稍候...");
});