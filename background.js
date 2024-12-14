let cachedFolderName = ""; // Lưu tên folder để nó tự tạo thư mục khi tải xuống!!!


chrome.runtime.onInstalled.addListener(() => {
    console.log('Extension installed');
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "downloadImage") {
    if (!request.foldername) {
        console.error("Folder name is not provided!");
        return false;
    }

    const folderName = encodeURIComponent(request.foldername.replace(/\\/g, "/").replace(/\/{2,}/g, "/"));
    const filename = `${folderName}/${request.filename}`;

    cachedFolderName = request.foldername || "defaultFolder";

    fetch(request.url)
    .then(response => {
        if (!response.ok) {
            console.error(`Download failed with status: ${response.status}`);
            // Gửi phản hồi về trạng thái thất bại
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (tabs.length > 0) {
                    chrome.tabs.sendMessage(tabs[0].id, {
                        action: "downloadImageResponse",
                        foldername: request.foldername,
                        filename: request.filename,
                        type: request.type,
                        url: request.url,
                    });
                }
            });
        } else {
            chrome.downloads.download({
                url: request.url,
                filename: filename,
                saveAs: false,
                conflictAction: "overwrite",
            }, () => {
                if (chrome.runtime.lastError) {
                    console.error(`Download failed: ${chrome.runtime.lastError.message}`);
                    // Gửi phản hồi về trạng thái thất bại
                    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                        if (tabs.length > 0) {
                            chrome.tabs.sendMessage(tabs[0].id, {
                                action: "downloadImageResponse",
                                foldername: request.foldername,
                                filename: request.filename,
                                type: request.type,
                                url: request.url,
                            });
                        }
                    });
                    
                }
            });
        }
    })
    .catch(error => {
        console.error('Fetch failed:', error);
        // Gửi phản hồi về trạng thái thất bại
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs.length > 0) {
                chrome.tabs.sendMessage(tabs[0].id, {
                    action: "downloadImageResponse",
                    foldername: request.foldername,
                    filename: request.filename,
                    type: request.type,
                    url: request.url,
                });
            }
        });
    });


    return true;
}else if (request.action === "checkImageType") {
        console.log("Checking image type...");

        fetch(request.url + request.type, { method: 'HEAD' })
            .then(response => {
                const contentType = response.headers.get('Content-Type');
                if (contentType && contentType.startsWith('image/')) {
                    sendResponse({ status: "true", type: contentType });
                } else {
                    sendResponse({ status: "false", message: "Not an image" });
                }
            })
            .catch(err => {
                console.error("Error checking image type:", err);
                sendResponse({ status: "error", message: err.message });
            });

        return true;  
    } else if (request.action === "downloadManga") {
        request.mangaUrls.forEach((url) => {
            chrome.tabs.create({ url: url, active: false }, (tab) => {
                console.log(`Created tab ${tab.id}`);
            });
        });
    }
});

chrome.downloads.onDeterminingFilename.addListener((downloadItem, suggest) => {
    if (downloadItem.byExtensionId) { 
        console.log("Intercepting download:", downloadItem);

        const folderName = cachedFolderName || "defaultFolder"; 

        const newFilename = `${folderName}/${downloadItem.filename}`;

        suggest({ filename: newFilename, conflictAction: "overwrite" });
    } else {
        suggest();
    }
});
