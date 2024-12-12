const url = "https://m9.imhentai.xxx/028/7zfy536w10/42.webp";

chrome.runtime.sendMessage({
    action: "downloadImage",
    url: url,
    filename: "Downloads/test/test.webp"
});