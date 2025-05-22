let imagesProcessed = 0;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "downloadNhentai") {
    handleDownload().then(result => {
      sendResponse(result);
    }).catch(error => {
      sendResponse({ success: false, error: error.message });
    });
    
    return true; 
  }
});

async function handleDownload() {
  try {
    const imageContainer = document.querySelector(".images-space") || 
                         document.querySelector(".thumb-container");
    if (!imageContainer) {
      throw new Error("Không tìm thấy container ảnh");
    }
    
    const titleElement = document.querySelector("h1 span a") || 
                        document.querySelector(".title");
    if (!titleElement) {
      throw new Error("Không tìm thấy tiêu đề truyện");
    }
    
    const folderName = titleElement.textContent
      .replace(/[<>:"/\\|?*]/g, "")
      .substring(0, 100); // Giới hạn độ dài tên folder
    
    const imageElements = Array.from(imageContainer.querySelectorAll("img"))
      .filter(img => !img.src.includes("information.jpg"));
    
    if (imageElements.length === 0) {
      throw new Error("Không tìm thấy ảnh nào");
    }
    
    const images = [];
    
    for (const [index, image] of imageElements.entries()) {
      try {
        image.scrollIntoView({ behavior: "smooth", block: "center" });
        await wait(300);
        
        const isHighQuality = await ensureImageQuality(image);
        if (!isHighQuality) continue;
        
        const imgData = await getImageData(image);
        if (imgData) {
          images.push({
            data: imgData,
            index: index + 1
          });
          imagesProcessed = images.length;
          console.log(`Đã xử lý ảnh ${imagesProcessed}/${imageElements.length}`);
        }
      } catch (err) {
        console.warn(`Lỗi với ảnh ${index + 1}:`, err);
      }
    }
    
    if (images.length === 0) {
      throw new Error("Không thể tải bất kỳ ảnh nào");
    }
    
    return { 
      success: true, 
      images: images, 
      folderName: folderName,
      totalImages: imageElements.length,
      downloadType: 1
    };
  } catch (error) {
    console.error("Lỗi trong quá trình xử lý:", error);
    throw error;
  }
}

// ========== CÁC HÀM HELPER ========== //
function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function waitForImageLoad(imgElement) {
    return new Promise((resolve) => {
        if (imgElement.complete && imgElement.naturalWidth !== 0) {
            resolve();
        } else {
            imgElement.onload = () => resolve();
            imgElement.onerror = () => resolve();
        }
    });
}

async function ensureImageQuality(img) {
    const maxRetries = 5;
    let retry = 0;
    
    while (retry < maxRetries) {
        if (img.naturalWidth >= 800) return true;
        await wait(500);
        retry++;
    }
    return false;
}

async function getImageData(imgElement) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    await waitForImageLoad(imgElement);
    
    const maxSize = 4000;
    let width = imgElement.naturalWidth;
    let height = imgElement.naturalHeight;
    
    if (width > maxSize) {
        height = (height / width) * maxSize;
        width = maxSize;
    }
    
    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(imgElement, 0, 0, width, height);
    
    return new Promise((resolve) => {
        canvas.toBlob((blob) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64Data = reader.result.split(',')[1];
                resolve(base64Data);
            };
            reader.readAsDataURL(blob);
        }, 'image/jpeg', 0.9);
    });
}