chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "downloadImhentai") {
        if (request.onlyMeta) {
            getMetaData(
                request.metaArtists,
                request.metaGenre,
                request.metaTags
            ).then(metaResult => {
                sendResponse({metadata: metaResult });
            })
        }
        getMetaData(
            request.metaArtists,
            request.metaGenre,
            request.metaTags
        ).then(metaResult => {
            handleDownload().then(imageResult => {
                sendResponse({ ...imageResult, metadata: metaResult });
            }).catch(error => {
                sendResponse({ success: false, error: error.message, metadata: metaResult});
            });
        });
        return true; 
    }
});

async function getMetaData(getArtists, getGenre, getTags) {
    if (!getArtists && !getGenre && !getTags) return null;

    const detailList = document.querySelector(
        "body > div.overlay > div > div.row.gallery_first > div.col-md-7.col-sm-7.col-lg-8.right_details > ul"
    );

    if (!detailList) return null;

    const artistList = [];
    let genre = "";
    const tagList = [];

    for (const detailElement of detailList.querySelectorAll("li")) {
        const spanEl = detailElement.querySelector("span.tags_text");
        if (!spanEl) continue;

        const label = spanEl.textContent.trim();

        if (getArtists && label === "Artists:") {
            for (const artistElement of detailElement.querySelectorAll("a.tag")) {
                // Lấy tên artist từ text content của thẻ <a> (bỏ qua <span class="badge">)
                artistList.push(artistElement.childNodes[0].textContent.trim());  // Lấy chỉ text của <a> mà không lấy số trong <span>
            }
        } else if (getGenre && label === "Category:") {
            const genreEl = detailElement.querySelector("a.tag").childNodes[0];
            if (genreEl) genre = genreEl.textContent.trim();
        } else if (getTags && label === "Tags:") {
            for (const tagElement of detailElement.querySelectorAll("a.tag")) {
                tagList.push(tagElement.childNodes[0].textContent.trim());
            }
        }
    }

    return {
        artists: artistList,
        genre: genre,
        tags: tagList
    };
}



async function handleDownload() {
    try {
        loadAll();

        await delay(500);

        const folderName = document.querySelector(
            "body > div.overlay > div > div.row.gallery_first > div.col-md-7.col-sm-7.col-lg-8.right_details > h1"
        ).textContent.replace(/[<>:"/\\|?*]/g, "");

        const thumbs = document.querySelector("#append_thumbs");
        if (!thumbs) throw new Error("Không tìm thấy #append_thumbs");

        const imageElements = Array.from(thumbs.querySelectorAll("img"));
        if (imageElements.length === 0) throw new Error("Không tìm thấy ảnh nào");

        let currentImageType = await getImageType(imageElements[0].getAttribute("data-src").replace("t.jpg", ""));

        console.log("Current Image Type: " + currentImageType);

        if (currentImageType === "none") throw new Error("Không xác định được định dạng ảnh");

        const images = [];

        let errorCount = 0;

        let downloadType = 1;

        for (const [index, img] of imageElements.entries()) {
            if (errorCount > 3) break;
            const imageUrl = img.getAttribute("data-src") || img.src;
            if (!imageUrl) continue;

            let clearUrl = imageUrl.replace("t.jpg", currentImageType);
            const match = clearUrl.match(/\/(\d+)\.(jpg|jpeg|webp|png)$/);
            const filename = match ? `${match[1]}${currentImageType}` : `image_${index + 1}${currentImageType}`;

            console.log(`Tải ảnh: ${clearUrl} => ${filename}`);
            
            await chrome.runtime.sendMessage({
                type: "downloadProcess",
                processed: images.length,
                total: imageElements.length - 1
            });

            // if (downloadType === 1) {
            
                const base64Data = await downloadImageAsBase64(clearUrl);
                if (!base64Data) {
                    currentImageType = await getImageType(img.getAttribute("data-src").replace("t.jpg", ""));
                    clearUrl = imageUrl.replace("t.jpg", currentImageType);
                    const base64Data = await downloadImageAsBase64(clearUrl);
                    images.push({ name: filename, data: base64Data, type: currentImageType});
                    if (!base64Data) {
                        console.warn(`⚠️  Bỏ qua ảnh lỗi: ${clearUrl}`);
                        errorCount++;
                    }
                    // downloadTry = 2;
                }else {
                    images.push({ name: filename, data: base64Data, type: currentImageType});
                }   
            // }
            // if (downloadType === 2) {
            //     await chromeDownloadImage(clearUrl, currentImageType, filename, folderName);
            // }

        }

        return {
            success: true,
            images,
            folderName,
            totalImages: images.length,
            downloadType
        };

    } catch (error) {
        console.error("Lỗi trong quá trình xử lý:", error);
        throw error;
    }
}

function loadAll() {
    const loadAllBtn = document.querySelector("#load_all");
    if (loadAllBtn) loadAllBtn.click();
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const imageCache = new Map();

async function getImageType(baseUrl) {
    if (imageCache.has(baseUrl)) return imageCache.get(baseUrl);

    const imageTypes = [".jpg", ".webp", ".png"];
    for (const ext of imageTypes) {
        const response = await checkImageType(baseUrl, ext);
        if (response.status === "true") {
            imageCache.set(baseUrl, ext);
            return ext;
        }
    }

    imageCache.set(baseUrl, "none");
    return "none";
}

async function checkImageType(url, type) {
    return new Promise(resolve => {
        chrome.runtime.sendMessage({ action: "checkImageType", url, type }, response => {
            resolve(response);
        });
    });
}

async function chromeDownloadImage(clearUrl, currentImageType, filename, folderName) {
    // Thêm timeout giữa các lần tải
    await delay(500); // Đợi 500ms trước khi gửi request tải
    
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({
            action: "chromedDownloadImage",
            url: clearUrl,
            type: currentImageType,
            filename,
            foldername: folderName,
        }, response => {
            if (response && response.success) {
                resolve(response);
            } else {
                reject(new Error(response?.error || "Lỗi không xác định khi tải ảnh"));
            }
        });
        
        // Thiết lập timeout cho request trong trường hợp không nhận được phản hồi
        setTimeout(() => {
            reject(new Error("Hết thời gian chờ tải ảnh"));
        }, 30000); // Timeout sau 30 giây
    });
}

async function downloadImageAsBase64(url) {
    try {
        const response = await fetch(url);
        const blob = await response.blob();

        if (!blob.type.startsWith("image/")) {
            throw new Error(`Không phải ảnh: ${blob.type}`);
        }

        return await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = reader.result.split(",")[1];
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch (err) {
        console.error(`Lỗi khi tải ảnh ${url}`, err);
        return ""; 
    }
}

