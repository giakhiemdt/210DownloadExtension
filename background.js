importScripts('./lib/jszip.min.js')

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "checkImageType") {
        fetch(request.url + request.type, { method: 'HEAD' })        
            .then(response => {
                const contentType = response.headers.get('Content-Type');                    
                if (contentType && contentType.startsWith('image/')) {
                    sendResponse({ status: "true", type: contentType });
                } else {
                    sendResponse({ status: "false", message: "Not an image" });
                }
            }).catch(err => {
                console.error("Error checking image type:", err);
                sendResponse({ status: "error", message: err.message });
            });
        return true;  
    }


});
