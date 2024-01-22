let before = 0;
let hearts = [];

function createHeart(x, y, start, scale) {
    let heart = document.createElement("DIV");
    heart.setAttribute("class", "heart");
    document.getElementById("love").appendChild(heart);
    heart.time = 2000;
    heart.x = x;
    heart.y = y;
    heart.direction = start;
    heart.style.left = heart.x + "px";
    heart.style.bottom = heart.y + "px";
    heart.scale = scale;
    heart.style.transform = "scale(" + scale + "," + scale + ")";
    if(hearts == null) {
        hearts = [];
    }
    hearts.push(heart);
    return heart;
}

function frame() {
    let current = Date.now();
    let deltaTime = current - before;
    before = current;
    for(i in hearts) {
        let heart = hearts[i];
        heart.time -= deltaTime;
        if(heart.time > 0) {
            heart.y += 2;
            heart.style.bottom = heart.y + "px";
            heart.style.left = heart.x + heart.direction * Math.sin(heart.y * heart.scale / 30) / heart.y * 200 + "px";
        } else {
            heart.parentNode.removeChild(heart);
            hearts.splice(i, 1);
        }
    }
}

function check() {
    let start = 1 - Math.round(Math.random()) * 2;
    let scale = Math.random() * Math.random() * 0.8 + 0.2;
    let bottom = Math.random() * window.innerHeight / 1.5;
    let left = Math.random() * window.innerWidth;
    createHeart(left, bottom, start, scale);
}

function initLove(length) {
    let love = document.createElement("DIV");
    love.setAttribute("id", "love");
    document.body.appendChild(love);
    
    before = Date.now();
    let id = setInterval(frame, 5);
    let gr = setInterval(check, 100);

    setTimeout(() => {
        clearInterval(gr);
        clearInterval(id);
        love.classList.add("end");
        love.addEventListener("transitionend", () => love.remove());
    }, length * 200);
}