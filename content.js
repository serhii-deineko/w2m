let prophone = new Prophone();
let reviews = {}, photos = {};

chrome.runtime.onMessage.addListener(async (request) => {
    switch (request.type) {
        case "onUpdated": {
            executeScript(request.url);
            break;
        }
        case "pasteReviews": {
            initLove(request.reviews.length);
            prophone.pasteReviews(request.reviews);
            break;
        }
        case "uploadPhoto": {
            prophone.asynchronous.push(request);

            if (prophone.asynchronous.length === 1) {
                executeAsynchronous();
            }
            break;
        }
        case "companyName": {
            document.querySelector("#prophoneMenu input").value = ucfirst(request.companyName).trim();
            break;
        }
        default: console.error("Unknown request type:", request.type);
    }
});

async function executeScript(url) {

    if (_socials.some(social => url.includes(social))) {

        let social = _socials.find(social => url.includes(social));
        if (/#review/.test(url)) {

            reviews = new Reviews(social);
            reviews.scrollPage().then(() => reviews.copyReviews());

        } else if (/#offline|#services|\?services/.test(url)) {

            photos = new Photos(social);
            photos.hash = (/#offline/).test(url) ? "#save" : "#upload";

            await chrome.storage.local.get(["services", "photos", "selected"], (storage) => {

                injectHTML("#servicesMenu", {
                    inject: () => document.body.setAttribute("data-services", social),
                    outject: () => photos.insertMenu(storage),
                });

                injectHTML(_services[social].gallery, {
                    inject: (gallery) => {
                        gallery.addEventListener("mouseover", photos.mouseOver);
                        gallery.addEventListener("click", photos.mouseClick);
                    },
                });
            });
        } else if (/#save/.test(url)) {
    
            injectHTML(_services[social].upload, { 
                inject: async (image) => await chrome.runtime.sendMessage({ type: "savePhoto", src: image.src }),
            });
        } else if (/#upload/.test(url)) {
    
            injectHTML(_services[social].upload, { 
                inject: async (image) => await chrome.runtime.sendMessage({ type: "uploadPhoto", src: image.src }),
            });
        } else if (/#company/.test(url)) {
            
            injectHTML(_basicInfo[social].company, { 
                inject: async (title) => await chrome.runtime.sendMessage({ type: "companyName", company: title.textContent }),
            });
        }
    } else if (/int.prophone.com\/photos/.test(url)) {
        await chrome.storage.local.get(["services", "photos"], (storage) => {
        
            injectHTML("#servicesMenu", {
                inject: (servicesMenu) => servicesMenu.addEventListener("click", prophone.uploadServices),
                outject: () => prophone.insertMenu(storage),
            });
        });
    }
}

document.addEventListener("keydown", (event) => {
    let location = window.location.href.match(/\.com\/$|basicInfo|faqs|services|reviews/)?.[0];
    if (location && event.code === "Tab") {
        event.preventDefault();

        let prophoneMenu = document.querySelector("#prophoneMenu");
        if(!prophoneMenu) {
            injectMenu(location);
        } else {
            prophoneMenu.remove();
        }
    }
});

async function injectMenu(location) {
    let prophoneMenu = `<div id="prophoneMenu">${_prophone[location]}</div>`;
    document.body.insertAdjacentHTML("beforebegin", prophoneMenu);

    if (/\.com\//.test(location)) {
        
        document.querySelector("#prophoneMenu textarea").addEventListener("paste", async (event) => {
            let sheet = (event.clipboardData || window.clipboardData).getData("text");
            await chrome.storage.local.set({ "sheet": sheet });

            if (sheet.includes("facebook.com")) {
                createInterval("#prophoneMenu textarea", "button[name=\"facebook.com\"]");
            } else if (sheet.includes("instagram")) {
                createInterval("#prophoneMenu textarea", "button[name=\"instagram\"]");
            }
        });
        
    } else if (/basicInfo/.test(location)) {

        document.querySelector("#prophoneMenu textarea").addEventListener("paste", async (event) => {
            let sheet = (event.clipboardData || window.clipboardData).getData("text");
            await chrome.storage.local.set({ "sheet": sheet });
            prophone.getBasicInfo();
        });
        
        let interval = setInterval(() => {
            let input = document.querySelector("#prophoneMenu input");
            let textarea = document.querySelector("#prophoneMenu textarea");
            if (!input || !textarea) {
                clearInterval(interval);
            } else if (input?.value === "" || textarea?.value === "") {
                document.querySelector("#basic-info").classList.add("disable");
            } else {
                document.querySelector("#basic-info").classList.remove("disable");
            }
        }, 500);

    } else if (/services/.test(location)) {
        let storage = await chrome.storage.local.get(["logo", "services", "photos"]);
        let photosList = [];
        
        if (storage.logo || storage.services || storage.photos) {
            document.querySelector("#paste-services").classList.remove("disable");
            
            if (storage.logo) photosList.push("Logo");
            if (storage.services) photosList.push(...Object.keys(storage.services));
            if (storage.photos) photosList.push(...Object.keys(storage.photos));
            
            if (photosList.length > 0) {
                let photos = document.querySelector("#prophoneMenu .photos");
                photos.innerHTML = `<ul>${photosList.map(photos => `<li>${photos}</li>`).join("")}</ul>`;
            }
        }

        createInterval("#prophoneMenu textarea", "#add-services");

    } else if (/faqs/.test(location)) {
        await document.querySelector("a[href*=\"basicInfo\"]").click();
        await new Promise(resolve => setTimeout(resolve, 100));

        let faqs = document.querySelector(".App div:nth-child(2) > div > div > label:first-child > input");
        document.querySelector("#prophoneMenu input").value = faqs?.value;

        await document.querySelector("a[href*=\"faqs\"]").click();
        await new Promise(resolve => setTimeout(resolve, 100));

    } else if (/reviews/.test(location)) {
        await document.querySelector("a[href*=\"basicInfo\"]").click();
        await new Promise(resolve => setTimeout(resolve, 100));

        for (let social of _socials) {
            if (social != "instagram") {
                let input = document.querySelector(`input[value*=\"${social}\"]`)?.value;
                if (social === "goo.gl") {
                    social = "google.com";
                }
                document.querySelector(`#prophoneMenu input[name="${social}"]`).value = input ?? "";
                createInterval(`input[name="${social}"]`, `button[name="${social}"]`, true);
            }
        }

        await document.querySelector("a[href*=\"reviews\"]").click();
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    function createInterval(input, button, parentNode = false) {
        let interval = setInterval(() => {
            let field = document.querySelector(input);
            if (!field) {
                clearInterval(interval);
            } else if (field?.value === "") {
                (parentNode) 
                    ? document.querySelector(button).parentNode.classList.add("disable")
                    : document.querySelector(button).classList.add("disable");
            } else {
                (parentNode) 
                    ? document.querySelector(button).parentNode.classList.remove("disable")
                    : document.querySelector(button).classList.remove("disable");
            }
        }, 100);
    }

    document.querySelector("#prophoneMenu").addEventListener("click", listenMenu)
}

async function listenMenu(event) {
    let button = event.target.closest("button");
    if(!button) return;

    event.preventDefault();
    event.stopImmediatePropagation();

    let prophoneMenu = document.querySelector("#prophoneMenu");
    let input = prophoneMenu.querySelector("input");
    let textarea = prophoneMenu.querySelector("textarea");
    
    switch(button.id) {
        case "basic-info": prophone.setBasicInfo(input?.value); break;
        case "company-name": prophone.replaceCompany(input?.value); break;
        case "create-services": prophone.createServices(); break;
        case "delete-services": prophone.deleteServices(); break;
        case "remove-photos": prophone.removeImages(); break;
        case "add-services": prophone.addServices(textarea?.value); break;
        case "paste-services": prophone.pasteServices(); break;
        case "social-reviews": prophone.grabReviews(button.name); break;
        case "social-services": prophone.grabServices(button.name); break;
        default: return;
    }

    await new Promise(resolve => setTimeout(resolve, 100));
    document.querySelector("#prophoneMenu").remove();
}