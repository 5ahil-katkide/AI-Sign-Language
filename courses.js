/* =========================================================
   SIGN AI - COURSES.JS
   =========================================================

   Handles:
   - Course listing
   - Course enrollment
   - Course progress
   - Course completion
   - Certificates
   - Search
   - Filtering
   - Course tabs
   - Course details modal
   - Course practice navigation
   - Course-specific sign sequence
   - User statistics
   - API integration
   - LocalStorage fallback

   IMPORTANT:
   - Does NOT replace your ML model.
   - Does NOT change prediction input.
   - Uses the existing /practice page.
   ========================================================= */


/* =========================================================
   CONFIGURATION
   ========================================================= */

const API_BASE_URL = "http://127.0.0.1:8000";

const COURSES_API =
    `${API_BASE_URL}/api/courses`;

const COURSES_STORAGE_KEY =
    "signai_courses";

const ENROLLMENTS_STORAGE_KEY =
    "signai_enrollments";

const CERTIFICATES_STORAGE_KEY =
    "signai_certificates";

const ACTIVE_COURSE_KEY =
    "active_course_id";

const ACTIVE_COURSE_DATA_KEY =
    "active_course_data";


/* =========================================================
   CURRENT USER
   ========================================================= */

let currentUser = {};

try {

    currentUser =
        JSON.parse(
            localStorage.getItem("user") || "{}"
        );

}
catch (error) {

    currentUser = {};

}


currentUser = {

    id:
        currentUser.id ??
        currentUser.user_id ??
        localStorage.getItem("user_id") ??
        localStorage.getItem("userId") ??
        null,

    username:
        currentUser.username ??
        currentUser.name ??
        localStorage.getItem("username") ??
        localStorage.getItem("name") ??
        "User",

    email:
        currentUser.email ??
        localStorage.getItem("email") ??
        ""

};


/* =========================================================
   COURSE DATA
   ========================================================= */

const defaultCourses = [

    {
        id: 1,

        title:
            "Sign Language Fundamentals",

        shortTitle:
            "Fundamentals",

        description:
            "Learn the basic concepts, hand positions, alphabet and essential communication techniques of sign language.",

        category:
            "Beginner",

        level:
            "Beginner",

        duration:
            "4 Weeks",

        lessons:
            26,

        skills: [
            "Hand Alphabet",
            "Basic Signs",
            "Numbers",
            "Greetings"
        ],

        icon:
            "fa-solid fa-hand",

        color:
            "blue",

        signs: [
            "A", "B", "C", "D", "E", "F", "G",
            "H", "I", "J", "K", "L", "M", "N",
            "O", "P", "Q", "R", "S", "T", "U",
            "V", "W", "X", "Y", "Z"
        ],

        enrolled:
            0,

        progress:
            0,

        completed:
            false,

        score:
            null,

        certificate:
            null
    },


    {
        id: 2,

        title:
            "ASL Alphabet Mastery",

        shortTitle:
            "ASL Alphabet",

        description:
            "Master A-Z hand signs with interactive camera-based practice and AI-powered feedback.",

        category:
            "Alphabet",

        level:
            "Beginner",

        duration:
            "2 Weeks",

        lessons:
            26,

        skills: [
            "A-Z Alphabet",
            "Hand Position",
            "Finger Orientation",
            "AI Practice"
        ],

        icon:
            "fa-solid fa-spell-check",

        color:
            "purple",

        signs: [
            "A", "B", "C", "D", "E", "F", "G",
            "H", "I", "J", "K", "L", "M", "N",
            "O", "P", "Q", "R", "S", "T", "U",
            "V", "W", "X", "Y", "Z"
        ],

        enrolled:
            0,

        progress:
            0,

        completed:
            false,

        score:
            null,

        certificate:
            null
    },


    {
        id: 3,

        title:
            "Everyday Communication",

        shortTitle:
            "Communication",

        description:
            "Learn commonly used signs for everyday conversations, introductions, questions and responses.",

        category:
            "Communication",

        level:
            "Intermediate",

        duration:
            "5 Weeks",

        lessons:
            20,

        skills: [
            "Greetings",
            "Questions",
            "Daily Conversation",
            "Common Phrases"
        ],

        icon:
            "fa-solid fa-comments",

        color:
            "green",

        signs: [
            "HELLO",
            "GOODBYE",
            "THANK YOU",
            "PLEASE",
            "SORRY",
            "YES",
            "NO",
            "HELP",
            "WELCOME",
            "GOOD",
            "BAD",
            "LOVE",
            "FRIEND",
            "FAMILY",
            "NAME",
            "WHAT",
            "WHO",
            "WHERE",
            "WHEN",
            "WHY"
        ],

        enrolled:
            0,

        progress:
            0,

        completed:
            false,

        score:
            null,

        certificate:
            null
    },


    {
        id: 4,

        title:
            "Advanced Sign Language",

        shortTitle:
            "Advanced",

        description:
            "Improve your fluency with advanced signs, sentence formation and real-world communication.",

        category:
            "Advanced",

        level:
            "Advanced",

        duration:
            "8 Weeks",

        lessons:
            20,

        skills: [
            "Advanced Signs",
            "Sentence Formation",
            "Fluency",
            "Conversation"
        ],

        icon:
            "fa-solid fa-graduation-cap",

        color:
            "orange",

        signs: [
            "UNDERSTAND",
            "LEARN",
            "TEACH",
            "QUESTION",
            "ANSWER",
            "PROBLEM",
            "SOLUTION",
            "IMPORTANT",
            "DIFFERENT",
            "SAME",
            "BEFORE",
            "AFTER",
            "TODAY",
            "TOMORROW",
            "YESTERDAY",
            "WORK",
            "SCHOOL",
            "STUDY",
            "COMMUNICATE",
            "PRACTICE"
        ],

        enrolled:
            0,

        progress:
            0,

        completed:
            false,

        score:
            null,

        certificate:
            null
    },


    {
        id: 5,

        title:
            "AI Sign Recognition",

        shortTitle:
            "AI Recognition",

        description:
            "Understand how AI and computer vision recognize hand landmarks and classify sign language gestures.",

        category:
            "AI & Technology",

        level:
            "Advanced",

        duration:
            "6 Weeks",

        lessons:
            10,

        skills: [
            "Computer Vision",
            "MediaPipe",
            "Hand Landmarks",
            "Machine Learning"
        ],

        icon:
            "fa-solid fa-robot",

        color:
            "cyan",

        signs: [
            "A",
            "B",
            "C",
            "D",
            "E",
            "F",
            "G",
            "H",
            "I",
            "J"
        ],

        enrolled:
            0,

        progress:
            0,

        completed:
            false,

        score:
            null,

        certificate:
            null
    },


    {
        id: 6,

        title:
            "Sign Language Conversation",

        shortTitle:
            "Conversation",

        description:
            "Build confidence through realistic conversation exercises and AI-powered practice sessions.",

        category:
            "Communication",

        level:
            "Intermediate",

        duration:
            "6 Weeks",

        lessons:
            15,

        skills: [
            "Conversation",
            "Sentence Practice",
            "Real Situations",
            "AI Feedback"
        ],

        icon:
            "fa-solid fa-users",

        color:
            "pink",

        signs: [
            "HELLO",
            "MY",
            "NAME",
            "YOU",
            "WHAT",
            "YOUR",
            "NICE",
            "MEET",
            "YOU",
            "HOW",
            "ARE",
            "TODAY",
            "THANK",
            "YOU",
            "GOOD"
        ],

        enrolled:
            0,

        progress:
            0,

        completed:
            false,

        score:
            null,

        certificate:
            null
    }

];


/* =========================================================
   GLOBAL STATE
   ========================================================= */

let courses = [];

let enrollments = {};

let certificates = {};

let currentFilter = "all";

let searchTerm = "";

let currentTab = "explore";


/* =========================================================
   DOM READY
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    initializeCourses
);


/* =========================================================
   INITIALIZE
   ========================================================= */

async function initializeCourses() {

    loadLocalCourseData();

    setupCourseEvents();

    setupNavigationButtons();

    setupCourseTabs();

    setupModalEvents();

    updateUserInformation();

    await loadCourses();

    mergeCourseData();

    renderAllCourseSections();

    updateCourseStatistics();

}


/* =========================================================
   LOAD LOCAL DATA
   ========================================================= */

function loadLocalCourseData() {

    try {

        const savedCourses =
            JSON.parse(
                localStorage.getItem(
                    COURSES_STORAGE_KEY
                )
            );

        const savedEnrollments =
            JSON.parse(
                localStorage.getItem(
                    ENROLLMENTS_STORAGE_KEY
                )
            );

        const savedCertificates =
            JSON.parse(
                localStorage.getItem(
                    CERTIFICATES_STORAGE_KEY
                )
            );


        courses =
            Array.isArray(savedCourses)
                ? savedCourses
                : [...defaultCourses];


        enrollments =
            savedEnrollments &&
            typeof savedEnrollments === "object"
                ? savedEnrollments
                : {};


        certificates =
            savedCertificates &&
            typeof savedCertificates === "object"
                ? savedCertificates
                : {};

    }
    catch (error) {

        console.error(
            "Could not load course data:",
            error
        );

        courses =
            [...defaultCourses];

        enrollments = {};

        certificates = {};

    }

}


/* =========================================================
   MERGE COURSE DATA
   =========================================================

   Important:
   Older localStorage data may not contain
   the new `signs` arrays.

   Merge saved courses with default course
   definitions without deleting progress.
   ========================================================= */

function mergeCourseData() {

    const savedCourses =
        Array.isArray(courses)
            ? courses
            : [];


    courses =
        defaultCourses.map(
            defaultCourse => {

                const savedCourse =
                    savedCourses.find(
                        saved =>
                            Number(saved.id) ===
                            Number(defaultCourse.id)
                    );


                if (!savedCourse) {

                    return {
                        ...defaultCourse
                    };

                }


                return {

                    ...defaultCourse,

                    ...savedCourse,

                    /*
                       Always preserve the course's
                       known sign sequence.
                    */

                    signs:
                        Array.isArray(
                            savedCourse.signs
                        ) &&
                        savedCourse.signs.length
                            ? savedCourse.signs
                            : defaultCourse.signs,

                    skills:
                        Array.isArray(
                            savedCourse.skills
                        )
                            ? savedCourse.skills
                            : defaultCourse.skills

                };

            }
        );


    saveCourseData();

}


/* =========================================================
   SAVE LOCAL DATA
   ========================================================= */

function saveCourseData() {

    try {

        localStorage.setItem(
            COURSES_STORAGE_KEY,
            JSON.stringify(courses)
        );

        localStorage.setItem(
            ENROLLMENTS_STORAGE_KEY,
            JSON.stringify(enrollments)
        );

        localStorage.setItem(
            CERTIFICATES_STORAGE_KEY,
            JSON.stringify(certificates)
        );

    }
    catch (error) {

        console.error(
            "Could not save course data:",
            error
        );

    }

}


/* =========================================================
   LOAD COURSES FROM API
   ========================================================= */

async function loadCourses() {

    try {

        const response =
            await fetch(
                COURSES_API,
                {
                    method: "GET",
                    headers: {
                        "Content-Type":
                            "application/json"
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


        const apiCourses =
            Array.isArray(data)
                ? data
                : data?.courses;


        if (
            Array.isArray(apiCourses) &&
            apiCourses.length > 0
        ) {

            courses =
                apiCourses.map(
                    normalizeCourse
                );

            /*
               Keep default sign data when
               API doesn't provide signs.
            */

            courses =
                courses.map(
                    apiCourse => {

                        const defaultCourse =
                            defaultCourses.find(
                                item =>
                                    Number(item.id) ===
                                    Number(apiCourse.id)
                            );


                        return {

                            ...defaultCourse,

                            ...apiCourse,

                            signs:
                                Array.isArray(
                                    apiCourse.signs
                                ) &&
                                apiCourse.signs.length
                                    ? apiCourse.signs
                                    : (
                                        defaultCourse?.signs ||
                                        []
                                    )

                        };

                    }
                );


            saveCourseData();

        }

    }
    catch (error) {

        console.warn(
            "Course API unavailable. Using local course data.",
            error
        );

    }

}


/* =========================================================
   NORMALIZE API COURSE
   ========================================================= */

function normalizeCourse(course) {

    return {

        id:
            course.id,

        title:
            course.title ||
            course.name ||
            "Sign Language Course",

        shortTitle:
            course.shortTitle ||
            course.title ||
            course.name ||
            "Course",

        description:
            course.description ||
            "Learn sign language with AI-powered practice.",

        category:
            course.category ||
            "General",

        level:
            course.level ||
            "Beginner",

        duration:
            course.duration ||
            "4 Weeks",

        lessons:
            Number(
                course.lessons ??
                course.lesson_count ??
                0
            ),

        skills:
            Array.isArray(course.skills)
                ? course.skills
                : [],

        signs:
            Array.isArray(course.signs)
                ? course.signs
                : [],

        icon:
            course.icon ||
            "fa-solid fa-hand",

        color:
            course.color ||
            "blue"

    };

}


/* =========================================================
   USER INFORMATION
   ========================================================= */

function updateUserInformation() {

    document
        .querySelectorAll(
            "[data-user-name]"
        )
        .forEach(
            element => {

                element.textContent =
                    currentUser.username ||
                    "User";

            }
        );

}


/* =========================================================
   COURSE EVENTS
   ========================================================= */

function setupCourseEvents() {

    /* SEARCH */

    const searchInput =
        document.getElementById(
            "courseSearch"
        );


    if (searchInput) {

        searchInput.addEventListener(
            "input",
            function () {

                searchTerm =
                    this.value
                        .trim()
                        .toLowerCase();

                renderAllCourseSections();

            }
        );

    }


    /* -----------------------------------------
       FILTERS

       Supports both:
       data-course-filter
       data-category
    ----------------------------------------- */

    const filterButtons =
        document.querySelectorAll(
            "[data-course-filter], [data-category]"
        );


    filterButtons.forEach(
        button => {

            button.addEventListener(
                "click",
                function (event) {

                    event.preventDefault();


                    filterButtons.forEach(
                        btn =>
                            btn.classList.remove(
                                "active"
                            )
                    );


                    this.classList.add(
                        "active"
                    );


                    currentFilter =
                        String(
                            this.dataset.courseFilter ||
                            this.dataset.category ||
                            "all"
                        )
                            .toLowerCase();


                    renderAllCourseSections();

                }
            );

        }
    );


    /* LEVEL SELECT */

    const levelFilter =
        document.getElementById(
            "levelFilter"
        );


    if (levelFilter) {

        levelFilter.addEventListener(
            "change",
            function () {

                currentFilter =
                    this.value
                        .toLowerCase();

                renderAllCourseSections();

            }
        );

    }


    /* LOGOUT */

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

}


/* =========================================================
   NAVIGATION BUTTONS
   ========================================================= */

function setupNavigationButtons() {

    /* HERO - BROWSE COURSES */

    const browseCoursesBtn =
        document.getElementById(
            "browseCoursesBtn"
        );


    if (browseCoursesBtn) {

        browseCoursesBtn.addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                scrollToCourses();

            }
        );

    }


    /* EMPTY MY COURSES */

    const exploreFromEmptyBtn =
        document.getElementById(
            "exploreFromEmptyBtn"
        );


    if (exploreFromEmptyBtn) {

        exploreFromEmptyBtn.addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                scrollToCourses();

            }
        );

    }


    /* START FIRST COURSE */

    const startFirstCourseBtn =
        document.getElementById(
            "startFirstCourseBtn"
        );


    if (startFirstCourseBtn) {

        startFirstCourseBtn.addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                scrollToCourses();

            }
        );

    }

}
/* PRACTICE NAVIGATION */

const practiceBtn =
    document.getElementById("practiceBtn");

if (practiceBtn) {

    practiceBtn.addEventListener(
        "click",
        function (event) {

            event.preventDefault();

            window.location.href = "/practice";

        }
    );

}

/* =========================================================
   SCROLL TO COURSE EXPLORER
   ========================================================= */

function scrollToCourses() {

    const explorer =
        document.getElementById(
            "courseExplorer"
        );


    if (explorer) {

        explorer.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

        return;

    }


    const grid =
        getCourseGrid();


    if (grid) {

        grid.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

    }

}


/* =========================================================
   COURSE TABS
   ========================================================= */

function setupCourseTabs() {

    const tabs =
        document.querySelectorAll(
            ".course-tab, [data-tab]"
        );


    tabs.forEach(
        tab => {

            tab.addEventListener(
                "click",
                function (event) {

                    event.preventDefault();


                    const tabName =
                        String(
                            this.dataset.tab ||
                            "explore"
                        )
                            .toLowerCase();


                    tabs.forEach(
                        item =>
                            item.classList.remove(
                                "active"
                            )
                    );


                    this.classList.add(
                        "active"
                    );


                    currentTab =
                        tabName;


                    showCourseTab(
                        tabName
                    );

                }
            );

        }
    );

}


/* =========================================================
   SHOW COURSE TAB
   ========================================================= */

function showCourseTab(tabName) {

    const exploreSection =
        document.getElementById(
            "exploreSection"
        );

    const mySection =
        document.getElementById(
            "mySection"
        );

    const completedSection =
        document.getElementById(
            "completedSection"
        );

    const certificatesSection =
        document.getElementById(
            "certificatesSection"
        );


    [
        exploreSection,
        mySection,
        completedSection,
        certificatesSection
    ]
        .forEach(
            section => {

                if (section) {

                    section.classList.add(
                        "hidden"
                    );

                }

            }
        );


    if (tabName === "my") {

        if (mySection) {

            mySection.classList.remove(
                "hidden"
            );

        }

        return;

    }


    if (tabName === "completed") {

        if (completedSection) {

            completedSection.classList.remove(
                "hidden"
            );

        }

        return;

    }


    if (
        tabName ===
        "certificates"
    ) {

        if (certificatesSection) {

            certificatesSection.classList.remove(
                "hidden"
            );

        }

        return;

    }


    if (exploreSection) {

        exploreSection.classList.remove(
            "hidden"
        );

    }

}


/* =========================================================
   FILTER COURSES
   ========================================================= */

function getFilteredCourses() {

    return courses.filter(
        course => {

            const title =
                String(
                    course.title || ""
                )
                    .toLowerCase();


            const description =
                String(
                    course.description || ""
                )
                    .toLowerCase();


            const category =
                String(
                    course.category || ""
                )
                    .toLowerCase();


            const level =
                String(
                    course.level || ""
                )
                    .toLowerCase();


            const matchesSearch =
                !searchTerm ||

                title.includes(
                    searchTerm
                ) ||

                description.includes(
                    searchTerm
                ) ||

                category.includes(
                    searchTerm
                );


            let matchesFilter =
                true;


            if (
                currentFilter &&
                currentFilter !== "all"
            ) {

                const normalizedFilter =
                    currentFilter
                        .replace(
                            /\s+/g,
                            ""
                        );


                if (
                    normalizedFilter ===
                    "enrolled"
                ) {

                    matchesFilter =
                        isCourseEnrolled(
                            course.id
                        );

                }

                else if (
                    normalizedFilter ===
                    "completed"
                ) {

                    matchesFilter =
                        isCourseCompleted(
                            course.id
                        );

                }

                else if (
                    normalizedFilter ===
                    "available"
                ) {

                    matchesFilter =
                        !isCourseEnrolled(
                            course.id
                        );

                }

                else if (
                    normalizedFilter ===
                    "beginner"
                ) {

                    matchesFilter =
                        level ===
                        "beginner";

                }

                else if (
                    normalizedFilter ===
                    "intermediate"
                ) {

                    matchesFilter =
                        level ===
                        "intermediate";

                }

                else if (
                    normalizedFilter ===
                    "advanced"
                ) {

                    matchesFilter =
                        level ===
                        "advanced";

                }

                else {

                    matchesFilter =
                        category ===
                        currentFilter;

                }

            }


            return (
                matchesSearch &&
                matchesFilter
            );

        }
    );

}


/* =========================================================
   RENDER ALL SECTIONS
   ========================================================= */

function renderAllCourseSections() {

    renderCourses();

    renderMyCourses();

    renderCompletedCourses();

    renderCertificates();

    updateLearningSummary();

    updateCourseStatistics();

    showCourseTab(
        currentTab
    );

}


/* =========================================================
   GET COURSE GRID
   =========================================================

   Supports both versions:

   #courseGrid
   #coursesGrid
   ========================================================= */

function getCourseGrid() {

    return (
        document.getElementById(
            "courseGrid"
        ) ||

        document.getElementById(
            "coursesGrid"
        )
    );

}


/* =========================================================
   RENDER EXPLORE COURSES
   ========================================================= */

function renderCourses() {

    const container =
        getCourseGrid();


    if (!container) {

        console.warn(
            "Course grid not found."
        );

        return;

    }


    const filteredCourses =
        getFilteredCourses();


    if (
        filteredCourses.length === 0
    ) {

        container.innerHTML = `

            <div class="empty-courses">

                <div class="empty-course-icon">

                    <i class="fa-solid fa-magnifying-glass"></i>

                </div>

                <h3>
                    No courses found
                </h3>

                <p>
                    Try another search or category.
                </p>

            </div>

        `;

        updateResultCount(0);

        return;

    }


    container.innerHTML =
        filteredCourses
            .map(
                createCourseCard
            )
            .join("");


    updateResultCount(
        filteredCourses.length
    );


    attachCourseButtons();

}


/* =========================================================
   RESULT COUNT
   ========================================================= */

function updateResultCount(
    count
) {

    const element =
        document.getElementById(
            "resultCount"
        );


    if (element) {

        element.textContent =
            `${count} course${count === 1 ? "" : "s"}`;

    }

}


/* =========================================================
   CREATE COURSE CARD
   ========================================================= */

function createCourseCard(
    course
) {

    const courseId =
        Number(course.id);


    const enrolled =
        isCourseEnrolled(
            courseId
        );


    const completed =
        isCourseCompleted(
            courseId
        );


    const progress =
        getCourseProgress(
            courseId
        );


    const score =
        getCourseScore(
            courseId
        );


    let actionHTML = "";


    if (completed) {

        actionHTML = `

            <button
                type="button"
                class="course-action-btn certificate-btn"
                data-certificate="${courseId}"
            >

                <i class="fa-solid fa-award"></i>

                Certificate

            </button>

        `;

    }

    else if (enrolled) {

        actionHTML = `

            <button
                type="button"
                class="course-action-btn continue-btn"
                data-continue="${courseId}"
            >

                <i class="fa-solid fa-play"></i>

                Continue

            </button>

        `;

    }

    else {

        actionHTML = `

            <button
                type="button"
                class="course-action-btn enroll-btn"
                data-enroll="${courseId}"
            >

                <i class="fa-solid fa-plus"></i>

                Enroll & Practice

            </button>

        `;

    }



/* =========================================
   CERTIFICATE PREVIEW
   ========================================= */

    actionHTML += `
    <button
        type="button"
        class="course-action-btn course-preview-certificate"
        onclick="previewCertificate(${course.id})"
    >
        <i class="fa-solid fa-certificate"></i>
        Preview Certificate
    </button>
`;


function previewCertificate(courseId) {

    if (!courseId) {
        return;
    }

    window.location.href =
        `/certificate.html?course=${courseId}&preview=true`;

}

    const signs =
        Array.isArray(course.signs)
            ? course.signs
            : [];


    return `

        <article
            class="course-card"
            data-course-id="${courseId}"
        >

            <div class="course-card-top">

                <div
                    class="course-icon ${escapeHTML(course.color)}"
                >

                    <i
                        class="${escapeHTML(course.icon)}"
                    ></i>

                </div>


                <span class="course-level">

                    ${escapeHTML(course.level)}

                </span>

            </div>


            <div class="course-content">

                <h3>

                    ${escapeHTML(course.title)}

                </h3>


                <p>

                    ${escapeHTML(course.description)}

                </p>


                <div class="course-meta">

                    <span>

                        <i
                            class="fa-regular fa-clock"
                        ></i>

                        ${escapeHTML(course.duration)}

                    </span>


                    <span>

                        <i
                            class="fa-solid fa-book"
                        ></i>

                        ${Number(course.lessons) || 0}
                        Lessons

                    </span>

                </div>


                ${
                    enrolled
                        ? `

                    <div class="course-progress">

                        <div class="progress-header">

                            <span>
                                Progress
                            </span>

                            <strong>
                                ${progress}%
                            </strong>

                        </div>


                        <div class="progress-track">

                            <div
                                class="progress-fill"
                                style="width:${progress}%"
                            ></div>

                        </div>

                    </div>

                    `
                        : ""
                }


                ${
                    score !== null
                        ? `

                    <div class="course-score">

                        <i
                            class="fa-solid fa-star"
                        ></i>

                        Result:

                        <strong>
                            ${score}%
                        </strong>

                    </div>

                    `
                        : ""
                }


                <div class="course-skills">

                    ${
                        Array.isArray(course.skills)
                            ? course.skills
                                .slice(0, 4)
                                .map(
                                    skill =>
                                        `<span>
                                            ${escapeHTML(skill)}
                                        </span>`
                                )
                                .join("")
                            : ""
                    }

                </div>


                ${
                    signs.length
                        ? `

                    <div class="course-sign-count">

                        <i
                            class="fa-solid fa-hand"
                        ></i>

                        ${signs.length}
                        practice signs

                    </div>

                    `
                        : ""
                }

            </div>


            <div class="course-footer">

                ${
                    enrolled
                        ? `

                    <span
                        class="enrolled-label"
                    >

                        <i
                            class="fa-solid fa-circle-check"
                        ></i>

                        Enrolled

                    </span>

                    `
                        : `<span></span>`
                }


                <div class="course-footer-actions">

                    <button
                        type="button"
                        class="course-view-btn"
                        data-view-course="${courseId}"
                    >

                        View

                    </button>

                    ${actionHTML}

                </div>

            </div>

        </article>

    `;

}


/* =========================================================
   ATTACH DYNAMIC COURSE BUTTONS
   ========================================================= */

function attachCourseButtons() {

    /* -----------------------------------------
       ENROLL
    ----------------------------------------- */

    document
        .querySelectorAll(
            "[data-enroll]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    async function (event) {

                        event.preventDefault();

                        event.stopPropagation();


                        const courseId =
                            Number(
                                this.dataset.enroll
                            );


                        this.disabled =
                            true;


                        const originalHTML =
                            this.innerHTML;


                        this.innerHTML = `

                            <i
                                class="fa-solid fa-spinner fa-spin"
                            ></i>

                            Enrolling...

                        `;


                        const success =
                            await enrollCourse(
                                courseId
                            );


                        if (success) {

                            /*
                               Immediately open the
                               course practice page.
                            */

                            setTimeout(
                                () => {

                                    openCoursePractice(
                                        courseId
                                    );

                                },
                                400
                            );

                            return;

                        }


                        this.disabled =
                            false;

                        this.innerHTML =
                            originalHTML;

                    }
                );

            }
        );


    /* -----------------------------------------
       CONTINUE
    ----------------------------------------- */

    document
        .querySelectorAll(
            "[data-continue]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    function (event) {

                        event.preventDefault();

                        event.stopPropagation();


                        const courseId =
                            Number(
                                this.dataset.continue
                            );


                        openCoursePractice(
                            courseId
                        );

                    }
                );

            }
        );


    /* -----------------------------------------
       CERTIFICATE
    ----------------------------------------- */

    document
        .querySelectorAll(
            "[data-certificate]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    function (event) {

                        event.preventDefault();

                        event.stopPropagation();


                        const courseId =
                            Number(
                                this.dataset.certificate
                            );


                        openCertificate(
                            courseId
                        );

                    }
                );

            }
        );


    /* -----------------------------------------
       VIEW COURSE
    ----------------------------------------- */

    document
        .querySelectorAll(
            "[data-view-course]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    function (event) {

                        event.preventDefault();

                        event.stopPropagation();


                        const courseId =
                            Number(
                                this.dataset.viewCourse
                            );


                        openCourseDetails(
                            courseId
                        );

                    }
                );

            }
        );

}


/* =========================================================
   ENROLL COURSE
   ========================================================= */

async function enrollCourse(
    courseId
) {

    const course =
        courses.find(
            item =>
                Number(item.id) ===
                Number(courseId)
        );


    if (!course) {

        showNotification(
            "Course could not be found.",
            "error"
        );

        return false;

    }


    if (
        isCourseEnrolled(
            courseId
        )
    ) {

        showNotification(
            "You are already enrolled in this course.",
            "info"
        );

        return true;

    }


    const userId =
        currentUser.id;


    try {

        const token =
            localStorage.getItem(
                "token"
            );


        const headers = {

            "Content-Type":
                "application/json"

        };


        if (token) {

            headers.Authorization =
                `Bearer ${token}`;

        }


        const response =
            await fetch(
                `${COURSES_API}/${courseId}/enroll`,
                {
                    method:
                        "POST",

                    headers,

                    body:
                        JSON.stringify({

                            user_id:
                                userId

                        })

                }
            );


        if (!response.ok) {

            console.warn(
                "Course enrollment API returned:",
                response.status
            );

        }

    }
    catch (error) {

        console.warn(
            "Enrollment API unavailable. Using local enrollment.",
            error
        );

    }


    /*
       Save local enrollment.

       This keeps the course page usable
       even when the API is unavailable.
    */

    enrollments[courseId] = {

        courseId:
            Number(courseId),

        userId:
            userId,

        enrolledAt:
            new Date().toISOString(),

        progress:
            0,

        completed:
            false,

        score:
            null

    };


    /*
       Save course-specific practice data.
    */

    saveActiveCourse(
        course
    );


    saveCourseData();


    renderAllCourseSections();


    showNotification(
        `Enrolled in ${course.title}. Opening practice...`,
        "success"
    );


    return true;

}


/* =========================================================
   SAVE ACTIVE COURSE
   ========================================================= */

function saveActiveCourse(
    course
) {

    if (!course) {

        return;

    }


    const signs =
        Array.isArray(course.signs)
            ? [...course.signs]
            : [];


    localStorage.setItem(
        ACTIVE_COURSE_KEY,
        String(course.id)
    );


    localStorage.setItem(
        ACTIVE_COURSE_DATA_KEY,
        JSON.stringify({

            id:
                Number(course.id),

            title:
                course.title,

            shortTitle:
                course.shortTitle,

            category:
                course.category,

            level:
                course.level,

            signs:
                signs,

            lessons:
                Number(course.lessons) || 0,

            progress:
                getCourseProgress(
                    course.id
                )

        })
    );


    /*
       Separate sign sequence key.

       Useful for practice.js integration.
    */

    localStorage.setItem(
        "course_practice_signs",
        JSON.stringify(
            signs
        )
    );


    localStorage.setItem(
        "course_practice_title",
        course.title || ""
    );

}


/* =========================================================
   OPEN COURSE PRACTICE
   ========================================================= */

function openCoursePractice(
    courseId
) {

    const course =
        courses.find(
            item =>
                Number(item.id) ===
                Number(courseId)
        );


    if (!course) {

        showNotification(
            "Course could not be found.",
            "error"
        );

        return;

    }


    /*
       Course practice requires enrollment.
    */

    if (
        !isCourseEnrolled(
            courseId
        )
    ) {

        showNotification(
            "Please enroll in this course first.",
            "info"
        );

        return;

    }


    saveActiveCourse(
        course
    );


    /*
       IMPORTANT:

       Your verified FastAPI project has
       /practice.

       course-practice.html was NOT VERIFIED
       from the provided backend files.

       Therefore use /practice.
    */

    const signs =
        Array.isArray(course.signs)
            ? course.signs
            : [];


    const firstSign =
        signs.length
            ? signs[0]
            : "";


    const params =
        new URLSearchParams();


    params.set(
        "course",
        String(course.id)
    );


    if (firstSign) {

        params.set(
            "sign",
            firstSign
        );

    }


    window.location.href =
        `/practice?${params.toString()}`;

}


/* =========================================================
   UPDATE COURSE PROGRESS
   ========================================================= */

function updateCourseProgress(
    courseId,
    progress
) {

    progress =
        Math.max(
            0,
            Math.min(
                100,
                Number(progress) || 0
            )
        );


    if (
        !enrollments[courseId]
    ) {

        enrollments[courseId] = {

            courseId:
                Number(courseId),

            userId:
                currentUser.id,

            enrolledAt:
                new Date().toISOString(),

            progress:
                0,

            completed:
                false,

            score:
                null

        };

    }


    enrollments[courseId].progress =
        progress;


    if (
        progress >= 100
    ) {

        enrollments[courseId].completed =
            true;

    }


    saveCourseData();

    renderAllCourseSections();

}


/* =========================================================
   COMPLETE COURSE
   ========================================================= */

async function completeCourse(
    courseId,
    score = 0
) {

    score =
        Math.max(
            0,
            Math.min(
                100,
                Number(score) || 0
            )
        );


    if (
        !enrollments[courseId]
    ) {

        const enrolled =
            await enrollCourse(
                courseId
            );


        if (!enrolled) {

            return null;

        }

    }


    enrollments[courseId].progress =
        100;

    enrollments[courseId].completed =
        true;

    enrollments[courseId].score =
        score;


    const certificate =
        createCertificate(
            courseId,
            score
        );


    if (certificate) {

        certificates[courseId] =
            certificate;

    }


    saveCourseData();


    try {

        const token =
            localStorage.getItem(
                "token"
            );


        const headers = {

            "Content-Type":
                "application/json"

        };


        if (token) {

            headers.Authorization =
                `Bearer ${token}`;

        }


        await fetch(
            `${COURSES_API}/${courseId}/complete`,
            {
                method:
                    "POST",

                headers,

                body:
                    JSON.stringify({

                        user_id:
                            currentUser.id,

                        score:
                            score

                    })

            }
        );

    }
    catch (error) {

        console.warn(
            "Course completion API unavailable.",
            error
        );

    }


    renderAllCourseSections();


    showNotification(
        "Course completed! Your certificate is ready.",
        "success"
    );


    return certificate;

}


/* =========================================================
   CREATE CERTIFICATE
   ========================================================= */

function createCertificate(
    courseId,
    score
) {

    const course =
        courses.find(
            item =>
                Number(item.id) ===
                Number(courseId)
        );


    if (!course) {

        return null;

    }


    return {

        id:
            `CERT-${Date.now()}`,

        courseId:
            Number(courseId),

        courseTitle:
            course.title,

        userId:
            currentUser.id,

        userName:
            currentUser.username,

        score:
            score,

        issuedAt:
            new Date().toISOString(),

        status:
            "Issued"

    };

}


/* =========================================================
   OPEN CERTIFICATE
   ========================================================= */

function openCertificate(
    courseId
) {

    const certificate =
        certificates[courseId];


    if (!certificate) {

        showNotification(
            "Certificate is not available yet.",
            "info"
        );

        return;

    }


    localStorage.setItem(
        "selected_certificate",
        JSON.stringify(
            certificate
        )
    );


    /*
       Keep certificate page support.

       If your certificate page is later
       exposed by FastAPI, this URL can be
       changed to that verified route.
    */

    // window.location.href =
    //     `certificate.html?course=${encodeURIComponent(courseId)}`;
        window.location.href =
        `/certificate?course=${courseId}`;

}


/* =========================================================
   COURSE STATUS
   ========================================================= */

function isCourseEnrolled(
    courseId
) {

    return Boolean(
        enrollments[courseId]
    );

}


function isCourseCompleted(
    courseId
) {

    return Boolean(

        enrollments[courseId] &&

        enrollments[courseId].completed

    );

}


function getCourseProgress(
    courseId
) {

    if (
        !enrollments[courseId]
    ) {

        return 0;

    }


    return Math.max(
        0,
        Math.min(
            100,
            Number(
                enrollments[courseId].progress
            ) || 0
        )
    );

}


function getCourseScore(
    courseId
) {

    if (
        !enrollments[courseId]
    ) {

        return null;

    }


    const score =
        enrollments[courseId].score;


    if (
        score === null ||
        score === undefined
    ) {

        return null;

    }


    return Number(score);

}


/* =========================================================
   MY COURSES
   ========================================================= */

function renderMyCourses() {

    const container =
        document.getElementById(
            "myCourseGrid"
        ) ||
        document.getElementById(
            "myCourseList"
        );


    const empty =
        document.getElementById(
            "emptyMyCourses"
        );


    if (!container) {

        return;

    }


    const myCourses =
        courses.filter(
            course =>
                isCourseEnrolled(
                    course.id
                )
        );


    if (
        myCourses.length === 0
    ) {

        container.innerHTML =
            "";


        if (empty) {

            empty.classList.remove(
                "hidden"
            );

        }

        return;

    }


    if (empty) {

        empty.classList.add(
            "hidden"
        );

    }


    container.innerHTML =
        myCourses
            .map(
                createMyCourseCard
            )
            .join("");


    attachCourseButtons();

}


/* =========================================================
   MY COURSE CARD
   ========================================================= */

function createMyCourseCard(
    course
) {

    const progress =
        getCourseProgress(
            course.id
        );


    const completed =
        isCourseCompleted(
            course.id
        );


    return `

        <article
            class="course-card my-course-card"
            data-course-id="${Number(course.id)}"
        >

            <div class="course-card-top">

                <div
                    class="course-icon ${escapeHTML(course.color)}"
                >

                    <i
                        class="${escapeHTML(course.icon)}"
                    ></i>

                </div>

                <span class="course-level">

                    ${escapeHTML(course.level)}

                </span>

            </div>


            <div class="course-content">

                <h3>
                    ${escapeHTML(course.title)}
                </h3>


                <p>
                    ${escapeHTML(course.description)}
                </p>


                <div class="course-progress">

                    <div class="progress-header">

                        <span>
                            Progress
                        </span>

                        <strong>
                            ${progress}%
                        </strong>

                    </div>


                    <div class="progress-track">

                        <div
                            class="progress-fill"
                            style="width:${progress}%"
                        ></div>

                    </div>

                </div>

            </div>


            <div class="course-footer">

                <span class="enrolled-label">

                    <i
                        class="fa-solid fa-circle-check"
                    ></i>

                    ${
                        completed
                            ? "Completed"
                            : "Enrolled"
                    }

                </span>


                <button
                    type="button"
                    class="course-action-btn ${
                        completed
                            ? "certificate-btn"
                            : "continue-btn"
                    }"
                    ${
                        completed
                            ? `data-certificate="${Number(course.id)}"`
                            : `data-continue="${Number(course.id)}"`
                    }
                >

                    <i
                        class="fa-solid ${
                            completed
                                ? "fa-award"
                                : "fa-play"
                        }"
                    ></i>

                    ${
                        completed
                            ? "Certificate"
                            : "Continue"
                    }

                </button>

            </div>

        </article>

    `;

}


/* =========================================================
   COMPLETED COURSES
   ========================================================= */

function renderCompletedCourses() {

    const container =
        document.getElementById(
            "completedCourseGrid"
        );


    if (!container) {

        return;

    }


    const completedCourses =
        courses.filter(
            course =>
                isCourseCompleted(
                    course.id
                )
        );


    if (
        completedCourses.length === 0
    ) {

        container.innerHTML = `

            <div class="empty-courses">

                <div class="empty-course-icon">

                    <i
                        class="fa-solid fa-award"
                    ></i>

                </div>

                <h3>
                    No completed courses yet
                </h3>

                <p>
                    Complete a course to see it here.
                </p>

            </div>

        `;

        return;

    }


    container.innerHTML =
        completedCourses
            .map(
                createCourseCard
            )
            .join("");


    attachCourseButtons();

}


/* =========================================================
   CERTIFICATES
   ========================================================= */

function renderCertificates() {

    const container =
        document.getElementById(
            "certificateGrid"
        );


    const empty =
        document.getElementById(
            "emptyCertificates"
        );


    if (!container) {

        return;

    }


    const certificateList =
        Object.values(
            certificates
        );


    if (
        certificateList.length === 0
    ) {

        container.innerHTML =
            "";


        if (empty) {

            empty.classList.remove(
                "hidden"
            );

        }

        return;

    }


    if (empty) {

        empty.classList.add(
            "hidden"
        );

    }


    container.innerHTML =
        certificateList
            .map(
                certificate => `

                    <article class="certificate-card">

                        <div class="certificate-icon">

                            <i
                                class="fa-solid fa-award"
                            ></i>

                        </div>


                        <div class="certificate-content">

                            <span>
                                CERTIFICATE
                            </span>

                            <h3>
                                ${escapeHTML(
                                    certificate.courseTitle
                                )}
                            </h3>

                            <p>
                                Score:
                                <strong>
                                    ${Number(
                                        certificate.score
                                    )}%
                                </strong>
                            </p>

                            <small>
                                Issued
                                ${formatDate(
                                    certificate.issuedAt
                                )}
                            </small>

                        </div>


                        <button
                            type="button"
                            class="course-action-btn certificate-btn"
                            data-certificate="${Number(
                                certificate.courseId
                            )}"
                        >

                            <i
                                class="fa-solid fa-eye"
                            ></i>

                            View Certificate

                        </button>

                    </article>

                `
            )
            .join("");


    attachCourseButtons();

}


/* =========================================================
   COURSE DETAILS MODAL
   ========================================================= */

function openCourseDetails(
    courseId
) {

    const course =
        courses.find(
            item =>
                Number(item.id) ===
                Number(courseId)
        );


    if (!course) {

        showNotification(
            "Course not found.",
            "error"
        );

        return;

    }


    const modal =
        document.getElementById(
            "courseModal"
        );


    const content =
        document.getElementById(
            "courseModalContent"
        );


    if (!modal || !content) {

        /*
           Fallback:
           directly open practice if modal
           doesn't exist in this HTML.
        */

        if (
            isCourseEnrolled(
                courseId
            )
        ) {

            openCoursePractice(
                courseId
            );

        }
        else {

            enrollCourse(
                courseId
            );

        }

        return;

    }


    const enrolled =
        isCourseEnrolled(
            courseId
        );


    const completed =
        isCourseCompleted(
            courseId
        );


    const progress =
        getCourseProgress(
            courseId
        );


    const signs =
        Array.isArray(course.signs)
            ? course.signs
            : [];


    content.innerHTML = `

        <div class="course-modal-header">

            <div
                class="course-icon ${escapeHTML(course.color)}"
            >

                <i
                    class="${escapeHTML(course.icon)}"
                ></i>

            </div>


            <div>

                <span class="course-level">

                    ${escapeHTML(course.level)}

                </span>

                <h2>

                    ${escapeHTML(course.title)}

                </h2>

            </div>

        </div>


        <p class="course-modal-description">

            ${escapeHTML(course.description)}

        </p>


        <div class="course-modal-meta">

            <span>

                <i
                    class="fa-regular fa-clock"
                ></i>

                ${escapeHTML(course.duration)}

            </span>


            <span>

                <i
                    class="fa-solid fa-book"
                ></i>

                ${Number(course.lessons) || 0}
                Lessons

            </span>


            <span>

                <i
                    class="fa-solid fa-hand"
                ></i>

                ${signs.length}
                Practice Signs

            </span>

        </div>


        ${
            enrolled
                ? `

            <div class="course-modal-progress">

                <div>

                    <span>
                        Your Progress
                    </span>

                    <strong>
                        ${progress}%
                    </strong>

                </div>


                <div class="progress-track">

                    <div
                        class="progress-fill"
                        style="width:${progress}%"
                    ></div>

                </div>

            </div>

            `
                : ""
        }


        <div class="course-modal-skills">

            <h3>
                What you'll learn
            </h3>


            <div>

                ${
                    Array.isArray(course.skills)
                        ? course.skills
                            .map(
                                skill => `

                                    <span>

                                        <i
                                            class="fa-solid fa-check"
                                        ></i>

                                        ${escapeHTML(
                                            skill
                                        )}

                                    </span>

                                `
                            )
                            .join("")
                        : ""
                }

            </div>

        </div>


        ${
            signs.length
                ? `

            <div class="course-modal-signs">

                <h3>
                    Course Practice
                </h3>

                <p>
                    This course contains
                    ${signs.length}
                    practice signs.
                </p>


                <div class="course-sign-list">

                    ${
                        signs
                            .slice(0, 12)
                            .map(
                                sign => `

                                    <span>
                                        ${escapeHTML(
                                            sign
                                        )}
                                    </span>

                                `
                            )
                            .join("")
                    }

                    ${
                        signs.length > 12
                            ? `
                                <span>
                                    +${signs.length - 12} more
                                </span>
                              `
                            : ""
                    }

                </div>

            </div>

            `
                : ""
        }


        <div class="course-modal-actions">

            ${
                completed
                    ? `

                    <button
                        type="button"
                        class="course-action-btn certificate-btn"
                        data-certificate="${Number(course.id)}"
                    >

                        <i
                            class="fa-solid fa-award"
                        ></i>

                        View Certificate

                    </button>

                    `
                    : enrolled
                        ? `

                        <button
                            type="button"
                            class="course-action-btn continue-btn"
                            data-continue="${Number(course.id)}"
                        >

                            <i
                                class="fa-solid fa-play"
                            ></i>

                            Continue Practice

                        </button>

                        `
                        : `

                        <button
                            type="button"
                            class="course-action-btn enroll-btn"
                            data-enroll="${Number(course.id)}"
                        >

                            <i
                                class="fa-solid fa-plus"
                            ></i>

                            Enroll & Practice

                        </button>

                        `

            }

        </div>

    `;


    modal.classList.remove(
        "hidden"
    );


    modal.classList.add(
        "open"
    );


    document.body.classList.add(
        "modal-open"
    );


    attachModalDynamicButtons();

}


/* =========================================================
   MODAL DYNAMIC BUTTONS
   ========================================================= */

function attachModalDynamicButtons() {

    const modal =
        document.getElementById(
            "courseModal"
        );


    if (!modal) {

        return;

    }


    modal
        .querySelectorAll(
            "[data-enroll]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    async function () {

                        const courseId =
                            Number(
                                this.dataset.enroll
                            );


                        const success =
                            await enrollCourse(
                                courseId
                            );


                        if (success) {

                            closeCourseModal();


                            setTimeout(
                                () => {

                                    openCoursePractice(
                                        courseId
                                    );

                                },
                                400
                            );

                        }

                    }
                );

            }
        );


    modal
        .querySelectorAll(
            "[data-continue]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    function () {

                        const courseId =
                            Number(
                                this.dataset.continue
                            );


                        closeCourseModal();


                        openCoursePractice(
                            courseId
                        );

                    }
                );

            }
        );


    modal
        .querySelectorAll(
            "[data-certificate]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    function () {

                        const courseId =
                            Number(
                                this.dataset.certificate
                            );


                        openCertificate(
                            courseId
                        );

                    }
                );

            }
        );

}


/* =========================================================
   MODAL EVENTS
   ========================================================= */

function setupModalEvents() {

    const modal =
        document.getElementById(
            "courseModal"
        );


    if (!modal) {

        return;

    }


    modal
        .querySelectorAll(
            "[data-close-modal]"
        )
        .forEach(
            element => {

                element.addEventListener(
                    "click",
                    closeCourseModal
                );

            }
        );


    document.addEventListener(
        "keydown",
        function (event) {

            if (
                event.key ===
                "Escape"
            ) {

                closeCourseModal();

            }

        }
    );

}


/* =========================================================
   CLOSE MODAL
   ========================================================= */

function closeCourseModal() {

    const modal =
        document.getElementById(
            "courseModal"
        );


    if (!modal) {

        return;

    }


    modal.classList.remove(
        "open"
    );


    modal.classList.add(
        "hidden"
    );


    document.body.classList.remove(
        "modal-open"
    );

}


/* =========================================================
   LEARNING SUMMARY
   ========================================================= */

function updateLearningSummary() {

    const enrolledCourses =
        courses.filter(
            course =>
                isCourseEnrolled(
                    course.id
                )
        );


    const completedCourses =
        enrolledCourses.filter(
            course =>
                isCourseCompleted(
                    course.id
                )
        );


    let averageProgress =
        0;


    if (
        enrolledCourses.length
    ) {

        averageProgress =
            Math.round(

                enrolledCourses.reduce(
                    (
                        total,
                        course
                    ) => {

                        return (
                            total +
                            getCourseProgress(
                                course.id
                            )
                        );

                    },
                    0
                ) /
                enrolledCourses.length

            );

    }


    setText(
        "learningPercent",
        `${averageProgress}%`
    );


    setText(
        "learningSummaryText",

        enrolledCourses.length
            ? `${completedCourses.length} of ${enrolledCourses.length} courses completed`
            : "Start your first course"

    );

}


/* =========================================================
   COURSE STATISTICS
   ========================================================= */

function updateCourseStatistics() {

    const total =
        courses.length;


    const userEnrollments =
        Object.values(
            enrollments
        )
            .filter(
                item =>

                    item &&

                    (
                        item.userId == null ||
                        currentUser.id == null ||
                        item.userId ==
                            currentUser.id
                    )

            );


    const enrolled =
        userEnrollments.length;


    const completed =
        userEnrollments.filter(
            item =>
                item.completed
        ).length;


    const certificateCount =
        Object.values(
            certificates
        ).filter(
            certificate =>
                certificate &&
                (
                    certificate.userId == null ||
                    currentUser.id == null ||
                    certificate.userId ==
                        currentUser.id
                )
        ).length;


    setText(
        "totalCourses",
        total
    );


    setText(
        "enrolledCourses",
        enrolled
    );


    setText(
        "completedCourses",
        completed
    );


    setText(
        "certificateCount",
        certificateCount
    );


    setText(
        "courseCount",
        total
    );


    setText(
        "myCoursesCount",
        enrolled
    );


    /*
       Your current course HTML has courseXp.
    */

    const xp =
        Number(
            localStorage.getItem(
                "xp"
            )
        ) || 0;


    setText(
        "courseXp",
        xp
    );

}


/* =========================================================
   LOGOUT
   ========================================================= */

function logoutUser() {

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
        "userId"
    );

    localStorage.removeItem(
        "username"
    );

    localStorage.removeItem(
        "name"
    );

    localStorage.removeItem(
        "email"
    );

    localStorage.removeItem(
        "currentUser"
    );


    window.location.href =
        "/login";

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
            "courseNotification"
        );


    if (!notification) {

        notification =
            document.createElement(
                "div"
            );


        notification.id =
            "courseNotification";


        notification.className =
            "course-notification";


        document.body.appendChild(
            notification
        );

    }


    const icon =
        type === "success"
            ? "fa-solid fa-circle-check"
            : type === "error"
                ? "fa-solid fa-circle-xmark"
                : "fa-solid fa-circle-info";


    notification.className =
        `course-notification ${type}`;


    notification.innerHTML = `

        <i
            class="${icon}"
        ></i>

        <span>
            ${escapeHTML(message)}
        </span>

    `;


    requestAnimationFrame(
        () => {

            notification.classList.add(
                "show"
            );

        }
    );


    clearTimeout(
        notification._timeout
    );


    notification._timeout =
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
   SET TEXT
   ========================================================= */

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
            value;

    }

}


/* =========================================================
   FORMAT DATE
   ========================================================= */

function formatDate(
    value
) {

    if (!value) {

        return "—";

    }


    try {

        return new Date(
            value
        ).toLocaleDateString(
            undefined,
            {
                day: "numeric",
                month: "short",
                year: "numeric"
            }
        );

    }
    catch (error) {

        return "—";

    }

}


/* =========================================================
   ESCAPE HTML
   ========================================================= */

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
   GLOBAL COURSE API
   ========================================================= */

window.SignAICourses = {

    getCourses:
        () => courses,

    enrollCourse,

    openCoursePractice,

    openCourseDetails,

    updateCourseProgress,

    completeCourse,

    getCourseProgress,

    getCourseScore,

    isCourseEnrolled,

    isCourseCompleted,

    createCertificate,

    openCertificate,

    closeCourseModal

};


/* =========================================================
   BACKWARD COMPATIBILITY
   ========================================================= */

window.scrollToCourses =
    scrollToCourses;

window.logoutUser =
    logoutUser;
function previewCertificate(courseId) {

    if (!courseId) {
        return;
    }

    window.location.href =
        `/certificate.html?course=${courseId}&preview=true`;

}