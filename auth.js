const publicPages = ["login.html", "register.html"];

function getCurrentPage() {
    return window.location.pathname.split("/").pop() || "index.html";
}

function isLoggedIn() {
    return localStorage.getItem("connectedUser") !== null;
}

function requireLogin() {
    if (!publicPages.includes(getCurrentPage()) && !isLoggedIn()) {
        window.location.replace("login.html");
    }
}

requireLogin();
