const button = document.querySelector("#dl_new");
const loadAll = document.querySelector("#load_all");

const imageTypeList = [".jpg", ".webp"];

if (button) {
    button.addEventListener("click", async (event) => {
        event.preventDefault();
        event.stopImmediatePropagation();

        if (loadAll) {
            loadAll.click();
        }

        setTimeout(async () => {
            const thumbs = document.querySelector("#append_thumbs");

            if (thumbs) {
                const imgElements = [...thumbs.querySelectorAll("img")];
                if (imgElements.length > 0) {

                    for (const type of imageTypeList) {
                        console.log("Checking image type for:", imgElements[0].getAttribute('data-src').replace('t.jpg', ''));

                        const response = await checkImageType(imgElements[0].getAttribute('data-src').replace('t.jpg', ''), type);
                        
                        if (response.status === "true") {
  
                            imgElements.forEach((img) => {
                                const imageUrl = img.getAttribute('data-src') || img.src;

                                if (imageUrl) {
                                    const clearUrl = imageUrl.replace('t.jpg', type);  // Hoặc sử dụng loại ảnh đã kiểm tra được
                                    const filename = clearUrl.match(/\/(\d+)\.(jpg|jpeg|webp)$/)[1] + type;
                                    console.log("Image URL: " + clearUrl + " | Name: " + filename);

                                    chrome.runtime.sendMessage({
                                        action: "downloadImage",
                                        url: clearUrl,
                                        filename: filename
                                    });
                                } else {
                                    console.log("No image URL found");
                                }
                            });
                            
                            break; 
                        }
                    }

                    
                }
            }
        }, (1000));

        console.log("Nihao ma!");
    });
}

async function checkImageType(url, type) {
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({
            action: "checkImageType",
            url: url,
            type: type
        }, (response) => {
            resolve(response);
        });
    });
}