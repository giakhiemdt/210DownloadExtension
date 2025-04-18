const getMetadataCheckbox = document.getElementById("get-metadata");
const metadataOptions = document.getElementById("metadata-options");

getMetadataCheckbox.addEventListener("change", () => {
    metadataOptions.style.display = getMetadataCheckbox.checked ? "block" : "none";
});

const getMetaArtists = document.getElementById("meta-artists")
const getMetaGenre = document.getElementById("meta-genre")
const getMetaTags = document.getElementById("meta-tags")

let imagesProcessed = 0;
let downloadBound = false;

chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
  const tab = tabs[0];
  const statusEl = document.getElementById("status-message");
  const downloadBtn = document.getElementById("download-btn");
  
  if (tab.url && (tab.url.includes("nhentaiworld") || tab.url.includes("imhentai"))) {
    statusEl.textContent = "Ready to download!";

    if (!downloadBound) {
      downloadBtn.addEventListener("click", async () => {
     
        imagesProcessed = 0;
        statusEl.textContent = "Đang tải ảnh...";
        downloadBtn.disabled = true;

        const response = await chrome.tabs.sendMessage(tab.id, { 
          action: tab.url.includes("nhentaiworld") ? "downloadNhentai" : "downloadImhentai",
          // metaArtists: getMetaArtists?.checked,
          // metaGenre: getMetaGenre?.checked,
          // metaTags: getMetaTags?.checked        
          metaArtists: true,
          metaGenre: true,
          metaTags: true
        });
        if (response?.success && response?.images?.length > 0) {
          await createAndDownloadZip(response.images, response.folderName, 
            response.metadata ? generateComicInfoXML(response.metadata) : null)   
        } else {
          const errorMsg = response?.error || "Không tìm thấy ảnh nào";
          statusEl.textContent = `⚠️ ${errorMsg}`;
          console.log("Lỗi:", errorMsg);
        }
      });
      downloadBound = true;
    }
  } else {
    statusEl.textContent = "⚠️ Please open a NHentai gallery.";
    downloadBtn.disabled = true;
  }
});

async function createAndDownloadZip(images, folderName, metadataXml) {
  const zip = new JSZip();

  const totalImages = images.length;
  let processed = 0;

  console.log(`Đang nén ${totalImages} ảnh...`);
  console.log("Bắt đầu nén ZIP...");

  for (const [index, imgData] of images.entries()) {
    const filename = `${folderName}_${(index + 1).toString().padStart(3, '0')}${imgData.type || '.jpg'}`;
    zip.file(filename, imgData.data, { base64: true });
    processed++;

    if (processed % 5 === 0 || processed === totalImages) {
      chrome.runtime.sendMessage({
        type: "zipProgress",
        processed,
        total: totalImages
      });
    }
  }

  if (metadataXml) {
    zip.file("ComicInfo.xml", metadataXml);
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

function generateComicInfoXML(metadata) {
  const { artists, genre, tags } = metadata;

  return `<?xml version="1.0" encoding="utf-8"?>
<ComicInfo>
  ${artists && artists.length ? `<Writer>${artists.join(", ")}</Writer>` : ""}
  ${genre ? `<Genre>${genre}</Genre>` : ""}
  ${tags && tags.length ? `<Tags>${tags.join(", ")}</Tags>` : ""}
</ComicInfo>`;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "downloadProcess") {
      const { processed, total } = message;
      const percent = Math.round((processed / total) * 100);

      const progressBar = document.getElementById("progressBar");
      const progressLabel = document.getElementById("progressLabel");

      if (progressBar && progressLabel) {
          progressBar.value = percent;
          progressLabel.textContent = `${percent}%`;
      }
  }
});


