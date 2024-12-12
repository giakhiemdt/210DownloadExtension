let cachedFolderName = ""; 


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

        chrome.downloads.download({
            url: request.url, 
            filename: filename,
            saveAs: false,
            conflictAction: "overwrite",
        }, (downloadId) => {
            if (chrome.runtime.lastError) {
                console.error(`Download failed: ${chrome.runtime.lastError.message}`);
            } else {
                console.log(`Download started with ID: ${downloadId}`);
            }
        });

        return true;
    } else if (request.action === "checkImageType") {
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
