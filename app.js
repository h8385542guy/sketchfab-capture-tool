// 取得頁面元素
const iframe = document.getElementById('sketchfabFrame');
const statusEl = document.getElementById('status');
const loadBtn = document.getElementById('loadBtn');
const captureBtn = document.getElementById('captureBtn');
const inputEl = document.getElementById('urlInput');

let api = null;

// 小工具：把狀態印到頁面和 console
function log(msg) {
  console.log(msg);
  statusEl.textContent += "\n" + msg;
}
function clearStatus() {
  statusEl.textContent = "";
}

// 從使用者貼的文字裡抓出合法的 Sketchfab /embed URL
function extractUrl(raw) {
  // 1) 嘗試從完整 embed code 抓 src=".../embed"
  // [\\s\\S]*? 允許跨行，用最短匹配
  const m1 = raw.match(/src=["'](https:\/\/sketchfab\.com\/models\/[\s\S]*?\/embed)["']/i);
  if (m1 && m1[1]) {
    return m1[1].trim();
  }

  // 2) 使用者只貼一般模型網址或 /embed
  const m2 = raw.match(/https:\/\/sketchfab\.com\/models\/([a-z0-9]+)/i);
  if (m2 && m2[1]) {
    // 無論他有沒有帶 /embed，我們都強制補上 /embed
    return `https://sketchfab.com/models/${m2[1]}/embed`;
  }

  return null;
}

// 當使用者按「載入模型」
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
  log("已設定 iframe.src，等待 iframe onload …");

  // iframe 載入完成後再做 initAPI
  iframe.onload = () => {
    log("iframe 已 onload，開始 initAPI()");
    initAPI();
  };
});

// 初始化 Sketchfab API，讓我們可以叫 viewer 截圖
function initAPI() {
  log("initAPI() 呼叫中…");

  if (typeof Sketchfab === "undefined") {
    log("❌ Sketchfab SDK 尚未載入 (Sketchfab is undefined)");
    alert("Sketchfab SDK 尚未載入，請檢查網路或稍後再試。");
    return;
  }

  try {
    const client = new Sketchfab(iframe);

    client.init(null, {
      success: function(apiInstance) {
        api = apiInstance;
        log("✅ initAPI 成功，等待 viewerready…");

        api.addEventListener('viewerready', () => {
          log("✅ viewerready：模型已就緒，可以擷取截圖");
        });
      },
      error: function() {
        api = null;
        log("❌ initAPI 回傳 error()");
        alert('載入模型失敗或該連結無法嵌入');
      }
    });
  } catch (e) {
    log("❌ initAPI() throw: " + e.message);
    alert('初始化失敗：' + e.message);
  }
}

// 按「擷取目前視角」
captureBtn.addEventListener('click', () => {
  if (!api) {
    alert('模型尚未載入完成');
    log("擷取失敗：api 尚未就緒");
    return;
  }

  log("呼叫 api.getScreenShot …");

  // 這裡用 1920x1080。你之後可以加選單給客戶選 1080p / 4K
  api.getScreenShot(1920, 1080, 'image/png', (err, result) => {
    if (err) {
      log("❌ getScreenShot err: " + err);
      alert('擷取失敗');
    } else {
      log("✅ getScreenShot 成功，下載 snapshot.png");
      const a = document.createElement('a');
      a.href = result;
      a.download = 'snapshot.png';
      a.click();
    }
  });
});

// 保險：頁面載完先寫一行狀態，確認 app.js 有在跑
window.addEventListener('load', () => {
  clearStatus();
  log("✅ app.js 已啟動，請貼上 Sketchfab 連結後按『載入模型』");
});
