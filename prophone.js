class Prophone {

    constructor() {
        this.asynchronous = [];
        this.sheet = [];
    }
    
    getProphone() {
        let segments = window.location.href.split("/");
        return segments[segments.length - 1];
    }
    
    async getLink() {
        return new Promise(async (resolve) => {
            let page = document.querySelector("a[aria-current=\"page\"]:not([href=\"/\"])");
            await document.querySelector("a[href*=\"basicInfo\"]").click();
            await new Promise(resolve => setTimeout(resolve, 100));
    
            let input = document.querySelector(`input[value*=\"${prophone.social}\"]`);
            if (!input && prophone.social === "google.com") {
                input = document.querySelector(`input[value*=\"goo.gl\"]`);
                if (input) {
                    prophone.link = await unShortLink(input.value);
                } else {
                    prophone.link = prompt("Солнышко, не могу взять ссылку - у меня лапки 🐾 Попробуй вставить её сюда: ");
                    if (prophone.link.includes("goo.gl")) {
                        prophone.link = await unShortLink(prophone.link);
                    }
                }
            } else if (!input) {
                prophone.link = prompt("Солнышко, не могу взять ссылку - у меня лапки 🐾 Попробуй вставить её сюда: ");
            } else if (input) {
                prophone.link = input.value;
            } 
            await page.click();
            resolve(prophone.link);
        });
    }

    async getPhotosLink() {
        let link = await prophone.getLink();
        if (prophone.social === "facebook.com") {
            prophone.link = link.includes("profile.php") ? `${link}&sk=photos` : `${link}/photos`;
        }
        return prophone.link.replace(/([^:])\/\//g, "$1/") + "#services";
    }

    async getReviewsLink() {
        let input = document.querySelector(`#prophoneMenu input[name=\"${prophone.social}\"]`);
        if (!input && prophone.social === "google.com") {
            input = document.querySelector(`#prophoneMenu input[name=\"goo.gl\"]`);
            if (input) {
                prophone.link = await unShortLink(input.value);
            } else {
                prophone.link = prompt("Солнышко, не могу взять ссылку - у меня лапки 🐾 Попробуй вставить её сюда: ");
                if (prophone.link.includes("goo.gl")) {
                    prophone.link = await unShortLink(prophone.link);
                }
            }
        } else if (!input) {
            prophone.link = prompt("Солнышко, не могу взять ссылку - у меня лапки 🐾 Попробуй вставить её сюда: ");
        } else if (input) {
            prophone.link = input.value;
        } 
        
        if (prophone.social === "facebook.com") {
            prophone.link = prophone.link.includes("profile.php") ? `${prophone.link}&sk=reviews` : `${prophone.link}/reviews`;
        } else if (prophone.social === "bbb.org") {
            prophone.link = `${prophone.link}/customer-reviews`;
        }
        return prophone.link.replace(/([^:])\/\//g, "$1/") + "#reviews";
    }

    async createServices() {
        let storage = await chrome.storage.local.get("sheet");
        let sheetArray = storage.sheet.split("\t");
        let socialLink = sheetArray[7].match(/https?:\/\/\S*/)?.[0].replace(/\/$/, "");
        if (socialLink.includes("facebook")) {
            socialLink = socialLink.includes("profile.php") ? `${socialLink}&sk=photos` : `${socialLink}/photos`;
        }

        let photosArray = Object.keys(_prophone.photos);
        let photosList = {};
        for (let service of photosArray) {
            photosList[service] = [];
        }

        let servicesArray = await prophone.parseServices(sheetArray[12]);
        let servicesList = {};
        if (sheetArray[12].toLowerCase().includes("default")) {
            let defaultIndustry = Object.keys(_default).find(def => {
                return def.toLowerCase().trim().replace(/(s|ing|&)/g, "").includes(
                    sheetArray[11].toLowerCase().trim().replace(/(s|ing|&)/g, "")
                )
            });
            if (Object.keys(_default[defaultIndustry]).length !== 0) {
                servicesArray.push(..._default[defaultIndustry]);
            }
        }
        for (let service of servicesArray) {
            servicesList[service] = [];
        }

        let socialSlag = "";
        if (socialLink.includes("facebook")) {
            socialSlag = socialLink.match(/\/([^/]+)\/?$/)?.[1];
        } else if (socialLink.includes("instagram")) {
            socialSlag = socialLink.match(/\/([^/]+)\/[^/]+\/?$/)?.[1];
        }

        await Promise.all([
            new Promise((resolve) => chrome.storage.local.set({ "prophone": socialSlag.replace(/(\.|\\|\/|)/g, "") }, () => resolve())),
            new Promise((resolve) => chrome.storage.local.set({ "logo": "" }, () => resolve())),
            new Promise((resolve) => chrome.storage.local.set({ "photos": photosList }, () => resolve())),
            new Promise((resolve) => chrome.storage.local.set({ "services": servicesList }, () => resolve())),
            new Promise((resolve) => chrome.storage.local.set({ "selected": "Logo" }, () => resolve()))
        ]);
        await chrome.runtime.sendMessage({ type: "createTab", link: socialLink + "#offline", active: true });
    }
    
    async pasteServices() {
        let storage = await chrome.storage.local.get(["logo", "services", "photos"]);
        if (storage.logo != null) {
            await new Promise(async (resolve) => {
                await prophone.selectUploader("Logo");
                await prophone.uploadImage("Logo", storage.logo);
                resolve();
            });
        }
        if (Object.keys(storage.services).length !== 0) {
            await new Promise(async (resolve) => {
                for (let [service, images] of Object.entries(storage.services)) {
                    if (images.length !== 0) {
                        await prophone.addServices(service);
                        await prophone.selectUploader(service);

                        let startLength = document.querySelectorAll("img:not([alt=\"loading\"])")?.length;
                        let finishLength = startLength + images.length;
                        for (let image of images) {
                            await prophone.uploadImage(service, image);
                        }

                        await new Promise(resolve => {
                            let interval = setInterval(async () => {
                                let currentLength = document.querySelectorAll("img:not([alt=\"loading\"])")?.length;
                                if (currentLength === finishLength) {
                                    clearInterval(interval);
                                    resolve();
                                }
                            }, 100);
                        });
                    }
                }
                resolve();
            });
        }
        if (Object.keys(storage.photos).length !== 0) {
            await new Promise(async (resolve) => {
                for (let [service, images] of Object.entries(storage.photos)) {
                    if (images.length !== 0) {
                        await prophone.selectUploader(service);
                        let startLength = document.querySelectorAll("img:not([alt=\"loading\"])")?.length;
                        let finishLength = startLength + images.length;
                        console.log("start: " + startLength);
                        console.log("finish: " + finishLength);
                        for (let image of images) {
                            await prophone.uploadImage(service, image);
                        }
                        await new Promise(resolve => {
                            let interval = setInterval(async () => {
                                let currentLength = document.querySelectorAll("img:not([alt=\"loading\"])")?.length;
                                console.log(service + ": " + currentLength);
                                if (currentLength === finishLength) {
                                    clearInterval(interval);
                                    resolve();
                                }
                            }, 100);
                        });
                    }
                }
                resolve();
            });
        }
    }

    async getBasicInfo() {
        let storage = await chrome.storage.local.get("sheet");
        let sheetArray = storage.sheet.split("\t");
        let socialLink = Object.keys(_basicInfo).find(social => storage.sheet.includes(social));

        await chrome.storage.local.set({ "prophone": prophone.getProphone() });

        if(/goo.gl|instagram/.test(storage.sheet)) {
            socialLink = await unShortLink(storage.sheet.match(/https?:\/\/\S*/)?.[0]);
        } else if (socialLink) {
            socialLink = storage.sheet.match(/https?:\/\/\S*/)?.[0];
        }
        
        if (socialLink) {
            await chrome.runtime.sendMessage({ type: "createTab", link: socialLink + "#company", active: false });
        } else {
            document.querySelector("#prophoneMenu input").value = ucfirst(sheetArray[7].trim());
        }
    }

    async setBasicInfo(companyName) {
        let storage = await chrome.storage.local.get("sheet");
        let sheetArray = storage.sheet.split("\t");
        let fieldsData = {
            // General Info
            "Company Name": companyName.replace(/"/g, ""),
            "Tagline": companyName.replace(/"/g, ""),
            "Industry": uctitle(sheetArray[11]).replace(/"/g, ""),
            "Phone Number": sheetArray[13].replace(/"/g, ""),
            "Email": sheetArray[14].replace(/"/g, ""),
            "About": companyName.replace(/"/g, ""),
            // Social Media
            "Facebook": storage.sheet.match(/facebook\.com\S*(?=\s)/)?.[0],
            "Yelp": storage.sheet.match(/yelp\.com\S*(?=\s)/)?.[0],
            "Google": storage.sheet.match(/google\.com|goo\.gl\S*(?=\s)/)?.[0],
            "NextDoor": storage.sheet.match(/nextdoor\.com\S*(?=\s)/)?.[0],
            "Twitter": storage.sheet.match(/twitter\.com\S*(?=\s)/)?.[0],
            "Instagram": storage.sheet.match(/instagram\.com\S*(?=\s)/)?.[0],
            "Thumbtack": storage.sheet.match(/thumbtack\.com\S*(?=\s)/)?.[0],
            "YouTube": storage.sheet.match(/youtube\.com\S*(?=\s)/)?.[0],
            "TikTok": storage.sheet.match(/tiktok\.com\S*(?=\s)/)?.[0],
            "Better Business Bureau": storage.sheet.match(/bbb\.com\S*(?=\s)/)?.[0],
            "HomeAdvisor": storage.sheet.match(/homeadvisor\.com\S*(?=\s)/)?.[0],
        };

        if (sheetArray[15] === "") {
            await new Promise(async (resolve) => {
                let code = fieldsData["Phone Number"].match(/\d{3}/)?.[0];
                let data = await fetch(`https://localhost/proxy.php?data=https://api.dedolist.com/api/v1/business/area-codes-usa/find?area-code=${code}`);
                data = await data.json();

                fieldsData["License Number"] = `${data.city}, ${data.state}`;
                fieldsData.Address = `${data.city}, ${data.state}`;
                fieldsData.City = data.city;
                fieldsData.State = data.state;
                resolve();
            });
        } else {
            let sheetAddress = ucfirst(sheetArray[15]);
            fieldsData["License Number"] = sheetAddress;
            fieldsData.Address = sheetAddress;
            
            if (sheetAddress.includes(",")) {
                fieldsData.City = sheetAddress.split(",")[0].trim();
                let state = sheetAddress.split(",")[1].trim();
                fieldsData.State = (state.length === 2) ? state.toUpperCase() : state;
            } else {
                fieldsData.City = sheetAddress;
                fieldsData.State = "";
            }
        }

        let labels = document.querySelectorAll(".flex.flex-col.items-start");
        let inputs = {};

        for (let label of labels) {
            let name = Object.keys(fieldsData).find(text => label.textContent.includes(text));
            if (name) inputs[name] = label.querySelector("input, textarea");
        }

        for (let [name, input] of Object.entries(inputs)) {
            if(fieldsData[name]) {
                if (input.tagName === "INPUT") {
                    await injectInput(input, fieldsData[name]);
                } else if (input.tagName === "TEXTAREA") {
                    await injectTextarea(input, fieldsData[name]);
                }
            }
        }

        if (!storage.sheet.includes("facebook.com")) {
            let input = document.querySelector("input[value*=\"facebook\"]");
            if (input) injectInput(input, "");
        }

        for (let label of labels) {
            if (label.textContent.includes("Generate")) {
                await label.querySelector("p:last-child").click();
                await new Promise(resolve => setTimeout(resolve, 500));
                await new Promise(resolve => {
                    let interval = setInterval(async () => {
                        let loading = document.querySelector("img[alt=\"loading\"]");
                        if(!loading) {
                            clearInterval(interval);
                            resolve();
                        }
                    }, 100);
                });
            }
        }

        async function injectInput(input, value) {
            return new Promise(async (resolve) => {
                input.focus();
                input.dispatchEvent(new Event("input", { bubbles: true }));
                input.value = value;
                input.setAttribute("value", value);
                input.dispatchEvent(new Event("input", { bubbles: true }));
                setTimeout(resolve, 100);
            });
        }

        async function injectTextarea(textarea, value) {
            return new Promise(async (resolve) => {
                let newValue = textarea.value.replace(/in  /g, `in ${value}`);
                    newValue = newValue.replace(/in ,/g, `in ${value},`);

                textarea.focus();
                textarea.dispatchEvent(new Event("input", { bubbles: true }));
                textarea.value = newValue;
                textarea.setAttribute("value", newValue);
                textarea.innerText = newValue;
                textarea.dispatchEvent(new Event("input", { bubbles: true }));
                setTimeout(resolve, 100);
            });
        }
    }

    async replaceCompany(companyName) {
        let textareaFields = document.querySelectorAll("textarea");
        textareaFields.forEach(textarea => {
            let faq = textarea.value.replace("COMPANY NAME", companyName.trim());
            return new Promise(async (resolve) => {
                textarea.focus();
                textarea.dispatchEvent(new Event("input", { bubbles: true }));
                textarea.value = faq;
                textarea.setAttribute("value", faq);
                textarea.innerText = faq;
                textarea.dispatchEvent(new Event("input", { bubbles: true }));
                setTimeout(resolve, 100);
            }); 
        });
    }
    
    insertButton(button, selector) {
        let app = document.querySelector(selector);
        if (app) app.insertAdjacentHTML("beforeend", button);
    }
    
    async grabReviews(social) {
        prophone.social = social;

        await chrome.storage.local.set({ "prophone": prophone.getProphone() });
        await chrome.runtime.sendMessage({ type: "createTab", link: await prophone.getReviewsLink(), active: true });
    }

    async pasteReviews(reviews) {
        if (!reviews || reviews.length < 1) return;
        
        let button = document.querySelector(".p-2.w-36.m-3");
        let divsLength = document.querySelectorAll("[data-rbd-droppable-id] > div").length;
        let reviewsLength = (reviews.length > 15) ? 15 : reviews.length;  
              
        for (let x = divsLength; x < reviewsLength; x++) button.click();
        
        await new Promise(resolve => setTimeout(resolve, 100));
        let divs = document.querySelectorAll("[data-rbd-droppable-id] > div");
        
        for (let index = 0; index < divs.length; index++) {
            let div = divs[index];
            if (!reviews[index] || index > 15) continue;
            
            let labels = div.querySelectorAll("label");
            for (let label of labels) {
                if (label.innerText.toLowerCase().includes("name")) {
                    let input = label.querySelector("input");
                    if (reviews[index].name) {
                        input.focus();
                        await new Promise(resolve => setTimeout(resolve, 100));
                        input.dispatchEvent(new Event("input", { bubbles: true }));
                        input.value = ucfirst(reviews[index].name);
                        input.setAttribute("value", ucfirst(reviews[index].name));
                        input.dispatchEvent(new Event("input", { bubbles: true }));
                    }
                }
                if (label.innerText.toLowerCase().includes("review")) {
                    let textarea = label.querySelector("textarea");
                    if (reviews[index].text) {
                        textarea.focus();
                        await new Promise(resolve => setTimeout(resolve, 100));
                        textarea.dispatchEvent(new Event("input", { bubbles: true }));
                        textarea.value = ucfirst(reviews[index].text);
                        textarea.setAttribute("value", reviews[index].text);
                        textarea.innerText = ucfirst(reviews[index].text);
                        textarea.dispatchEvent(new Event("input", { bubbles: true }));
                    }
                }
            }
        }
        
        await new Promise(resolve => setTimeout(resolve, 100));
        if (divsLength > reviewsLength) {
            divs.forEach((div, index) => {
                if(index >= reviewsLength) 
                    div.querySelector(".cursor-pointer").click();
            });
        }
    }

    async getPhotos(storagePhotos) {
        return new Promise(async (resolve) => {
            let photosArray = Object.keys(_prophone.photos);
            let photosList = {};

            for (let service of photosArray) {
                photosList[service] = [];
            }

            // if (storagePhotos && Object.keys(storagePhotos).length !== 0) {
            //     await chrome.storage.local.remove("photos");
            //     for (let [photo, images] of Object.entries(storagePhotos)) {
            //         if(!photosList[photo]) {
            //             photosList[photo] = images || [];
            //         }
            //     }
            // }
            await chrome.storage.local.set({ "photos": photosList });
            resolve();
        });
    }

    async getServices(storageServices) {
        return new Promise(async (resolve) => {
            let servicesApp = document.querySelectorAll(".App > div:nth-child(2) > div:nth-child(1) nav ul ul li");
            let servicesArray = [...Array.from(servicesApp).map(li => li.innerText)];
            let servicesList = {};

            for (let service of servicesArray) {
                servicesList[service] = [];
            }

            // if (storageServices && Object.keys(storageServices).length !== 0) {
            //     await new Promise((resolve) => chrome.storage.local.remove("services", () => resolve()));
            //     for (let [service, images] of Object.entries(storageServices)) {
            //         if (images.length !== 0) {
            //             servicesList[service] = images || [];
            //         }
            //     }
            // }
            await chrome.storage.local.set({ "services": servicesList });
            resolve()
        });
    }

    async grabServices(social) {
        prophone.social = social;

        let selected = document.querySelector("div[class*=\"selected\"], .App nav ul ul li")?.innerText;
        await new Promise(resolve => chrome.storage.local.set({ "selected": selected }, () => resolve()));

        let storage = await chrome.storage.local.get(["prophone", "photos", "services"]);
        if (!storage.prophone || storage.prophone != prophone.getProphone()) {
            
            await new Promise((resolve) => chrome.storage.local.set({ "prophone": prophone.getProphone() }, () => resolve()));
            await new Promise((resolve) => chrome.storage.local.remove("logo", () => resolve()));
            await new Promise((resolve) => chrome.storage.local.remove("photos", () => resolve()));
            await new Promise((resolve) => chrome.storage.local.remove("services", () => resolve()));
        }

        await Promise.all([ prophone.getPhotos(storage.photos), prophone.getServices(storage.services) ]);
        await chrome.runtime.sendMessage({ type: "createTab", link: await prophone.getPhotosLink(), active: true });
    }

    async addServices(services) {
        return new Promise(async (resolve) => {

            await document.querySelector("a[href*=\"basicInfo\"]").click();
            await document.querySelector("a[href*=\"services\"]").click();
            
            let servicesList = await prophone.parseServices(services);
            
            let nullService = document.querySelector(".App nav ul ul li")?.innerText;
                nullService = (nullService === "NEW SERVICE 0") ? true : false;

            let servicesLength = document.querySelectorAll(".App nav ul ul li")?.length || 0;
                servicesLength = (nullService) ? --servicesLength : servicesLength;
    
            let button = document.querySelector(".App .self-center button");
            let length = servicesLength + servicesList.length;
    
            for (let x = servicesLength; x < length; x++) {
                if (nullService) {
                    nullService = false;
                } else {
                    button.dispatchEvent(new MouseEvent("click", { bubbles: true }));
                    await new Promise(resolve => setTimeout(resolve, 50));
                }
        
                let li = document.querySelector(`.App nav ul ul li:nth-child(${x + 1}) > div > div`)
                li.dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));
                await new Promise(resolve => setTimeout(resolve, 50));
        
                let input = li.querySelector("input");
                await new Promise(resolve => setTimeout(resolve, 50));
        
                let service = uctitle(servicesList[x - servicesLength]);
                input.setAttribute("value", service);
                input.value = service;
                input.dispatchEvent(new Event("focusout", { bubbles: true }));
                await new Promise(resolve => setTimeout(resolve, 100));
    
                await new Promise(resolve => {
                    let interval = setInterval(async () => {
                        let loading = document.querySelector("img[alt=\"loading\"]");
                        if(!loading) {
                            clearInterval(interval);
                            resolve();
                        }
                    }, 100);
                });
            }
            resolve();
        });
    }

    async parseServices(inputString) {
        return new Promise(resolve => {
            let servicesArray = inputString.trim().split(/[,+\n]/);
          
            let parsedServices = servicesArray
                .filter(service => service.trim().toLowerCase() !== "default")
                .map(service => service.trim().replace(/\w\S*/g, word => word.charAt(0).toUpperCase() + word.substr(1).toLowerCase()))
                .map(service => service.replace(/['"]+/g, ''));
          
            resolve(parsedServices);
        });
    }

    async deleteServices() {
        try {
            return new Promise(resolve => {
                let interval = setInterval(async () => {
                    let services = document.querySelector(".App nav ul ul li svg");
                    if (services) {
                        services.dispatchEvent(new MouseEvent("click", { bubbles: true }));
                    } else {
                        clearInterval(interval);
                        await document.querySelector("a[href*=\"basicInfo\"]").click();
                        await document.querySelector("a[href*=\"services\"]").click();
                        resolve();
                    }
                });
            })
        } catch (error) {
            console.error(error);
        }
    }

    async removeImages() {
        try {
            let services = document.querySelectorAll(".App nav ul ul li");
            for (let i = 1; i <= services.length; i++) {
                await document.querySelector(`.App nav ul ul li:nth-child(${i}) > div > div`).click();
                await new Promise(resolve => setTimeout(resolve, 50));
                document.querySelector("button[class=\"ml-3\"]").click();
            }

            await document.querySelector("a[href*=\"photos\"]").click();
            await new Promise(resolve => setTimeout(resolve, 100));

            let photos = document.querySelectorAll(".App nav ul ul li div");
            for (let button of photos) {
                if (button.innerText.includes("Hero Images") || button.innerText.includes("All Photos")) {
                    await button.click();
                    await new Promise(resolve => setTimeout(resolve, 50));
                    await new Promise(resolve => {
                        let interval = setInterval(async () => {
                            let image = document.querySelector(".w-8.h-8.mt-2.px-1.cursor-pointer.rounded-full.border-2.border-white.bg-gray-600.flex.justify-center.items-center");
                            if (image) {
                                await image.click();
                            } else {
                                clearInterval(interval);
                                resolve();
                            }
                        }, 10);
                    });
                }
            }
            
            let page = document.querySelector("a[href*=\"services\"]")
            if (page) page.click();
        } catch (error) {
            console.error(error);
        }
    }

    async selectUploader(service) {
        return new Promise(async (resolve) => {
            let currentPage = document.querySelector("a[aria-current=\"page\"]:not([href=\"/\"])");
            let selector = "";
            
            if (service === "Logo") {
                selector = null;
                if (currentPage?.textContent != "Logo") {
                    await document.querySelector("a[href*=\"logo\"]").click();
                }
            } else if (Object.keys(_prophone.photos).some(photos => service.includes(photos))) {
                selector = ".App nav ul ul li div";
                if (currentPage?.textContent != "Photos") {
                    await document.querySelector("a[href*=\"photos\"]").click();
                }
                await new Promise(resolve => setTimeout(resolve, 900));
            } else {
                selector = ".App nav ul ul li div[role=\"button\"] div";
                if (currentPage?.textContent != "Services") {
                    await document.querySelector("a[href*=\"services\"]").click();
                }
            }
            await new Promise(resolve => setTimeout(resolve, 100));

            if (selector) {
                let services = document.querySelectorAll(selector);
                for (let button of services) {
                    if (isPhotos(service, button) || isService(service, button)) {

                        await button.click();
                        await new Promise(resolve => setTimeout(resolve, 100));
                        resolve();
                    }
                }

                function isPhotos(service, button) {
                    return service === "About Us Photo" && button.textContent.includes("Hero Images");
                }

                function isService(service, button) {
                    return button.textContent.toLowerCase().includes(service.toLowerCase());
                }
            } else {
                resolve();
            }
        });
    }

    async uploadImage(service, url) {
        return new Promise(async (resolve) => {
            let image = { url, name: "", type: "" };
            image.name = image.url.substring(image.url.lastIndexOf("/") + 1).split("?")[0];
            image.type = image.name.split(".").pop();
            if (!image) return;

            let input = document.querySelector("input[type=\"file\"][multiple]");
            if (["About Us Photo", "Logo"].includes(service)) {
                input = document.querySelector("input[type=\"file\"]:not([multiple])");
            }
            if (!input) return;

            let response = /instagram/.test(url) ? 
                await fetch(`https://localhost/proxy.php?data=${encodeURIComponent(url)}`) : 
                await fetch(url);
            let data = await response.blob();
            
            let designFile = new File([data], image.name, { type: `image/${image.type}` });
            let dataTransfer = new DataTransfer();
            dataTransfer.items.add(designFile);
            
            input.files = dataTransfer.files;
            input.addEventListener("change", () => resolve());
            input.dispatchEvent(new Event("change", { bubbles: true }));
        });
    }
    
    async insertMenu(storage) {
        let app = document.querySelector(".App > div:nth-child(2)");
        let { services, photos } = storage;
        if(!app || !services || !photos) return;
        
        app.insertAdjacentHTML("afterbegin", `
            <div id="servicesMenu">
                <ul>
                    <li>
                        <span>Photos</span>
                        <ul>
                            ${Object.keys(photos).map((value, index) => li("photo", index, value, photos[value].length)).join("\n")}
                        </ul>
                    </li>
                    <li>
                        <span>Services</span>
                        <ul>
                            ${Object.keys(services).map((value, index) => li("service", index, value, services[value].length)).join("\n")}
                        </ul>
                    </li>
                </ul>
            </div>
        `);

        function li(name, index, value, length) {
            return `
                <li>
                    <input id="${name + index}" type="radio" name="service" value="${value}">
                    <label data-counter="${length}" for="${name + index}"><span>${value}</span></label>
                    <a></a>
                </li>
            `;
        }
    }

    async uploadServices(e) {
        let input = e.target.closest("input");
        if(!input) return;
        
        if (["About Us Photo", "Hero Images", "All Photos"].includes(input.value)) {
            let storage = await chrome.storage.local.get("photos");
            for (let image of Object.values(storage.photos[input.value])) {
                await prophone.uploadImage(input.value, image);
            }
        } else {
            let storage = await chrome.storage.local.get("services");
            for (let image of Object.values(storage.services[input.value])) {
                await prophone.uploadImage(input.value, image);
            }
        }
    }
}