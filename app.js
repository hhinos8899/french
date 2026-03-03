/* =========================================
   A+B 完整 UI 专业版
   ✔ 不默认锁定
   ✔ 满4手预测
   ✔ 2秒动画
   ✔ 显示当前算法
   ✔ 显示胜率
   ✔ 显示连错
   ✔ 连错4才切换
   ✔ 命中立即清空
   ✔ 无局数限制
========================================= */

/* ================= 工具 ================= */
function suffix(arr, n) {
  if (arr.length < n) return null;
  return arr.slice(arr.length - n).join("");
}
function byId(id){ return document.getElementById(id); }

/* ================= 规则 A ================= */
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

function predictA(history){
  if(history.length < 4) return null;
  const maxLen = Math.min(aWindowN, history.length);
  for(let len=maxLen; len>=3; len--){
    const s = suffix(history,len);
    if(s && RULES_A.has(s)){
      aWindowN=4;
      return RULES_A.get(s);
    }
  }
  if(aWindowN<6) aWindowN++;
  return null;
}

/* ================= 规则 B ================= */
const RULES_B = new Map([
  ["PBPB","B"],["PPBP","P"],["PBBB","B"],["PPPB","B"],
  ["PPPP","P"],["PPBB","P"],["PBBP","P"],["PBPP","P"],
  ["BBPP","P"],["BBPB","B"],["BPPP","P"],["BPBP","P"],
  ["BBBB","B"],["BBBP","P"],["BPPB","P"],["BPBB","B"]
]);

function predictB(history){
  if(history.length<4) return null;
  return RULES_B.get(suffix(history,4))||null;
}

/* ================= 状态 ================= */
let gameHistory=[];
let currentAlgo=null;
let pendingPred=null;
let waiting=false;

let stats={
  A:{hit:0,total:0,lose:0},
  B:{hit:0,total:0,lose:0}
};

/* ================= UI ================= */
function renderHistory(){
  const el=byId("recordDisplay");
  if(!el) return;
  el.innerHTML="";
  gameHistory.forEach(t=>{
    const d=document.createElement("div");
    d.className="record-item "+t.toLowerCase();
    d.textContent=t;
    el.appendChild(d);
  });
}

function showIdle(msg){
  byId("resultLabel").textContent="AI";
  byId("resultLabel").classList.remove("player","banker");
  byId("resultPct").textContent="";
  byId("predictionText").textContent=msg||"请稍候...";
}

function showPending(){
  byId("resultLabel").textContent="AI建议";
  byId("resultLabel").classList.remove("player","banker");
  byId("resultPct").textContent="...";
  byId("predictionText").textContent="人工智能正在预测中...";
}

function showResult(side){
  byId("resultLabel").textContent=side;
  byId("resultLabel").classList.remove("player","banker");
  byId("resultLabel").classList.add(side==="B"?"banker":"player");
  byId("resultPct").textContent="+95.00%";
  byId("predictionText").textContent=side;
}

function updateAlgoBar(){
  const bar=byId("algoBar");
  if(!bar) return;
  if(!currentAlgo){
    bar.textContent="当前算法：-｜胜率：-｜连错：0";
    return;
  }
  const s=stats[currentAlgo];
  const rate=s.total?((s.hit/s.total)*100).toFixed(2)+"%":"-";
  bar.textContent=`当前算法：${currentAlgo}｜胜率：${rate}｜连错：${s.lose}`;
}

/* ================= 预测 ================= */
function computePrediction(){

  if(gameHistory.length<4){
    showIdle("请至少输入4手后开始预测");
    updateAlgoBar();
    return;
  }

  const predA=predictA(gameHistory);
  const predB=predictB(gameHistory);

  if(!predA && !predB){
    showIdle("无预测");
    updateAlgoBar();
    return;
  }

  if(!currentAlgo){
    currentAlgo=predA?"A":"B";
  }

  if(stats[currentAlgo].lose>=4){
    currentAlgo=currentAlgo==="A"?"B":"A";
  }

  const pred=currentAlgo==="A"
    ?(predA||predB)
    :(predB||predA);

  if(!pred){
    showIdle("无预测");
    updateAlgoBar();
    return;
  }

  pendingPred=pred;

  waiting=true;
  showPending();

  setTimeout(()=>{
    showResult(pred);
    waiting=false;
    updateAlgoBar();
  },2000);
}

/* ================= 录入 ================= */
window.recordResult=function(type){

  if(waiting) return;

  if(pendingPred){
    const s=stats[currentAlgo];
    s.total++;

    if(pendingPred===type){
      s.hit++;

      // 命中清空
      gameHistory=[];
      currentAlgo=null;
      pendingPred=null;
      aWindowN=4;
      stats.A.lose=0;
      stats.B.lose=0;

      renderHistory();
      showIdle("命中！已重新开始");
      updateAlgoBar();
      return;

    }else{
      s.lose++;
    }
  }

  gameHistory.push(type);
  renderHistory();
  computePrediction();
};

/* ================= 撤销 ================= */
window.undoLastMove=function(){
  gameHistory.pop();
  renderHistory();
  computePrediction();
};

/* ================= 重置 ================= */
window.resetGame=function(){
  gameHistory=[];
  currentAlgo=null;
  pendingPred=null;
  aWindowN=4;
  stats.A={hit:0,total:0,lose:0};
  stats.B={hit:0,total:0,lose:0};
  renderHistory();
  showIdle("请稍候...");
  updateAlgoBar();
};

/* ================= 初始化 ================= */
document.addEventListener("DOMContentLoaded",function(){
  renderHistory();
  showIdle("请稍候...");
  updateAlgoBar();
});
