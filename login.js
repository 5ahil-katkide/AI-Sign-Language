const form = document.getElementById("loginForm");

form.addEventListener("submit", async (e) => {

    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    const response = await fetch("/auth/login", {

        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify({
            email,
            password
        })

    });

    const data = await response.json();

    const msg = document.getElementById("message");

    if (response.ok) {

        msg.style.color = "green";
        msg.innerHTML = "Login Successful";

        // ===========================
        // Save User Information
        // ===========================

        localStorage.setItem("token", data.access_token);
        localStorage.setItem("user_id", data.user_id);
        localStorage.setItem("username", data.name);
        localStorage.setItem("email", data.email);

        localStorage.setItem("xp", data.xp);
        localStorage.setItem("level", data.level);
        localStorage.setItem("accuracy", data.accuracy);
        localStorage.setItem("streak", data.streak);
        localStorage.setItem("total_attempts", data.total_attempts);
        localStorage.setItem("total_correct", data.total_correct);

        setTimeout(() => {

            window.location.href = "/dashboard";

        }, 1000);

    }

    else {

        msg.style.color = "red";
        msg.innerHTML = data.detail;

    }

});