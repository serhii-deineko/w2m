async function getSelected(tab) {
    return new Promise(async (resolve) => {
        let data = await chrome.scripting.executeScript({
            target: {tabId: tab},
            function: () => [
                document.querySelector("div[class*=\"selected\"]")?.innerText
            ],
        });
        resolve(data[0].result[0]);
    });
}

async function getImages(service, images) {
    return new Promise(async (resolve) => {
        let inserted = [];
        let words = service.split(" ");
        for (let image of images) {
            let services = [];
            for (let word of words) {
                if (!_ignored.services.some(ignor => word.toLowerCase().includes(ignor))) {
                    services.push(word);
                }
            }
            if (services.some(word => {
                    return image.toLowerCase().trim().replace(/(s|ing|&)/g, "").includes(
                        word.toLowerCase().trim().replace(/(s|ing|&)/g, ""))
            })) {
                inserted.push(image);
            }
        }
        resolve(inserted);
    });
}

async function insertImages(images, service) {
    for (let image of images) {
        document.body.insertAdjacentHTML("afterbegin", `
            <div class="cover"><img src="https://localhost/Stock%20Photos/${image.replace("webp", "jpg")}"></div>
        `);
    }
    document.body.addEventListener("click", (image) => {
        uploadPhoto(service, image.target.src);
    })
}

function uploadPhoto(service, url) {
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
        chrome.tabs.sendMessage(tab.id, { type: "uploadPhoto", service, url });
    });
}

async function insertAlert(tab) {
    await chrome.scripting.executeScript({
        target: {tabId: tab},
        function: () => [
            window.alert("К сожалению, сохранение пинов из данного домена невозможно. Со всеми вопросами обращайтесь к администратору веб-сайта.")
        ],
    });
}

async function getFiles(reader, allEntries) {
    return new Promise((resolve) => {
        reader.readEntries((entries) => {
            if (entries.length > 0) {
                allEntries = allEntries.concat(entries);
                getFiles(reader, allEntries).then(resolve);
            } else {
                let fileNames = [];
                for (let entry of allEntries) {
                    if (entry.isFile) {
                        fileNames.push(entry.name);
                    }
                }
                resolve(fileNames);
            }
        });
    })
}

chrome.tabs.query({active: true, currentWindow: true}, ([tab]) => {
    if (/int.prophone.com/.test(tab.url) && /services|photos/.test(tab.url)) {
        chrome.runtime.getPackageDirectoryEntry((root) => {
            root.getDirectory("Stock Photos", {}, async (folder) => {
                let reader = folder.createReader();
                let files = await getFiles(reader, []);
                let service = await getSelected(tab.id);
                let images = await getImages(service, files);
                insertImages(images, service);
            });
        });          
    } else {
        window.close();
        insertAlert(tab.id);
    }
});