  <script>
    const iframe = document.getElementById('sketchfabFrame');
    const statusEl = document.getElementById('status');
    let api = null;

    function log(msg) {
      console.log(msg);
      statusEl.textContent += "\\n" + msg;
    }

    function clearStatus() {
      statusEl.textContent = "";
    }

    function extractUrl(raw) {
      // 允許跨行 ( [\\s\\S]*? )，抓 iframe src=".../embed"
      const m1 = raw.match(/src=[\"'](https:\\/\\/sketchfab\\.com\\/models\\/[\\s\\S]*?\\/embed)[\"']/i);
      if (m1 && m1[1]) {
        return m1[1].trim();
      }

      // 使用者貼的是一般模型網址
      const m2 = raw.match(/https:\\/\\/sketchfab\\.com\\/models\\/([a-z0-9]+)/i);
      if (m2 && m2[1]) {
        return `https://sketchfab.com/models/${m2[1]}/embed`;
      }

      return null;
    }

    document.getElementById('loadBtn').addEventListener('click', () => {
      clearStatus();

      const rawInput = document.getElementById('urlInput').value.trim();
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

      iframe.onload = () => {
        log("iframe 已 onload，開始 initAPI()");
        initAPI();
      };
    });

    function initAPI() {
      log("initAPI() 呼叫中…");

      // 保險：如果 Sketchfab SDK 還沒載到，這裡會直接報
      if (typeof Sketchfab === "undefined") {
        log("❌ Sketchfab SDK 尚未載入 (Sketchfab is undefined)");
        alert("Sketchfab SDK 尚未載入，請稍後重試或檢查網路。");
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

    document.getElementById('captureBtn').addEventListener('click', () => {
      if (!api) {
        alert('模型尚未載入完成');
        log("擷取失敗：api 尚未就緒");
        return;
      }

      log("呼叫 api.getScreenShot …");
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
  </script>
