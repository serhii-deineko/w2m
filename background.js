async function getProphoneTab(prophone = "int.prophone.com") {
    let tabs = await chrome.tabs.query({});
    for (let tab of tabs) {
        if (tab.url.includes(prophone)) return tab.id;
    }
    return null;
}

chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
    switch (request.type) {
        case "createTab": {
            try {
                await chrome.tabs.create({ 
                    url: (request.link.includes("https://")) ? request.link : `https://${request.link}`, 
                    active: request.active, 
                    index: ++sender.tab.index,
                });
            } catch (error) {
                console.error(error);
            }
            break;
        }
        case "saveReviews": {
            try {
                let storage = await chrome.storage.local.get("prophone");
                let tab = await getProphoneTab(storage.prophone);
                
                await chrome.tabs.update(tab, { active: true });
                await chrome.tabs.remove(sender.tab.id);
                await chrome.tabs.sendMessage(tab, { type: "pasteReviews", reviews: request.list });
            } catch (error) {
                console.error(error);
            }
            break;
        }
        case "uploadPhoto": {
            try {
                chrome.tabs.remove(sender.tab.id);

                let storage = await chrome.storage.local.get(["services", "photos", "selected", "prophone"]);
                if (storage.selected !== "Logo") {
                    if (["About Us Photo", "Hero Images", "All Photos"].includes(storage.selected)) {
                        if (storage.selected === "About Us Photo") {
                            storage.photos[storage.selected] = [];
                        }
                        storage.photos[storage.selected].push(request.src);
                        await chrome.storage.local.set({ "photos": storage.photos });
                    } else {
                        storage.services[storage.selected].push(request.src);
                        await chrome.storage.local.set({ "services": storage.services });
                    }
                }

                let filename = request.src.substring(request.src.lastIndexOf("/") + 1).split("?")[0];
                await chrome.downloads.download({ url: request.src, filename: `Services & Photos/${storage.prophone}/${storage.selected}/${filename}` }, (downloadId) => {
                    console.log("download begin, the downId is:" + downloadId);
                });
                
                let tab = await getProphoneTab(storage.prophone);
                await chrome.tabs.sendMessage(tab, { type: "uploadPhoto", service: storage.selected, url: request.src });
            } catch (error) {
                console.error(error);
            }
            break;
        }
        case "savePhoto": {
            try {
                chrome.tabs.remove(sender.tab.id);
                
                let storage = await chrome.storage.local.get(["logo", "services", "photos", "selected", "prophone"]);
                if (storage.selected !== "Logo") {
                    if (["About Us Photo", "Hero Images", "All Photos"].includes(storage.selected)) {
                        if (storage.selected === "About Us Photo") {
                            storage.photos[storage.selected] = [];
                        }
                        storage.photos[storage.selected].push(request.src);
                        await chrome.storage.local.set({ "photos": storage.photos });
                    } else {
                        storage.services[storage.selected].push(request.src);
                        await chrome.storage.local.set({ "services": storage.services });
                    }
                } else {
                    await chrome.storage.local.set({ "logo": request.src });
                }

                let filename = request.src.substring(request.src.lastIndexOf("/") + 1).split("?")[0];
                await chrome.downloads.download({ url: request.src, filename: `Services & Photos/${storage.prophone}/${storage.selected}/${filename}` }, (downloadId) => {
                    console.log("download begin, the downId is:" + downloadId);
                });
            } catch (error) {
                console.error(error);
            }
            break;
        }
        case "companyName": {
            try {
                chrome.tabs.remove(sender.tab.id);
                
                let storage = await chrome.storage.local.get("prophone");
                let tab = await getProphoneTab(storage.prophone);
                await chrome.tabs.sendMessage(tab, { type: "companyName", companyName: request.company });
            } catch (error) {
                console.error(error);
            }
            break;
        }
        default: console.error("Unknown request type:", request.type);
    }
});


let changeStatus = [];
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (changeInfo.status === "loading" && /#offline|#reviews|#services|#company/.test(tab.url)) {
        changeStatus.push(changeInfo.status);
        if (changeStatus.length > 1) {
            changeStatus = [];
            return;
        }
        await chrome.tabs.sendMessage(tabId, { type: "onUpdated", url: tab.url });
    } else if (changeInfo.status === "complete" && /int.prophone.com/.test(tab.url) && /\.com\/$|basicInfo|faqs|services|photos|reviews/.test(tab.url)) {
        await chrome.tabs.sendMessage(tabId, { type: "onUpdated", url: tab.url });
    } else if (changeInfo.status === "complete" && /facebook.com|instagram/.test(tab.url) && /#save|#upload/.test(tab.url)) {
        await chrome.tabs.sendMessage(tabId, { type: "onUpdated", url: tab.url });
    }
});

chrome.runtime.onConnect.addListener(port => {
    switch (port.name) {
        case "shortLink": {
            port.onMessage.addListener(request => {
                if (request.type === "unShort") {
                    chrome.tabs.create({ 
                        url: (request.link.includes("https://")) ? request.link : `https://${request.link}`, 
                        active: request.active,
                        index: ++port.sender.tab.index,
                    }, tab => {
                        let interval = setInterval(async () => {
                            let current = await chrome.tabs.get(tab.id);
                            if (current.url !== "") {
                                clearInterval(interval);
                                chrome.tabs.remove(current.id);
                                port.postMessage({ link: current.url });
                            }
                        }, 100);
                    });
                }
            });
            break;
        }
        default: console.error("Unknown port name:", port.name);
    }
});