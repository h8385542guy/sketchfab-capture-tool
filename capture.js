const iframe = document.getElementById('sketchfabFrame');
const statusEl = document.getElementById('status');
const loadBtn = document.getElementById('loadBtn');
const captureBtn = document.getElementById('captureBtn');
const inputEl = document.getElementById('urlInput');
const viewerArea = document.getElementById('viewerArea');

function log(msg) {
  console.log(msg);
  statusEl.textContent += "\n" + msg;
}
function clearStatus() {
  statusEl.textContent = "";
}

// 跟之前一樣：從使用者輸入中提取出 /embed 網址
function extractUrl(raw) {
  // 嘗試從完整 embed code 擷取 <iframe src=".../embed">
  const m1 = raw.match(/src=["'](https:\/\/sketchfab\.com\/models\/[\s\S]*?\/embed)["']/i);
  if (m1 && m1[1]) {
    return m1[1].trim();
  }

  // 或使用者只貼模型網址
  const m2 = raw.match(/https:\/\/sketchfab\.com\/models\/([a-z0-9]+)/i);
  if (m2 && m2[1]) {
    return `https://sketchfab.com/models/${m2[1]}/embed`;
  }

  return null;
}

// 載入模型（只是把 iframe 指向正確的 embed URL，純展示）
loadBtn.addEventListener('click', () => {
  clearStatus();

  const rawInput = inputEl.value.trim();
  if (!rawInput) {
    alert('請貼上 Sketchfab 連結或 Embed 代碼');
    return;
  }

  const url = extractUrl(rawInput);

  log("使用者輸入(raw): " + rawInput);
  log("解析得到(url): " + url);

  if (!url) {
    alert('無法識別有效的 Sketchfab 模型連結，請確認輸入內容。');
    log("❌ 無法解析網址");
    return;
  }

  iframe.src = url;
  log("已設定 iframe.src，嘗試載入模型…");

  iframe.onload = () => {
    log("✅ iframe onload：模型嘗試顯示。如果看到 404/拒絕，代表該模型不允許外站嵌入。");
  };
});

// 擷取目前視角（使用 html2canvas 對 viewerArea 做快照）
captureBtn.addEventListener('click', async () => {
  // 這裡我們「不」去讀 iframe 的內容（跨網域不能直接讀）
  // 我們做的是把整個 viewerArea (包含 iframe 畫面) rasterize 成一張 bitmap。
  // html2canvas 在跨網域 iframe 的情況下，會把 iframe 視為一個透明方塊（安全限制）。
  //
  // => 結果：某些瀏覽器/情境下，iframe內容會變成黑框或空白。
  //    這是瀏覽器安全政策，避免擷取別的 domain。
  //
  // 你要測一下在你的 Chrome / Edge 之下，iframe 內容是不是能被畫下來。
  // 如果被塗黑，我們就知道：瀏覽器拒絕截跨網域 iframe。
  // 那我們就只能靠使用者自己的螢幕截圖 (PrtScn / Win+Shift+S)。
  //
  // 但是：有些情境 (特別是企業內部簡報用或寬鬆瀏覽器設定) 是可行的。
  // 我們先嘗試看看。

  log("嘗試擷取目前視角…");

  try {
    const canvas = await html2canvas(viewerArea, {
      useCORS: true,
      backgroundColor: null
    });

    // 下載圖片
    const dataURL = canvas.toDataURL("image/png");
    const a = document.createElement('a');
    a.href = dataURL;
    a.download = 'snapshot_screen.png';
    a.click();

    log("✅ 擷取完成並下載 snapshot_screen.png");
  } catch (err) {
    console.error(err);
    log("❌ 擷取失敗：" + err.message);
    alert("擷取失敗，可能是瀏覽器封鎖跨網域 iframe 的畫面擷取。");
  }
});

// 啟動訊息
window.addEventListener('load', () => {
  clearStatus();
  log("✅ 簡化版已啟動：請貼 embed / URL → 載入模型 → 旋轉 → 擷取目前視角");
  log("⚠ 若擷取出來是黑的，表示瀏覽器禁止截圖外部 iframe，請改用內建螢幕截圖 (Win+Shift+S)。");
});
