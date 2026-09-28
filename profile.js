/* =========================================================
   SIGN AI - PROFILE.JS
   =========================================================

   Handles:
   - User profile
   - Edit profile
   - Username
   - Mobile number
   - Email
   - Password
   - XP
   - Level
   - Accuracy
   - Course statistics
   - Certificates
   - Logout
   ========================================================= */


/* =========================================================
   CONFIGURATION
   ========================================================= */

const API_BASE_URL =
    "http://127.0.0.1:8000";


const PROFILE_API =
    `${API_BASE_URL}/api/profile`;


const USER_API =
    `${API_BASE_URL}/api/users`;


/* =========================================================
   STORAGE
   ========================================================= */

const USER_STORAGE_KEY =
    "user";


const ENROLLMENTS_STORAGE_KEY =
    "signai_enrollments";


const CERTIFICATES_STORAGE_KEY =
    "signai_certificates";


/* =========================================================
   CURRENT USER
   ========================================================= */

let currentUser =
    JSON.parse(
        localStorage.getItem(
            USER_STORAGE_KEY
        )
    );


/* =========================================================
   DOM READY
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    initializeProfile
);


/* =========================================================
   INITIALIZE
   ========================================================= */

async function initializeProfile() {

    if (!currentUser) {

        currentUser = {

            id:
                localStorage.getItem(
                    "user_id"
                ),

            username:
                localStorage.getItem(
                    "username"
                ) || "User",

            email:
                localStorage.getItem(
                    "email"
                ) || "",

            mobile:
                localStorage.getItem(
                    "mobile"
                ) || "",

            xp:
                Number(
                    localStorage.getItem(
                        "xp"
                    )
                ) || 0,

            level:
                localStorage.getItem(
                    "level"
                ) || "Beginner",

            accuracy:
                Number(
                    localStorage.getItem(
                        "accuracy"
                    )
                ) || 0

        };

    }


    loadProfileData();

    setupProfileEvents();

    await loadProfileFromAPI();

    updateProfileStatistics();

}


/* =========================================================
   LOAD PROFILE DATA
   ========================================================= */

function loadProfileData() {

    const username =
        currentUser.username ||
        "User";


    setText(
        "profileUsername",
        username
    );


    setText(
        "profileName",
        username
    );


    setValue(
        "usernameInput",
        username
    );


    setValue(
        "nameInput",
        username
    );


    setText(
        "profileEmail",
        currentUser.email ||
        "Not provided"
    );


    setValue(
        "emailInput",
        currentUser.email ||
        ""
    );


    setValue(
        "mobileInput",
        currentUser.mobile ||
        currentUser.phone ||
        ""
    );


    setText(
        "profileLevel",
        currentUser.level ||
        "Beginner"
    );


    setText(
        "profileXP",
        currentUser.xp ||
        0
    );


    setText(
        "profileAccuracy",
        `${currentUser.accuracy || 0}%`
    );


    updateProfileAvatar(
        username
    );

}


/* =========================================================
   LOAD PROFILE FROM API
   ========================================================= */

async function loadProfileFromAPI() {

    const userId =
        currentUser.id;


    if (!userId) {

        return;

    }


    const token =
        localStorage.getItem(
            "token"
        );


    try {

        const response =
            await fetch(
                `${PROFILE_API}/${userId}`,
                {
                    method: "GET",

                    headers: {

                        "Content-Type":
                            "application/json",

                        ...(token
                            ? {
                                Authorization:
                                    `Bearer ${token}`
                            }
                            : {})

                    }

                }
            );


        if (!response.ok) {

            throw new Error(
                `HTTP ${response.status}`
            );

        }


        const data =
            await response.json();


        /*
           Support either:

           {
               user: {...}
           }

           OR

           {...}
        */

        const user =
            data.user ||
            data;


        currentUser = {

            ...currentUser,

            ...user

        };


        localStorage.setItem(
            USER_STORAGE_KEY,
            JSON.stringify(
                currentUser
            )
        );


        saveUserCompatibilityData();

        loadProfileData();

    }
    catch (error) {

        console.warn(
            "Profile API unavailable. Using local user data.",
            error
        );

    }

}


/* =========================================================
   SETUP EVENTS
   ========================================================= */

function setupProfileEvents() {


    /* -----------------------------------------
       EDIT PROFILE BUTTON
    ----------------------------------------- */

    const editBtn =
        document.getElementById(
            "editProfileBtn"
        );


    if (editBtn) {

        editBtn.addEventListener(
            "click",
            enableProfileEditing
        );

    }


    /* -----------------------------------------
       CANCEL
    ----------------------------------------- */

    const cancelBtn =
        document.getElementById(
            "cancelProfileBtn"
        );


    if (cancelBtn) {

        cancelBtn.addEventListener(
            "click",
            cancelProfileEditing
        );

    }


    /* -----------------------------------------
       PROFILE FORM
    ----------------------------------------- */

    const profileForm =
        document.getElementById(
            "profileForm"
        );


    if (profileForm) {

        profileForm.addEventListener(
            "submit",
            saveProfile
        );

    }


    /* -----------------------------------------
       PASSWORD FORM
    ----------------------------------------- */

    const passwordForm =
        document.getElementById(
            "passwordForm"
        );


    if (passwordForm) {

        passwordForm.addEventListener(
            "submit",
            changePassword
        );

    }


    /* -----------------------------------------
       PASSWORD TOGGLE
    ----------------------------------------- */

    document
        .querySelectorAll(
            "[data-password-toggle]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        const targetId =
                            button.dataset
                                .passwordToggle;

                        const input =
                            document.getElementById(
                                targetId
                            );


                        if (!input) {

                            return;

                        }


                        input.type =
                            input.type ===
                            "password"
                                ? "text"
                                : "password";


                        const icon =
                            button.querySelector(
                                "i"
                            );


                        if (icon) {

                            icon.classList.toggle(
                                "fa-eye"
                            );

                            icon.classList.toggle(
                                "fa-eye-slash"
                            );

                        }

                    }
                );

            }
        );


    /* -----------------------------------------
       LOGOUT
    ----------------------------------------- */

    const logoutBtn =
        document.getElementById(
            "logoutBtn"
        );


    if (logoutBtn) {

        logoutBtn.addEventListener(
            "click",
            logoutUser
        );

    }


    /* -----------------------------------------
       DELETE ACCOUNT
    ----------------------------------------- */

    const deleteBtn =
        document.getElementById(
            "deleteAccountBtn"
        );


    if (deleteBtn) {

        deleteBtn.addEventListener(
            "click",
            deleteAccount
        );

    }

}


/* =========================================================
   ENABLE EDITING
   ========================================================= */

function enableProfileEditing() {

    const fields =
        document.querySelectorAll(
            "[data-profile-edit]"
        );


    fields.forEach(
        field => {

            field.removeAttribute(
                "readonly"
            );

            field.removeAttribute(
                "disabled"
            );

        }
    );


    document.body.classList.add(
        "profile-editing"
    );


    const editBtn =
        document.getElementById(
            "editProfileBtn"
        );


    const saveBtn =
        document.getElementById(
            "saveProfileBtn"
        );


    const cancelBtn =
        document.getElementById(
            "cancelProfileBtn"
        );


    if (editBtn) {

        editBtn.style.display =
            "none";

    }


    if (saveBtn) {

        saveBtn.style.display =
            "inline-flex";

    }


    if (cancelBtn) {

        cancelBtn.style.display =
            "inline-flex";

    }

}


/* =========================================================
   CANCEL PROFILE EDIT
   ========================================================= */

function cancelProfileEditing() {

    loadProfileData();


    disableProfileEditing();

}


/* =========================================================
   DISABLE EDITING
   ========================================================= */

function disableProfileEditing() {

    const fields =
        document.querySelectorAll(
            "[data-profile-edit]"
        );


    fields.forEach(
        field => {

            field.setAttribute(
                "readonly",
                "readonly"
            );

        }
    );


    document.body.classList.remove(
        "profile-editing"
    );


    const editBtn =
        document.getElementById(
            "editProfileBtn"
        );


    const saveBtn =
        document.getElementById(
            "saveProfileBtn"
        );


    const cancelBtn =
        document.getElementById(
            "cancelProfileBtn"
        );


    if (editBtn) {

        editBtn.style.display =
            "inline-flex";

    }


    if (saveBtn) {

        saveBtn.style.display =
            "none";

    }


    if (cancelBtn) {

        cancelBtn.style.display =
            "none";

    }

}


/* =========================================================
   SAVE PROFILE
   ========================================================= */

async function saveProfile(event) {

    event.preventDefault();


    const username =
        getValue(
            "usernameInput"
        )
        ||
        getValue(
            "nameInput"
        );


    const mobile =
        getValue(
            "mobileInput"
        );


    if (!username) {

        showNotification(
            "Username cannot be empty.",
            "error"
        );

        return;

    }


    const updatedData = {

        username:
            username.trim(),

        mobile:
            mobile.trim()

    };


    const userId =
        currentUser.id;


    const token =
        localStorage.getItem(
            "token"
        );


    try {

        if (userId) {

            const response =
                await fetch(
                    `${PROFILE_API}/${userId}`,
                    {
                        method: "PUT",

                        headers: {

                            "Content-Type":
                                "application/json",

                            ...(token
                                ? {
                                    Authorization:
                                        `Bearer ${token}`
                                    }
                                : {})

                        },

                        body:
                            JSON.stringify(
                                updatedData
                            )

                    }
                );


            if (!response.ok) {

                throw new Error(
                    `HTTP ${response.status}`
                );

            }


            const data =
                await response.json();


            const updatedUser =
                data.user ||
                data;


            currentUser = {

                ...currentUser,

                ...updatedUser,

                ...updatedData

            };

        }
        else {

            currentUser = {

                ...currentUser,

                ...updatedData

            };

        }

    }
    catch (error) {

        console.warn(
            "Profile API unavailable. Saving locally.",
            error
        );


        currentUser = {

            ...currentUser,

            ...updatedData

        };

    }


    saveUser();


    loadProfileData();

    disableProfileEditing();


    showNotification(
        "Profile updated successfully.",
        "success"
    );

}


/* =========================================================
   CHANGE PASSWORD
   ========================================================= */

async function changePassword(event) {

    event.preventDefault();


    const currentPassword =
        getValue(
            "currentPassword"
        );


    const newPassword =
        getValue(
            "newPassword"
        );


    const confirmPassword =
        getValue(
            "confirmPassword"
        );


    if (
        !currentPassword ||
        !newPassword ||
        !confirmPassword
    ) {

        showNotification(
            "Please fill all password fields.",
            "error"
        );

        return;

    }


    if (
        newPassword !==
        confirmPassword
    ) {

        showNotification(
            "New passwords do not match.",
            "error"
        );

        return;

    }


    if (
        newPassword.length < 8
    ) {

        showNotification(
            "Password must contain at least 8 characters.",
            "error"
        );

        return;

    }


    const userId =
        currentUser.id;


    const token =
        localStorage.getItem(
            "token"
        );


    try {

        const response =
            await fetch(
                `${PROFILE_API}/${userId}/password`,
                {

                    method: "PUT",

                    headers: {

                        "Content-Type":
                            "application/json",

                        ...(token
                            ? {
                                Authorization:
                                    `Bearer ${token}`
                            }
                            : {})

                    },

                    body:
                        JSON.stringify({

                            current_password:
                                currentPassword,

                            new_password:
                                newPassword

                        })

                }
            );


        if (!response.ok) {

            let message =
                "Unable to change password.";


            try {

                const errorData =
                    await response.json();

                message =
                    errorData.detail ||
                    errorData.message ||
                    message;

            }
            catch (_) {}


            throw new Error(
                message
            );

        }


        showNotification(
            "Password changed successfully.",
            "success"
        );


        clearPasswordFields();

    }
    catch (error) {

        /*
           IMPORTANT:

           Do not silently pretend a password
           was changed if your backend is unavailable.

           Password should always be changed
           through the backend.
        */

        console.error(
            "Password change error:",
            error
        );


        showNotification(
            error.message ||
            "Password could not be changed. Please try again.",
            "error"
        );

    }

}


/* =========================================================
   CLEAR PASSWORD
   ========================================================= */

function clearPasswordFields() {

    [
        "currentPassword",
        "newPassword",
        "confirmPassword"

    ].forEach(
        id => {

            const input =
                document.getElementById(
                    id
                );


            if (input) {

                input.value = "";

            }

        }
    );

}


/* =========================================================
   UPDATE PROFILE STATISTICS
   ========================================================= */

function updateProfileStatistics() {

    const enrollments =
        JSON.parse(
            localStorage.getItem(
                ENROLLMENTS_STORAGE_KEY
            )
        ) || {};


    const certificates =
        JSON.parse(
            localStorage.getItem(
                CERTIFICATES_STORAGE_KEY
            )
        ) || {};


    const userId =
        currentUser.id;


    const userEnrollments =
        Object.values(
            enrollments
        ).filter(
            enrollment => {

                return String(
                    enrollment.userId
                ) ===
                String(userId);

            }
        );


    const enrolledCount =
        userEnrollments.length;


    const completedCount =
        userEnrollments.filter(
            enrollment =>
                enrollment.completed ===
                true
        ).length;


    const certificateCount =
        Object.values(
            certificates
        ).filter(
            certificate =>
                String(
                    certificate.userId
                ) ===
                String(userId)
        ).length;


    const averageScore =
        calculateAverageScore(
            userEnrollments
        );


    setText(
        "enrolledCourses",
        enrolledCount
    );


    setText(
        "completedCourses",
        completedCount
    );


    setText(
        "certificateCount",
        certificateCount
    );


    setText(
        "profileScore",
        `${averageScore}%`
    );


    setText(
        "profileAccuracy",
        `${currentUser.accuracy || 0}%`
    );


    setText(
        "profileXP",
        currentUser.xp || 0
    );


    setText(
        "profileLevel",
        currentUser.level ||
        "Beginner"
    );

}


/* =========================================================
   CALCULATE AVERAGE SCORE
   ========================================================= */

function calculateAverageScore(
    enrollments
) {

    const scores =
        enrollments
            .map(
                item =>
                    Number(item.score)
            )
            .filter(
                score =>
                    !Number.isNaN(score)
            );


    if (
        scores.length === 0
    ) {

        return 0;

    }


    const total =
        scores.reduce(
            (
                sum,
                score
            ) =>
                sum + score,
            0
        );


    return Math.round(
        total /
        scores.length
    );

}


/* =========================================================
   UPDATE AVATAR
   ========================================================= */

function updateProfileAvatar(
    username
) {

    const avatarElements =
        document.querySelectorAll(
            "[data-profile-avatar]"
        );


    const initial =
        username
            ? username
                .trim()
                .charAt(0)
                .toUpperCase()
            : "U";


    avatarElements.forEach(
        element => {

            element.textContent =
                initial;

        }
    );

}


/* =========================================================
   SAVE USER
   ========================================================= */

function saveUser() {

    localStorage.setItem(
        USER_STORAGE_KEY,
        JSON.stringify(
            currentUser
        )
    );


    saveUserCompatibilityData();

}


/* =========================================================
   COMPATIBILITY STORAGE
   ========================================================= */

function saveUserCompatibilityData() {

    if (
        currentUser.id !== undefined
    ) {

        localStorage.setItem(
            "user_id",
            currentUser.id
        );

    }


    if (
        currentUser.username
    ) {

        localStorage.setItem(
            "username",
            currentUser.username
        );

    }


    if (
        currentUser.email
    ) {

        localStorage.setItem(
            "email",
            currentUser.email
        );

    }


    if (
        currentUser.mobile
    ) {

        localStorage.setItem(
            "mobile",
            currentUser.mobile
        );

    }


    if (
        currentUser.xp !== undefined
    ) {

        localStorage.setItem(
            "xp",
            currentUser.xp
        );

    }


    if (
        currentUser.level
    ) {

        localStorage.setItem(
            "level",
            currentUser.level
        );

    }


    if (
        currentUser.accuracy !== undefined
    ) {

        localStorage.setItem(
            "accuracy",
            currentUser.accuracy
        );

    }

}


/* =========================================================
   LOGOUT
   ========================================================= */

function logoutUser() {

    const confirmed =
        confirm(
            "Are you sure you want to logout?"
        );


    if (!confirmed) {

        return;

    }


    localStorage.removeItem(
        "token"
    );

    localStorage.removeItem(
        "user"
    );

    localStorage.removeItem(
        "user_id"
    );

    localStorage.removeItem(
        "username"
    );

    localStorage.removeItem(
        "email"
    );

    localStorage.removeItem(
        "mobile"
    );

    localStorage.removeItem(
        "xp"
    );

    localStorage.removeItem(
        "level"
    );

    localStorage.removeItem(
        "accuracy"
    );


    window.location.href =
        "login.html";

}


/* =========================================================
   DELETE ACCOUNT
   ========================================================= */

async function deleteAccount() {

    const confirmed =
        confirm(
            "This will permanently delete your account. Continue?"
        );


    if (!confirmed) {

        return;

    }


    const userId =
        currentUser.id;


    const token =
        localStorage.getItem(
            "token"
        );


    try {

        const response =
            await fetch(
                `${USER_API}/${userId}`,
                {

                    method: "DELETE",

                    headers: {

                        ...(token
                            ? {
                                Authorization:
                                    `Bearer ${token}`
                            }
                            : {})

                    }

                }
            );


        if (!response.ok) {

            throw new Error(
                "Account deletion failed."
            );

        }


        localStorage.clear();


        window.location.href =
            "login.html";

    }
    catch (error) {

        console.error(
            error
        );


        showNotification(
            "Could not delete your account. Please contact support.",
            "error"
        );

    }

}


/* =========================================================
   NOTIFICATION
   ========================================================= */

function showNotification(
    message,
    type = "info"
) {

    let notification =
        document.getElementById(
            "profileNotification"
        );


    if (!notification) {

        notification =
            document.createElement(
                "div"
            );

        notification.id =
            "profileNotification";

        notification.className =
            "profile-notification";

        document.body.appendChild(
            notification
        );

    }


    notification.className =
        `profile-notification ${type}`;


    notification.innerHTML = `

        <i class="${
            type === "success"
                ? "fa-solid fa-circle-check"
                : type === "error"
                    ? "fa-solid fa-circle-xmark"
                    : "fa-solid fa-circle-info"
        }"></i>

        <span>
            ${escapeHTML(message)}
        </span>

    `;


    notification.classList.add(
        "show"
    );


    setTimeout(
        () => {

            notification.classList.remove(
                "show"
            );

        },
        3500
    );

}


/* =========================================================
   UTILITY FUNCTIONS
   ========================================================= */

function getValue(id) {

    const element =
        document.getElementById(
            id
        );


    return element
        ? element.value.trim()
        : "";

}


function setValue(
    id,
    value
) {

    const element =
        document.getElementById(
            id
        );


    if (element) {

        element.value =
            value ?? "";

    }

}


function setText(
    id,
    value
) {

    const element =
        document.getElementById(
            id
        );


    if (element) {

        element.textContent =
            value ?? "";

    }

}


function escapeHTML(
    value
) {

    const div =
        document.createElement(
            "div"
        );

    div.textContent =
        value ?? "";

    return div.innerHTML;

}


/* =========================================================
   GLOBAL PROFILE API
   ========================================================= */

window.SignAIProfile = {

    getUser:
        () => currentUser,

    refresh:
        initializeProfile,

    save:
        saveProfile,

    changePassword,

    logout:
        logoutUser

};