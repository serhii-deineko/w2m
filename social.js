class Reviews {

    constructor(social) {
        this.social = social;
        this.link = "";
        this.list = [];
    }

    async scrollPage() {
        let x = 0;
        let scrollHeight = 0;
        let scrollAttempts = 5;
        
        if (this.social === "facebook.com") {
            let count = document.querySelector(_reviews[this.social].count);
            if (count) scrollAttempts = parseInt(count?.innerText.match(/\((\d+)\s/)?.[1]) || 5;
        }

        return new Promise(resolve => {
            let scrolling = () => {
                if (this.social === "google.com") {
                    let button = document.querySelector("div[role=\"main\"] div:nth-child(1) button[data-tab-index=\"1\"]");
                    if (button) button.click();
                }
                let container = document.querySelector(_reviews[this.social].scroll) || document.body;
                if (container) {
                    let y = container.scrollHeight;
                    _reviews[this.social].scroll ? container.scrollTo(0, y) : window.scrollTo(0, y);
                    if (y > scrollHeight || x < scrollAttempts) {
                        x++;
                        scrollHeight = container.scrollHeight;
                        setTimeout(scrolling, 500);
                    } else {
                        resolve();
                    }
                } else {
                    setTimeout(scrolling, 500);
                }
            };
            scrolling();
        });
    }

    async copyReviews() {
        let list = document.querySelectorAll(_reviews[this.social].list);
        for (let review of list) {
            if (_reviews[this.social].more) {
                let more = review.querySelector(_reviews[this.social].more);
                if (more) {
                    await new Promise(resolve => {
                        let observer = new MutationObserver(() => {
                            observer.disconnect();
                            resolve();
                        });
                        observer.observe(review, { childList: true, subtree: true });
                        more.click();
                    });
                }
            }
            let name = review?.querySelector(_reviews[this.social].name)?.innerText;
            if (name == null) {
                name = review?.getAttribute(_reviews[this.social].name);
            }
            let text = review?.querySelector(_reviews[this.social].text)?.innerText;
            if (name && text && !this.isSpam(text) && !this.isDuplicate(name, text) && (!_reviews[this.social].star || this.isPositive(review))) {
                this.list.push({ name, text });
            }
        }
        console.log(this.list);
        await chrome.runtime.sendMessage({ type: "saveReviews", list: this.list });
    }

    isSpam(review) {
        return _ignored.reviews.some(word => review.toLowerCase().includes(word));
    }

    isPositive(review) {
        if (this.social === "homeadvisor.com") {
            return review?.querySelector(_reviews[this.social].star)?.textContent?.split(".")?.[0]?.includes("5") ? true : false;
        } else if (this.social === "bbb.org") {
            return review?.querySelectorAll(_reviews[this.social].star)?.length === 5 ? true : false;
        } else {
            return review?.querySelector(_reviews[this.social].star) ? true : false;
        }
    }

    isDuplicate(name, text) {
        return this.list.some(item => item.name === name && item.text === text);
    }
}

class Photos {

    constructor(social) {
        this.social = social;
        this.link = "";
        this.hash = "";
        this.spaceKeyPressed = false;
    }

    async insertMenu(storage) {
        let { services, photos, selected } = storage;
        if(!document.body || !services || !photos || !selected) return;
        
        document.body.insertAdjacentHTML("beforebegin", `
            <div id="servicesMenu">
                <ul>
                    <li>
                        <span>Logo</span>
                        <ul>
                            ${li("logo", "", "Logo")}
                        </ul>
                    </li>
                    <li>
                        <span>Photos</span>
                        <ul>
                            ${Object.keys(photos).map((value, index) => li("photo", index, value)).join("\n")}
                        </ul>
                    </li>
                    <li>
                        <span>Services</span>
                        <ul>
                            ${Object.keys(services).map((value, index) => li("service", index, value)).join("\n")}
                        </ul>
                    </li>
                </ul>
            </div>
        `);

        function li(name, index, value) {
            return `
                <li>
                    <input id="${name + index}" type="radio" name="service" value="${value}" ${(value === selected) ? "checked" : ""}>
                    <label data-counter="0" for="${name + index}"><span>${value}</span></label>
                    ${(name === "service") ? a(value) : "<a></a>"}
                </li>
            `;

            function a(value) {
                return `<a href="https://google.com/search?tbm=isch&q=${value} Services" target="_blank"><svg fill="currentColor" viewBox="0 0 16 16" width="1em" height="1em" class="x1lliihq x1k90msu x2h7rmj x1qfuztq xcza8v6 xlup9mm x1kky2od"><g fill-rule="evenodd" transform="translate(-448 -544)"><g fill-rule="nonzero"><path d="M10.743 2.257a6 6 0 1 1-8.485 8.486 6 6 0 0 1 8.485-8.486zm-1.06 1.06a4.5 4.5 0 1 0-6.365 6.364 4.5 4.5 0 0 0 6.364-6.363z" transform="translate(448 544)"></path><path d="M10.39 8.75a2.94 2.94 0 0 0-.199.432c-.155.417-.23.849-.172 1.284.055.415.232.794.54 1.103a.75.75 0 0 0 1.112-1.004l-.051-.057a.39.39 0 0 1-.114-.24c-.021-.155.014-.356.09-.563.031-.081.06-.145.08-.182l.012-.022a.75.75 0 1 0-1.299-.752z" transform="translate(448 544)"></path><path d="M9.557 11.659c.038-.018.09-.04.15-.064.207-.077.408-.112.562-.092.08.01.143.034.198.077l.041.036a.75.75 0 0 0 1.06-1.06 1.881 1.881 0 0 0-1.103-.54c-.435-.058-.867.018-1.284.175-.189.07-.336.143-.433.2a.75.75 0 0 0 .624 1.356l.066-.027.12-.061z" transform="translate(448 544)"></path><path d="m13.463 15.142-.04-.044-3.574-4.192c-.599-.703.355-1.656 1.058-1.057l4.191 3.574.044.04c.058.059.122.137.182.24.249.425.249.96-.154 1.41l-.057.057c-.45.403-.986.403-1.411.154a1.182 1.182 0 0 1-.24-.182zm.617-.616.444-.444a.31.31 0 0 0-.063-.052c-.093-.055-.263-.055-.35.024l.208.232.207-.206.006.007-.22.257-.026-.024.033-.034.025.027-.257.22-.007-.007zm-.027-.415c-.078.088-.078.257-.023.35a.31.31 0 0 0 .051.063l.205-.204-.233-.209z" transform="translate(448 544)"></path></g></g></svg></a>`;
            }
        }
    }

    async mouseOver(event) {
        let div = event.target.closest(_services[photos.social].photo);
        if (!div) return;

        let keyDown = (key) => {
            key.preventDefault();
            if (key.code === "Space") {
                this.spaceKeyPressed = true;
                div.querySelector("a").click();
                document.querySelector("#servicesMenu input:checked + label").setAttribute("style", "transform: translateX(0)");
                document.addEventListener("keydown", (key) => {
                    key.preventDefault();
                    if (key.code === "Space") {
                        document.querySelector("#servicesMenu input:checked + label").removeAttribute("style");
                        document.querySelector(_services[photos.social].close).click();
                    }
                }, { once: true });
            }
        }
    
        let keyUp = (key) => {
            if (key.code === "Space") {
                this.spaceKeyPressed = false;
            }
        }

        document.addEventListener("keydown", keyDown);
        document.addEventListener("keyup", keyUp);

        this.addEventListener("mouseout", () => {
            let div = event.target.closest(_services[photos.social].photo);
            if (!div) return;

            document.removeEventListener("keydown", keyDown);
            document.removeEventListener("keyup", keyUp);
            this.spaceKeyPressed = false;
        });
    }

    async mouseClick(event) {
        event.preventDefault();
        
        let div = event.target.closest(_services[photos.social].photo);
        if(!div && photos.social === "instagram") {
            div = event.target.closest("._aarf");
        }
        if (!div || this.spaceKeyPressed) return;

        let input = document.querySelector("#servicesMenu input:checked");
        await chrome.storage.local.set({ "selected": input.value });

        if (["Logo", "About Us Photo"].includes(input.value)) {
            let link = document.querySelector(`[data-service*="${input.value}"]`);
            if (link) {
                let data = JSON.parse(link.getAttribute("data-service")) || [];
                data = data.filter(item => item !== input.value);
                insertDataList(data, link);
            }
        }

        let link = div.querySelector("[role=\"link\"]");
        let label = document.querySelector("#servicesMenu input:checked + label");
        let counter = parseInt(label.getAttribute("data-counter"));
        let data = JSON.parse(link.getAttribute("data-service")) || [];
        
        if (data && data.length > 0) {
            if (data.find(item => item === input.value)) {
                data = data.filter(item => item !== input.value);

                label.setAttribute("data-counter", --counter);
                insertDataList(data, link);
                return;
            } else {
                data.push(input.value);
                label.setAttribute("data-counter", ++counter);
                insertDataList(data, link);
            }
        } else {
            data.push(input.value);
            label.setAttribute("data-counter", ++counter);
            insertDataList(data, link);
        }
        
        if (photos.social === "facebook.com") {
            await chrome.runtime.sendMessage({ type: "createTab", link: `${link.href + photos.hash}`, active: false });
        } else if (photos.social === "instagram") {
            await chrome.runtime.sendMessage({ type: "createTab", link: `${div.querySelector("img").src + photos.hash}`, active: false });
        }

        function insertDataList(list, link) {
            let ul = link.querySelector("ul");
            if (ul) ul.remove();
            
            link.setAttribute("data-service", JSON.stringify(list));
            link.insertAdjacentHTML("afterbegin", `<ul>${list.map(service => `<li>${service}</li>`).join("")}</ul>`);
        }
    }
}