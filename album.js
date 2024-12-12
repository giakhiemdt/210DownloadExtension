const thumbsContainer = document.querySelector("body > div.overlay > div > div.row.galleries > div.thumbs_container");
console.log("Hello");

const selectedMangas = []; 
if (thumbsContainer) {
    const thumbsElement = [...thumbsContainer.getElementsByClassName("thumb")];
    if (thumbsElement.length > 0) {

        thumbsElement.forEach((thumbElement) => {
            addTickButton(thumbElement.querySelector("div.inner_thumb"));
        });

        addSelectAll();
        addDownloadButton();

        // const mangaUrls = thumbsElement.map(thumb => {
        //     const link = thumb.querySelector("div.inner_thumb > a");
        //     return link ? link.href : null;
        // }).filter(url => url !== null);

    }
}

function addTickButton(thumb) {
    const checkboxContainer = document.createElement('div');
    checkboxContainer.style.position = 'absolute';
    checkboxContainer.style.top = '10px';
    checkboxContainer.style.right = '10px';
    checkboxContainer.style.zIndex = '100';

    const tickCheckbox = document.createElement('input');
    tickCheckbox.type = 'checkbox';
    tickCheckbox.style.width = '20px';
    tickCheckbox.style.height = '20px';
    tickCheckbox.style.margin = '0';

    const checkboxLabel = document.createElement('label');
    checkboxLabel.style.display = 'block';
    checkboxLabel.style.position = 'absolute';
    checkboxLabel.style.top = '10px';
    checkboxLabel.style.right = '10px';
    checkboxLabel.style.zIndex = '99';
    checkboxLabel.style.width = '20px';
    checkboxLabel.style.height = '20px';

    tickCheckbox.addEventListener('change', (event) => {
        const mangaUrl = thumb.querySelector('a') ? thumb.querySelector('a').href : null;
        if (event.target.checked) {
            console.log('Manga selected:', mangaUrl);
            thumb.style.opacity = '0.5';
            if (mangaUrl && !selectedMangas.includes(mangaUrl)) {
                selectedMangas.push(mangaUrl);
            }
        } else {
            thumb.style.opacity = '1';
            if (mangaUrl) {
                const index = selectedMangas.indexOf(mangaUrl);
                if (index > -1) selectedMangas.splice(index, 1);
            }
        }
        console.log('Selected Mangas:', selectedMangas);
    });

    checkboxLabel.appendChild(tickCheckbox);

    thumb.style.position = 'relative';

    thumb.appendChild(checkboxLabel);
}

function addSelectAll() {
    const selectAllButton = document.createElement('button');
    selectAllButton.innerText = "Select All";
    selectAllButton.style.position = "fixed";
    selectAllButton.style.bottom = "20px";
    selectAllButton.style.right = "20px";
    selectAllButton.style.zIndex = "1000";
    selectAllButton.style.padding = "10px 20px";
    selectAllButton.style.backgroundColor = "#b34141";
    selectAllButton.style.color = "#fff";
    selectAllButton.style.border = "#b34141";
    selectAllButton.style.borderRadius = "5px";
    selectAllButton.style.cursor = "pointer";
    
    selectAllButton.addEventListener('mouseover', () => {
        selectAllButton.style.opacity = '0.65';
    });

    selectAllButton.addEventListener('mouseout', () => {
        selectAllButton.style.opacity = '1';
    });

    let isAllSelected = false; 

    selectAllButton.addEventListener('click', () => {
        const allCheckboxes = document.querySelectorAll('input[type="checkbox"]');

        if (!isAllSelected) {

            allCheckboxes.forEach((checkbox) => {
                if (!checkbox.checked) {
                    checkbox.checked = true;
                    const thumb = checkbox.closest('.inner_thumb');
                    const mangaUrl = thumb.querySelector('a') ? thumb.querySelector('a').href : null;
                    if (thumb) {
                        thumb.style.opacity = '0.5'; 
                    }
                    if (mangaUrl && !selectedMangas.includes(mangaUrl)) {
                        selectedMangas.push(mangaUrl); 
                    }
                }
            });
            selectAllButton.innerText = "Deselect All"; 
            isAllSelected = true;
        } else {
            
            allCheckboxes.forEach((checkbox) => {
                if (checkbox.checked) {
                    checkbox.checked = false;
                    const thumb = checkbox.closest('.inner_thumb');
                    const mangaUrl = thumb.querySelector('a') ? thumb.querySelector('a').href : null;
                    if (thumb) {
                        thumb.style.opacity = '1'; 
                    }
                    if (mangaUrl) {
                        const index = selectedMangas.indexOf(mangaUrl);
                        if (index > -1) {
                            selectedMangas.splice(index, 1); 
                        }
                    }
                }
            });
            selectAllButton.innerText = "Select All"; 
            isAllSelected = false;
        }

        console.log("Selected Mangas:", selectedMangas);
    });

    document.body.appendChild(selectAllButton);
}
function addDownloadButton() {
    const downloadButton = document.createElement('button');
    downloadButton.innerText = "Download";
    downloadButton.style.position = "fixed";
    downloadButton.style.bottom = "20px";
    downloadButton.style.left = "20px";
    downloadButton.style.zIndex = "1000";
    downloadButton.style.padding = "10px 20px";
    downloadButton.style.backgroundColor = "#888";
    downloadButton.style.color = "#fff";
    downloadButton.style.border = "none";
    downloadButton.style.borderRadius = "5px";
    downloadButton.style.cursor = "not-allowed"; 
    downloadButton.style.opacity = "0.5"; 
    downloadButton.disabled = true; 

    downloadButton.addEventListener('mouseover', () => {
        downloadButton.style.opacity = '0.65';
    });

    downloadButton.addEventListener('mouseout', () => {
        downloadButton.style.opacity = '1';
    });

    function updateDownloadButtonState() {
        if (selectedMangas.length > 0) {
            downloadButton.style.backgroundColor = "#4CAF50";
            downloadButton.style.cursor = "pointer";
            downloadButton.style.opacity = "1";
            downloadButton.disabled = false; 
        } else {
            downloadButton.style.backgroundColor = "#888";
            downloadButton.style.cursor = "not-allowed";
            downloadButton.style.opacity = "0.5";
            downloadButton.disabled = true; 
        }
    }

    downloadButton.addEventListener('click', () => {
        if (selectedMangas.length > 0) {
            console.log("Downloading Mangas:", selectedMangas);


            selectedMangas.forEach((url) => {


                const link = document.createElement('a');
                link.href = url;
                link.download = '';
                link.target = '_blank'; 
                link.click();
            });
        }
    });

    document.body.appendChild(downloadButton);

    updateDownloadButtonState();

    const originalPush = selectedMangas.push;
    selectedMangas.push = function (...args) {
        const result = originalPush.apply(this, args);
        updateDownloadButtonState();
        return result;
    };

    const originalSplice = selectedMangas.splice;
    selectedMangas.splice = function (...args) {
        const result = originalSplice.apply(this, args);
        updateDownloadButtonState();
        return result;
    };
}



