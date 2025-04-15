// Khai báo biến global để theo dõi tiến trình
let imagesProcessed = 0;

chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
  const tab = tabs[0];
  const statusEl = document.getElementById("status-message");
  const downloadBtn = document.getElementById("download-btn");
  
  if (tab.url && tab.url.includes("nhentaiworld")) {
    statusEl.textContent = "✅ Ready to download!";
    downloadBtn.addEventListener("click", async () => {
      try {
        // Reset biến đếm
        imagesProcessed = 0;
        statusEl.textContent = "🚀 Đang tải ảnh...";
        downloadBtn.disabled = true;
        
        // Gửi message và nhận dữ liệu ảnh
        const response = await chrome.tabs.sendMessage(tab.id, { 
          action: "downloadNhentai",
          galleryUrl: tab.url
        });
        
        if (response?.success && response?.images?.length > 0) {
          statusEl.textContent = `🗜️ Đang nén ${response.images.length} ảnh...`;
          console.log("Bắt đầu nén ZIP...");
          
          await createAndDownloadZip(response.images, response.folderName);
          
          statusEl.textContent = `✅ Đã tải xuống ${response.images.length} ảnh!`;
          console.log("Tải xuống hoàn tất!");
        } else {
          const errorMsg = response?.error || "Không tìm thấy ảnh nào";
          statusEl.textContent = `⚠️ ${errorMsg}`;
          console.log("Lỗi:", errorMsg);
        }
      } catch (error) {
        console.error("Lỗi chính:", error);
        statusEl.textContent = "❌ Lỗi khi xử lý: " + error.message;
      } finally {
        downloadBtn.disabled = false;
      }
    });
  } else {
    statusEl.textContent = "⚠️ Please open a NHentai gallery.";
    downloadBtn.disabled = true;
  }
});

async function createAndDownloadZip(images, folderName) {
  return new Promise(async (resolve, reject) => {
    try {
      const zip = new JSZip();
      const imgFolder = zip.folder(folderName);
      
      // Thêm progress khi nén
      const totalImages = images.length;
      let processed = 0;
      
      // Thêm từng ảnh vào ZIP
      for (const [index, imgData] of images.entries()) {
        const filename = `${folderName}_${(index + 1).toString().padStart(3, '0')}.jpg`;
        imgFolder.file(filename, imgData.data, { base64: true });
        processed++;
        
        // Cập nhật tiến trình mỗi 5 ảnh
        if (processed % 5 === 0 || processed === totalImages) {
          document.getElementById("status-message").textContent = 
            `🗜️ Đang nén... (${processed}/${totalImages})`;
        }
      }
      
      // Tạo file ZIP
      const content = await zip.generateAsync({ 
        type: "blob",
        compression: "DEFLATE",
        compressionOptions: { level: 6 }
      });
      
      // Tải xuống
      const url = URL.createObjectURL(content);
      await chrome.downloads.download({
        url: url,
        filename: `${folderName}.zip`,
        conflictAction: 'uniquify'
      });
      
      resolve();
    } catch (error) {
      reject(error);
    }
  });
}