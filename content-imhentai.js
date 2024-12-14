const currentUrl = window.location.href;

if (currentUrl.includes("https://imhentai.xxx/gallery/")) {
    const button = document.querySelector("#dl_new");
    if (button) {
        button.addEventListener("click", async (event) => {
            event.preventDefault();
            event.stopImmediatePropagation();
            downloadManga();
        });
    }
} else {
    handleGalleryPage();
}

function handleGalleryPage() {
    const thumbsContainer = document.querySelector("body > div.overlay > div > div.row.galleries > div.thumbs_container");
    const selectedMangas = [];
    if (thumbsContainer) {
        const thumbsElement = Array.from(thumbsContainer.getElementsByClassName("thumb"));
        thumbsElement.forEach((thumbElement) => {
            addTickButton(thumbElement.querySelector("div.inner_thumb"), selectedMangas);
        });
        addSelectAllButton(selectedMangas);
        addDownloadButton(selectedMangas);
    }
}

async function checkImageType(url, type) {
    return new Promise((resolve) => {
        chrome.runtime.sendMessage({ action: "checkImageType", url, type }, (response) => {
            console.log("Response from background:", response);  // Kiểm tra kết quả
            resolve(response);
        });
    });
}


const imageCache = new Map();

async function getImageType(url) {
    if (imageCache.has(url)) {
        return imageCache.get(url); // Trả về kiểu ảnh từ cache nếu đã kiểm tra trước đó
    }

    const imageTypeList = [".jpg", ".webp", ".png"];
    for (const type of imageTypeList) {
        const response = await checkImageType(url, type);
        console.log("url1: " + url + " | type: " + type)
        if (response.status === "true") {
            imageCache.set(url, type); // Lưu kết quả vào cache
            return type;
        }
    }
    imageCache.set(url, "none"); // Lưu kết quả nếu không tìm thấy loại ảnh
    return "none";
}


chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
    if (message.action === "downloadImageResponse") {
        const url = message.url.replace(message.type, "");  // Sử dụng message thay vì request
        const type = await getImageType(url);
        console.log("New url: " + url + type);
        chrome.runtime.sendMessage({
            action: "downloadImage",
            url: url + type,
            type: type,
            filename: message.filename,  // Sử dụng message thay vì request
            foldername: message.foldername,
        });
        sendResponse({status: "Image download initiated"});
    }
    return true;
});


function downloadManga() {
    const loadAll = document.querySelector("#load_all");
    const folderName = document.querySelector(
        "body > div.overlay > div > div.row.gallery_first > div.col-md-7.col-sm-7.col-lg-8.right_details > h1"
    ).textContent.replace(/[<>:"/\\|?*]/g, "");
    

    if (loadAll) loadAll.click();

    setTimeout(async () => {
        const thumbs = document.querySelector("#append_thumbs");
        if (thumbs) {
            const imgElements = Array.from(thumbs.querySelectorAll("img"));
            const currentImageType = await getImageType(imgElements[0].getAttribute("data-src").replace("t.jpg", ""));

            for (const img of imgElements) {
                const imageUrl = img.getAttribute("data-src") || img.src;
                
                if (imageUrl) {
                    const clearUrl = imageUrl.replace("t.jpg", currentImageType);
                    console.log(" url :" + clearUrl)
                    const filename = clearUrl.match(/\/(\d+)\.(jpg|jpeg|webp)$/)[1] + currentImageType;
                    console.log("fileName: " + clearUrl)
                    chrome.runtime.sendMessage({
                        action: "downloadImage",
                        url: clearUrl,
                        type: currentImageType,
                        filename,
                        foldername: folderName,
                    });
                }
            }
            
            
        
        }
    }, 1000);
}



function addTickButton(thumb, selectedMangas) {
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.style.cssText = "position:absolute;top:10px;right:10px;z-index:100;width:20px;height:20px;";

    thumb.style.position = "relative";
    thumb.appendChild(checkbox);

    checkbox.addEventListener("change", (event) => {
        const mangaUrl = thumb.querySelector("a")?.href;
        thumb.style.opacity = event.target.checked ? "0.5" : "1";
        if (event.target.checked && mangaUrl) {
            selectedMangas.push(mangaUrl);
        } else {
            const index = selectedMangas.indexOf(mangaUrl);
            if (index > -1) selectedMangas.splice(index, 1);
        }
    });
}

function addSelectAllButton(selectedMangas) {
    const selectAllButton = createButton("Select All", "fixed", "20px", "right:20px;", "#b34141");
    let isAllSelected = false;

    selectAllButton.addEventListener("click", () => {
        const checkboxes = document.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach((checkbox) => {
            const thumb = checkbox.closest(".inner_thumb");
            const mangaUrl = thumb.querySelector("a")?.href;
            checkbox.checked = !isAllSelected;
            thumb.style.opacity = !isAllSelected ? "0.5" : "1";
            if (!isAllSelected && mangaUrl && !selectedMangas.includes(mangaUrl)) {
                selectedMangas.push(mangaUrl);
            } else if (mangaUrl) {
                const index = selectedMangas.indexOf(mangaUrl);
                if (index > -1) selectedMangas.splice(index, 1);
            }
        });
        isAllSelected = !isAllSelected;
        selectAllButton.innerText = isAllSelected ? "Deselect All" : "Select All";
    });

    document.body.appendChild(selectAllButton);
}

function addDownloadButton(selectedMangas) {
    const downloadButton = createButton("Download", "fixed", "20px", "left:20px;", "#888", true);

    downloadButton.addEventListener("click", () => {
        console.log("Downloading:", selectedMangas);
        selectedMangas.forEach((url) => {
            const link = document.createElement("a");
            link.href = url;
            link.target = "_blank";
            link.click();
        });
    });

    const updateDownloadState = () => {
        if (selectedMangas.length > 0) {
            downloadButton.disabled = false;
            downloadButton.style.backgroundColor = "#4CAF50";
            downloadButton.style.cursor = "pointer";
            downloadButton.style.opacity = "1";
        } else {
            downloadButton.disabled = true;
            downloadButton.style.backgroundColor = "#888";
            downloadButton.style.cursor = "not-allowed";
            downloadButton.style.opacity = "0.5";
        }
    };

    document.body.appendChild(downloadButton);

    const push = selectedMangas.push;
    selectedMangas.push = function (...args) {
        const result = push.apply(this, args);
        updateDownloadState();
        return result;
    };

    const splice = selectedMangas.splice;
    selectedMangas.splice = function (...args) {
        const result = splice.apply(this, args);
        updateDownloadState();
        return result;
    };

    updateDownloadState();
}


function createButton(text, position, bottom, cssRightOrLeft, color, disabled = false) {
    const button = document.createElement("button");
    button.innerText = text;
    button.style.cssText = `
        position: fixed;
        bottom: ${bottom};
        ${cssRightOrLeft};
        z-index: 9999;
        padding: 10px 20px;
        background-color: ${color};
        color: #fff;
        border: none;
        border-radius: 5px;
        cursor: ${disabled ? "not-allowed" : "pointer"};
        opacity: ${disabled ? "0.5" : "1"};
    `;
    button.disabled = disabled;
    return button;
}

