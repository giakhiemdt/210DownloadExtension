let imagesProcessed = 0;

chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
  const tab = tabs[0];
  const statusEl = document.getElementById("status-message");
  const downloadBtn = document.getElementById("download-btn");
  
  if (tab.url && (tab.url.includes("nhentaiworld") || tab.url.includes("imhentai"))) {
    statusEl.textContent = "Ready to download!";
    downloadBtn.addEventListener("click", async () => {
     
        imagesProcessed = 0;
        statusEl.textContent = "Đang tải ảnh...";
        downloadBtn.disabled = true;
        
        const response = await chrome.tabs.sendMessage(tab.id, { 
          action: tab.url.includes("nhentaiworld") ? "downloadNhentai" : "downloadImhentai",
          // galleryUrl: tab.url
        });
        
        if (response?.success && response?.images?.length > 0) {
          await createAndDownloadZip(response.images, response.folderName)   
        } else {
          const errorMsg = response?.error || "Không tìm thấy ảnh nào";
          statusEl.textContent = `⚠️ ${errorMsg}`;
          console.log("Lỗi:", errorMsg);
        }
      
    });
  } else {
    statusEl.textContent = "⚠️ Please open a NHentai gallery.";
    downloadBtn.disabled = true;
  }
});

async function createAndDownloadZip(images, folderName) {
    
  const zip = new JSZip();
  const imgFolder = zip.folder(folderName);
  
  const totalImages = images.length;
  let processed = 0;

  console.log("Đang nén ${totalImages} ảnh...");
  console.log("Bắt đầu nén ZIP...");
  
  for (const [index, imgData] of images.entries()) {

    const filename = `${folderName}_${(index + 1).toString().padStart(3, '0')}${imgData.type || '.jpg'}`;
    imgFolder.file(filename, imgData.data, { base64: true });
    processed++;
    
    if (processed % 5 === 0 || processed === totalImages) {
      chrome.runtime.sendMessage({
          type: "zipProgress",
          processed,
          total: totalImages
        });
    }
  }
  
  const content = await zip.generateAsync({ 
    type: "blob",
    compression: "DEFLATE",
    compressionOptions: { level: 6 }
  });

  if (content) {
      console.log("Nén ZIP thành công!");
      console.log("Bắt đầu tải ZIP...");


      const url = (self.URL || URL).createObjectURL(content);

      await chrome.downloads.download({
          url: url,
          filename: `${folderName}.zip`,
          conflictAction: 'uniquify'
      });
      setTimeout(() => URL.revokeObjectURL(url), 5000);
  }

}