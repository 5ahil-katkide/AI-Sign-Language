(function () {

    const token = localStorage.getItem("token");

    const protectedPages = [
        "/",
        "/dashboard",
        "/practice",
        "/history"
    ];

    const currentPath = window.location.pathname;

    if (protectedPages.includes(currentPath) && !token) {
        window.location.replace("/login");
    }

})();