async function injectHTML(selector, { inject, outject, timer = 100, attempts = 100 }) {
    let interval = setInterval(() => {
        let element = document.querySelector(selector);
        if (element) {
            clearInterval(interval);
            if (inject) inject(element);
            return;
        } else if (outject) {
            outject();
        }
        if (attempts <= 0) {
            clearInterval(interval);
            return;
        }
        attempts--;
    }, timer);
}

async function executeAsynchronous() {
    if (prophone.asynchronous.length === 0) return;
    
    let { type, service, url } = prophone.asynchronous[0];
    let selected = document.querySelector("div[class*=\"selected\"]");

    try {
        if (!selected || !selected.innerText.includes(service)) {
            await prophone.selectUploader(service);
        }
        await prophone.uploadImage(service, url);
    } catch (error) {
        console.error(error);
    }

    prophone.asynchronous.shift();
    executeAsynchronous();
}

async function unShortLink(link) {
    return new Promise(resolve => {
        let port = chrome.runtime.connect({ name: "shortLink" });
        port.postMessage({ 
            type: "unShort", 
            link: link, 
            active: false 
        });
        port.onMessage.addListener(response => {
            port.disconnect();
            resolve(response.link);
        });
    });
}

async function getSettings() {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get("popup", (storage) => {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
            } else if (storage.settings) {
                resolve(storage.settings);
            } else {
                chrome.storage.local.set({ "popup": _settings });
                resolve(_settings);
            }
        });
    });
}

async function getStorage(key) {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get([key], (storage) => {
            if (storage[key] === undefined) {
                reject();
            } else {
                resolve(storage[key]);
            }
        });
    });
};

// function insertSelected(service) {
//     let list = [...document.querySelectorAll(`a[data-service*="${service}"] img`)];

//     console.log(list);
// }

function ucfirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function uctitle(str) {
    return str.trim().split(" ").map(word => {
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    }).join(" ");
}

const _prophone = {
    ".com/": `
        <h1 class="font-bold text-lg">Привет, Солнышко! <img src="https://localhost/sun.gif" class="inline h-10 ml-2"></h1>
        <div class="flex flex-row justify-center">
            <div class="flex flex-col w-3/5 m-6">
                <h2 class="font-semibold">Create Services And Photos</h2>
                <textarea class="p-2 mt-4 w-48 rounded-md border-2 border-gray-200 w-full" rows="8" placeholder="Скопируй строку из таблицы сюда ♡"></textarea>
                <div class="flex flex-row items-start mt-2">
                <button id="create-services" name="facebook.com" class="disable font-semibold p-2 w-36 m-3 rounded-full border-2 text-black text-sm bg-gray-500" style="background: #fff;"><span class=\"content\"><span class=\"heart\">💙</span> Facebook</span></button>
                <button id="create-services" name="instagram" class="disable font-semibold p-2 w-36 m-3 rounded-full border-2 text-black text-sm bg-gray-500" style="background: #fff;"><span class=\"content\"><span class=\"heart\">💜</span> Instagram</span></button>
                <button id="create-services" name="yelp.com" class="disable font-semibold p-2 w-36 m-3 rounded-full border-2 text-black text-sm bg-gray-500" style="background: #fff;"><span class=\"content\"><span class=\"heart\">❤️</span> Yelp</span></span></button>
                </div>
            </div>
        </div>
    `,
    "basicInfo": `
        <h1 class="font-bold text-lg">Привет, Солнышко! <img src="https://localhost/sun.gif" class="inline h-10 ml-2"></h1>
        <div class="flex flex-row justify-center">
            <div class="flex flex-col w-3/5 m-6 mt-12">
                <h2 class="font-semibold">Google Sheets</h2>
                <textarea class="p-2 mt-3 mb-3 mt-3 mb-6 w-48 rounded-md border-2 border-gray-200 w-full" rows="8" placeholder="Скопируй строку из таблицы сюда ♡"></textarea>
                <h2 class="font-semibold">Company Name</h2>
                <div class="flex flex-row content-start">
                    <input class="p-2 mt-3 w-3/5 rounded-md border-2 border-gray-200 w-full" value="">
                    <button id="basic-info" class="disable font-semibold p-2 ml-6 mt-3 w-2/5 rounded-full border-2 text-white text-sm bg-gray-500" style="background: #ffffff; color: #000000; font-weight: 600;"><span class=\"content\"><span class=\"heart\">🩶</span> Basic Info</span></button>
                </div>
            </div>
        </div>
    `,
    "services": `
        <h1 class="font-bold text-lg">Привет, Солнышко! <img src="https://localhost/sun.gif" class="inline h-10 ml-2"></h1>
        <div class="flex flex-row justify-between">
            <div class="flex flex-col w-1/2 m-6">
                <h2 class="font-semibold">Services</h2>
                <textarea class="p-2 mt-4 w-48 rounded-md border-2 border-gray-200 w-full h-52" rows="8" placeholder="Скопируй сервисы сюда"></textarea>
                <div class="flex flex-row items-start mt-2">
                    <button id="add-services" class="disable font-semibold p-2 w-36 m-3 rounded-full border-2 text-black text-sm bg-gray-500" style="background: #fff;"><span class=\"content\"><span class=\"heart\">💚</span> Add Services</span></button>
                    <button id="delete-services" class="font-semibold p-2 w-36 m-3 rounded-full border-2 text-black text-sm bg-gray-500" style="background: #fff; width: 165px;"><span class=\"content\"><span class=\"heart\">🖤</span> Delete Services</span></button>
                </div>
            </div>
            <div class="flex flex-col justify-between w-1/2 m-6">
                <h2 class="font-semibold">Photos</h2>
                <div class="photos p-2 mt-4 w-48 rounded-md border-2 border-gray-200 w-full h-52 text-gray-400" style="overflow: scroll;">A нема фоток =(</div>
                <div class="flex flex-row items-start mt-2">
                    <button id="paste-services" class="disable font-semibold p-2 w-36 m-3 rounded-full border-2 text-black text-sm bg-gray-500" style="background: #fff;"><span class=\"content\"><span class=\"heart\">💛</span> Add Photos</span></button>
                    <button id="remove-photos" class="font-semibold p-2 w-36 m-3 rounded-full border-2 text-black text-sm bg-gray-500" style="background: #fff; width: 165px;"><span class=\"content\"><span class=\"heart\">❤️</span> Remove Photos</span></button>
                </div>
            </div>
        </div>
        <div class="flex flex-col m-6">
            <h2 class="font-semibold">Social</h2>
            <div class="flex flex-row items-start mt-2">
                <button id="social-services" name="facebook.com" class="font-semibold p-2 w-36 m-3 rounded-full border-2 text-black text-sm bg-gray-500" style="background: #fff;"><span class=\"content\"><span class=\"heart\">💙</span> Facebook</span></button>
                <button id="social-services" name="instagram" class="font-semibold p-2 w-36 m-3 rounded-full border-2 text-black text-sm bg-gray-500" style="background: #fff;"><span class=\"content\"><span class=\"heart\">💜</span> Instagram</span></button>
                <button id="social-services" name="yelp.com" class="disable font-semibold p-2 w-36 m-3 rounded-full border-2 text-black text-sm bg-gray-500" style="background: #fff;"><span class=\"content\"><span class=\"heart\">❤️</span> Yelp</span></span></button>
            </div>
        </div>
    `,
    "faqs": `
        <h1 class="font-bold text-lg">Привет, Солнышко! <img src="https://localhost/sun.gif" class="inline h-10 ml-2"></h1>
        <div class="flex justify-center">
            <div class="flex flex-col w-1/2 m-6">
                <h2 class="font-semibold">Company Name</h2>
                <div class="flex flex-row justify-center mt-2">
                    <input class="p-2 my-3 mr-3 w-3/5 rounded-md border-2 border-gray-200 w-full" value="">
                    <button id="company-name" class="font-semibold p-2 w-2/5 m-3 rounded-full border-2 text-white text-sm bg-gray-500" style="background: #ffffff; color: #000000; font-weight: 600;"><span class=\"content\"><span class=\"heart\">💛</span> Replace</span></button>
                </div>
            </div>
        </div>
    `,
    "reviews": `
        <h1 class="font-bold text-lg">Привет, Солнышко! <img src="https://localhost/sun.gif" class="inline h-10 ml-2"></h1>
        <div class="flex justify-center">
            <div class="flex flex-col m-6 w-2/3">
                <div class="flex flex-row items-start disable">
                    <input name="facebook.com" class="p-2 mr-3 mt-3 mb-3 w-3/5 rounded-md border-2 border-gray-200 w-full" value="">
                    <button id="social-reviews" name="facebook.com" class="font-semibold p-2 w-2/5 m-3 rounded-full border-2 text-black text-sm bg-gray-500" style="background: #fff;"><span class=\"content\"><span class=\"heart\">💙</span> Facebook</span></button>
                </div>
                <div class="flex flex-row items-start disable">
                    <input name="google.com" class="p-2 mr-3 mt-3 mb-3 w-3/5 rounded-md border-2 border-gray-200 w-full" value="">
                    <button id="social-reviews" name="google.com" class="font-semibold p-2 w-2/5 m-3 rounded-full border-2 text-black text-sm bg-gray-500" style="background: #fff;"><span class=\"content\"><span class=\"heart\">🤍</span> <span style=\"color: #4285F4;\">G</span><span style=\"color: #DB4437;\">o</span><span style=\"color: #F4B400;\">o</span><span style=\"color: #4285F4;\">g</span><span style=\"color: #0F9D58;\">l</span><span style=\"color: #DB4437;\">e</span></span></button>
                </div>
                <div class="flex flex-row items-start disable">
                    <input name="yelp.com" class="p-2 mr-3 mt-3 mb-3 w-3/5 rounded-md border-2 border-gray-200 w-full" value="">
                    <button id="social-reviews" name="yelp.com" class="font-semibold p-2 w-2/5 m-3 rounded-full border-2 text-black text-sm bg-gray-500" style="background: #fff;"><span class=\"content\"><span class=\"heart\">❤️</span> Yelp</span></span></button>
                </div>
                <div class="flex flex-row items-start disable">
                    <input name="nextdoor.com" class="p-2 mr-3 mt-3 mb-3 w-3/5 rounded-md border-2 border-gray-200 w-full" value="">
                    <button id="social-reviews" name="nextdoor.com" class="font-semibold p-2 w-2/5 m-3 rounded-full border-2 text-black text-sm bg-gray-500" style="background: #fff;"><span class=\"content\"><span class=\"heart\">💚</span> NextDoor</span></span></button>
                </div>
                <div class="flex flex-row items-start disable">
                    <input name="thumbtack.com" class="p-2 mr-3 mt-3 mb-3 w-3/5 rounded-md border-2 border-gray-200 w-full" value="">
                    <button id="social-reviews" name="thumbtack.com" class="font-semibold p-2 w-2/5 m-3 rounded-full border-2 text-black text-sm bg-gray-500" style="background: #fff;"><span class=\"content\"><span class=\"heart\">🩵</span> Thumbtack</span></span></button>
                </div>
                <div class="flex flex-row items-start disable">
                    <input name="homeadvisor.com" class="p-2 mr-3 mt-3 mb-3 w-3/5 rounded-md border-2 border-gray-200 w-full" value="">
                    <button id="social-reviews" name="homeadvisor.com" class="font-semibold p-2 w-2/5 m-3 rounded-full border-2 text-black text-sm bg-gray-500" style="background: #fff;"><span class=\"content\"><span class=\"heart\">🖤</span> Home Advisor</span></span></button>
                </div>
                <div class="flex flex-row items-start disable">
                    <input name="bbb.org" class="p-2 mr-3 mt-3 mb-3 w-3/5 rounded-md border-2 border-gray-200 w-full" value="">
                    <button id="social-reviews" name="bbb.org" class="font-semibold p-2 w-2/5 m-3 rounded-full border-2 text-black text-sm bg-gray-500" style="background: #fff;"><span class=\"content\"><span class=\"heart\" style="filter: hue-rotate(-25deg) brightness(0.75);">💙</span> Bureau</span></span></button>
                </div>
            </div>
        </div>
    `,
    "photos": {
        "About Us Photo": null, 
        "Hero Images": null, 
        "All Photos": null,
    },
};

const _socials = [
    "facebook.com",
    "instagram",
    "bbb.org",
    "yelp.com",
    "google.com",
    "goo.gl",
    "nextdoor.com",
    "thumbtack.com",
    "homeadvisor.com",
];

const _basicInfo = {
    "facebook.com": {
        company: ".x1e56ztr.x1xmf6yo h1.x1heor9g.x1qlqyl8.x1pd3egz.x1a2a7pz, h3._6x2x",
    },
    "google.com": {
        company: ".DUwDvf.lfPIob",
    },
    "instagram": {
        company: "a[href=\"#\"] h2",
    },
    "yelp.com": {
        company: "h1.css-1se8maq",
    },
    "thumbtack.com": {
        company: "._23PifmaL2cIG8rDO-YARRs",
    },
    "nextdoor.com": {
        company: "h2.css-4t5k3f",
    },
    "homeadvisor.com": {
        company: "#header-containter h1",
    },
}

const _services = {
    "facebook.com": {
        gallery: ".x1e56ztr .x78zum5.x1q0g3np.x1a02dak",
        photo: ".x9f619.x1r8uery.x1iyjqo2.x6ikm8r.x10wlt62.x1n2onr6",
        link: "",
        close: "div[aria-label][aria-hidden][role=\"button\"][tabindex=\"0\"]",
        upload: "img[data-visualcompletion=\"media-vc-image\"]",
    },
    "instagram": {
        gallery: "main[role=\"main\"]", //"article.x1iyjqo2 > div > div",
        photo: "._aabd._aa8k._al3l",
        link: "",
        close: ".x160vmok.x10l6tqk.x1eu8d0j.x1vjfegm [role=\"button\"]",
        upload: "img",
    },
    "yelp.com": {
        gallery: ".media-landing_gallery > ul",
        photo: ".media-landing_gallery > ul > li",
        link: ".media-landing_gallery > ul > li > div",
        close: ".lightbox-close",
        upload: "img",
    }
}

const _reviews = {
    "facebook.com": {
        list: ".x1yztbdb.x1n2onr6.xh8yej3.x1ja2u2z .x1a2a7pz[role=\"article\"]",
        more: ".xdj266r.x11i5rnm.xat24cr.x1mh8g0r.x1vvkbs [role=\"button\"]",
        name: ".x193iq5w.xeuugli.x13faqbe.x1vvkbs.xlh3980.xvmahel.x1n0sxbx.x6prxxf.xvq8zen.xo1l8bm.xi81zsa strong:first-of-type",
        text: ".xdj266r.x11i5rnm.xat24cr.x1mh8g0r.x1vvkbs",
        star: "img[src*=\"TV7FGN3WRcJ\"]",
        count: ".x1heor9g.x1qlqyl8.x1pd3egz.x1a2a7pz.x193iq5w.xeuugli",
    },
    "yelp.com": {
        list: "#reviews section div:nth-child(2) > ul li",
        name: ".fs-block",
        text: ".comment__09f24__D0cxf",
        star: "div[aria-label*=\"5\"]",
    },
    "google.com": {
        list: "div[data-review-id]",
        more: "button[role=\"switch\"]",
        name: "aria-label",
        text: ".MyEned",
        star: "span[aria-label*=\"5\"]",
        scroll: "div[role=\"main\"] > div:nth-child(2)",
    },
    "nextdoor.com": {
        list: ".css-aivyev",
        name: "._3I7vNNNM.E7NPJ3WK",
        text: ".css-1yf37yk",
    },
    "thumbtack.com": {
        list: ".pv4.bb.b-gray",
        name: "._1IFLvn772QsHli5N5sL9V1",
        text: "._35bESqM0YmWdRBtN-nsGpq",
        star: ".dn.m_flex ._1Wv_Lm7Q0IE3AFEImQTWZ9[data-star=\"5\"]",
    },
    "homeadvisor.com": {
        list: ".list-body[data-v-0b8aee16]",
        name: "div[data-v-0c2a9f0c] > span[data-v-0c2a9f0c]:nth-child(2)",
        text: ".review-content",
        star: "div[data-v-0c2a9f0c] > span[data-v-0c2a9f0c]:nth-child(1) > span",
    },
    "bbb.org": {
        list: "li.card",
        name: "h3",
        text: ".css-1epoynv.ef0gsym0",
        star: ".cluster.css-11qc6sr.e1w7zhmp0 svg",
    },
}

const _ignored = {
    reviews: [
        "bitcoin", 
        "whatsapp", 
        "gmail", 
        "http", 
        "www",
    ],
    services: [
        "construction",
        "renovation",
        "install",
        "service",
        "design",
        "removal",
    ]
};

const _default = {
    "Auto Detailing": [
        "Interior Detailing",
        "Exterior Detailing",
        "Full Detail Service",
        "Ceramic Coating"
    ],
    "Automotive Repair Shop": [
        "Body Repairs",
        "Rim Repairs",
        "Paint Correction",
        "Paint Restoration",
        "Full Detail Service"
    ],
    "Cleaning": [
        "Residential Cleaning",
        "Deep Cleaning",
        "Commercial Cleaning",
        "Move In / Move Out Cleaning",
        "Airbnb Cleaning",
        "Post-Construction Cleaning"
    ],
    "Construction & Remodeling": [
        "Kitchen Renovation",
        "Bathroom Renovation",
        "Carpentry",
        "Deck & Patio Installation",
        "Flooring",
        "Other Repair Services"
    ],
    "Irrigation Specialists": [
        "System Maintenance",
        "Winterizing Systems",
        "Installations",
        "Controller Upgrade",
        "Start Up",
        "Troubleshooting"
    ],
    "Junk Removal": [
        "Junk Removal",
        "Hauling",
        "Appliance Removal",
        "Construction Debris Removal",
        "Cleanouts",
        "Demolition"
    ],
    "Lawn Care": [
        "Mowing",
        "Mulch Installation",
        "Shrub Trimming",
        "Fall and Spring Clean Up",
        "Other Lawn Services"
    ],
    "Landscaping & Hardscaping": [
        "Mowing",
        "Mulch Installation",
        "Shrub Trimming",
        "Fall and Spring Clean Up",
        "Patio Design & Construction",
        "Retaining Wall Construction",
        "Lawn Aeration"
    ],
    "Landscaping & Snow Removal": [
        "Mowing",
        "Mulch Installation",
        "Shrub Trimming",
        "Fall and Spring Clean Up",
        "Snow Removal"
    ],
    "Painting & Staining & Home Renovations": [
        "Interior Painting",
        "Exterior Painting",
        "Staining",
        "Kitchen and Cabinet Refinishing",
        "Drywall and Plastering"
    ],
    "Painting": [
        "Interior Painting",
        "Exterior Painting",
        "Kitchen and Cabinet Refinishing",
        "Drywall and Plastering",
        "Other Painting Services"
    ],
    "Power Washing": [
        "Home Softwash",
        "Concrete Cleaning",
        "Driveway and Sidewalk Cleaning",
        "Deck & Patio Cleaning",
        "Hardscape Cleaning",
        "Fence Washing",
        "Gutter Cleaning"
    ],
    "Property Management Company": [
        "Property Management Services",
        "Lawn Maintenance",
        "Handyman Services",
        "Hauling and Mowing Service",
        "Hedge Trimming"
    ],
    "Residential Cleaning": [
        "Residential Cleaning",
        "Deep Cleaning",
        "Airbnb Cleaning",
        "Move In / Move Out Cleaning",
        "Post-Construction Cleaning",
        "Organizing",
        "Other Services"
    ],
    "Tree Services": [
        "Tree Removal",
        "Tree Trimming",
        "Stump Removal",
        "Fall and Spring Clean Up",
        "Shrub Trimming",
        "Mulch Installation"
    ],
    "concrete": [
        "Concrete",
        "Concrete Slab Construction",
        "Patio Design & Installation",
        "Sidewalk Installation",
        "Stair Design & Installation",
        "Stamped Concrete Installation"
    ],
    "Handyman Services": [
        "Electrical Works",
        "Plumbing",
        "Painting and Drywall",
        "Appliance Repair",
        "Flooring and Tiling",
        "Other Handyman Services",
    ],
    "Trucking": [
        "Top Soil Hauling",
        "Fill Hauling",
        "Base Rock Hauling",
        "Potting Soil Hauling",
        "57/89 Stones Hauling",
    ],
    "Plumbing": [
        "Plumbing Contractor",
        "Plumbing Installations",
        "Plumbing Repair",
    ],
    "Electrical": [
        "Commercial and Residential Lighting",
        "Electrical Panel Installation and Repair",
        "Outlet Installation and Repair",
        "Wiring Installation and Repair",
    ],
    "Flooring": [
        "Floor Installation",
        "Floor Repair",
        "Carpet Installation",
        "Tiling",
    ],
    "HVAC": [
        "HVAC Repairs",
        "HVAC Maintenances",
        "Residential HVAC Installation",
        "Commerciaol HVAC Installation",
    ],
    "Moving": [
        "Residential Moving",
        "Commercial Moving",
        "Move In/Move Out Services",
        "Heavy Item Moves",
    ],
    "Epoxy": [
        "Epoxy Flooring",
        "Decorative Flooring",
    ],
    "Welding": [
        "Ornamental Fabricatior",
        "Metal Fabrication",
        "Railing Installation",
        "Custom Gate Work",
        "Fencing",
    ],
    "Excavating": [
        "Excavation & Grading",
        "Landscaping",
        "Erosion Control",
        "French Drain Installation",
    ],
    "Dumpster Rentals": [
        "10 yd Dumpster Rentals",
        "15 yd Dumpster Rentals",
        "20 yd Dumpster Rentals",
    ],
    "Demolition": [
        "Junk Removal",
        "Interior Demolition",
        "Commerical Demolition",
        "Industrial Demolition",
        "Estate / Foreclosure Clean out",
        "Bank Vault Demolition",
        "Fire Damage Removal",
    ]
};  