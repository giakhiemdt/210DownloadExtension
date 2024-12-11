chrome.runtime.onInstalled.addListener(() => {
    console.log('Extension installed');
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "downloadImage") {
        fetch(request.url)
            .then(response => response.blob())
            .then(blob => {
                chrome.downloads.download({
                    url: request.url,
                    filename: request.filename,
                    saveAs: false
                }, (downloadId) => {
                    console.log(`Download started with ID: ${downloadId}`);
                });
            })
            .catch(err => console.error("Error downloading image:", err));

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

        return true;  // Đây là cần thiết để báo cáo bất đồng bộ
    }
});