"use strict";

/*
=========================================================
SIGN AI DASHBOARD
=========================================================

Dashboard is driven by recorded practice data.

Expected practice record:

{
    target: "A",
    prediction: "A",
    confidence: 91.5,
    is_correct: true,
    timestamp: "2026-09-21T18:30:00"
}

The code also accepts common alternative property names
so it remains compatible with your existing practice data.
=========================================================
*/


/* =======================================================
   CONFIGURATION
======================================================= */

const API_BASE = "";

const REFRESH_INTERVAL = 10000;


/* =======================================================
   STATE
======================================================= */

let dashboardData = {
    attempts: 0,
    correct: 0,
    xp: 0,
    streak: 0,
    predictions: []
};

let refreshTimer = null;


/* =======================================================
   DOM HELPERS
======================================================= */

function $(id) {
    return document.getElementById(id);
}


function safeNumber(value, fallback = 0) {

    const number = Number(value);

    return Number.isFinite(number)
        ? number
        : fallback;
}


/* =======================================================
   USER
======================================================= */

function loadUser() {

    const possibleNames = [
        localStorage.getItem("name"),
        localStorage.getItem("username"),
        localStorage.getItem("userName")
    ];

    const name = possibleNames.find(
        value =>
            value &&
            value.trim()
    );

    $("userName").textContent =
        name || "Learner";
}


/* =======================================================
   AUTH
======================================================= */

function getUserId() {

    return (
        localStorage.getItem("user_id") ||
        localStorage.getItem("userId") ||
        localStorage.getItem("id") ||
        ""
    );
}


function getToken() {

    return (
        localStorage.getItem("token") ||
        localStorage.getItem("access_token") ||
        ""
    );
}


/* =======================================================
   API REQUEST
======================================================= */

async function apiRequest(url) {

    const token = getToken();

    const headers = {};

    if (token) {

        headers.Authorization =
            `Bearer ${token}`;
    }

    const response =
        await fetch(url, {
            method: "GET",
            headers,
            credentials: "include"
        });

    if (!response.ok) {

        throw new Error(
            `HTTP ${response.status}`
        );
    }

    return await response.json();
}


/* =======================================================
   LOCAL PRACTICE DATA
======================================================= */

function getLocalPracticeData() {

    const possibleKeys = [

        "practice_history",

        "practiceHistory",

        "predictionHistory",

        "predictions",

        "practiceStats"

    ];


    for (const key of possibleKeys) {

        const stored =
            localStorage.getItem(key);


        if (!stored) {
            continue;
        }


        try {

            const parsed =
                JSON.parse(stored);


            if (Array.isArray(parsed)) {

                return {
                    predictions: parsed
                };
            }


            if (
                parsed &&
                typeof parsed === "object"
            ) {

                return parsed;
            }

        }
        catch (error) {

            console.warn(
                "Invalid practice data:",
                key
            );
        }
    }


    return null;
}


/* =======================================================
   NORMALIZE PRACTICE RECORD
======================================================= */

function normalizePrediction(item) {

    if (!item || typeof item !== "object") {
        return null;
    }


    const target =
        String(
            item.target ??
            item.target_sign ??
            item.expected ??
            item.expected_sign ??
            ""
        ).trim();


    const prediction =
        String(
            item.prediction ??
            item.predicted ??
            item.detected ??
            item.label ??
            ""
        ).trim();


    const confidence =
        safeNumber(
            item.confidence ??
            item.prediction_confidence ??
            item.score ??
            0
        );


    let correct;


    if (
        typeof item.is_correct === "boolean"
    ) {

        correct =
            item.is_correct;

    }
    else if (
        typeof item.correct === "boolean"
    ) {

        correct =
            item.correct;

    }
    else {

        correct =
            Boolean(
                target &&
                prediction &&
                target.toLowerCase() ===
                prediction.toLowerCase()
            );
    }


    const timestamp =
        item.timestamp ??
        item.created_at ??
        item.date ??
        item.time ??
        null;


    return {

        target,

        prediction,

        confidence,

        correct,

        timestamp

    };
}


/* =======================================================
   NORMALIZE ALL PRACTICE DATA
======================================================= */

function normalizeData(raw) {

    if (!raw) {

        return {
            attempts: 0,
            correct: 0,
            xp: 0,
            streak: 0,
            predictions: []
        };
    }


    let predictions = [];


    if (Array.isArray(raw)) {

        predictions =
            raw.map(
                normalizePrediction
            );

    }
    else if (
        Array.isArray(raw.predictions)
    ) {

        predictions =
            raw.predictions.map(
                normalizePrediction
            );

    }
    else if (
        Array.isArray(raw.history)
    ) {

        predictions =
            raw.history.map(
                normalizePrediction
            );
    }


    predictions =
        predictions.filter(Boolean);


    const attempts =
        safeNumber(
            raw.attempts ??
            raw.total_attempts ??
            raw.totalAttempts ??
            predictions.length
        );


    const correct =
        safeNumber(
            raw.correct ??
            raw.correct_predictions ??
            raw.correctPredictions ??
            predictions.filter(
                item => item.correct
            ).length
        );


    const xp =
        safeNumber(
            raw.xp ??
            raw.totalXP ??
            raw.earnedXP ??
            0
        );


    const streak =
        safeNumber(
            raw.streak ??
            raw.currentStreak ??
            0
        );


    return {

        attempts,

        correct,

        xp,

        streak,

        predictions

    };
}


/* =======================================================
   LOAD DASHBOARD FROM BACKEND
======================================================= */

async function loadBackendData() {

    const userId =
        getUserId();


    if (!userId) {

        console.warn(
            "No user ID found."
        );

        return null;
    }


    try {

        const progress =
            await apiRequest(
                `/practice/progress/${encodeURIComponent(userId)}`
            );


        return progress;

    }
    catch (error) {

        console.warn(
            "Dashboard backend request failed:",
            error
        );

        return null;
    }
}


/* =======================================================
   MERGE DATA
======================================================= */

function buildDashboardData(
    backendData,
    localData
) {

    /*
    Backend is preferred because it should represent
    persisted practice data.

    Local data is used only when backend data is not
    available.
    */


    if (backendData) {

        return normalizeData(
            backendData
        );
    }


    return normalizeData(
        localData
    );
}


/* =======================================================
   ACCURACY
======================================================= */

function calculateAccuracy(
    attempts,
    correct
) {

    if (
        attempts <= 0
    ) {

        return 0;
    }


    return Math.round(
        (
            correct /
            attempts
        ) * 100
    );
}


/* =======================================================
   LEVEL
======================================================= */

function calculateLevel(
    xp
) {

    if (xp >= 1000) {
        return "Advanced";
    }

    if (xp >= 500) {
        return "Intermediate";
    }

    return "Beginner";
}


/* =======================================================
   UPDATE KPI
======================================================= */

function updateKPI(data) {

    const accuracy =
        calculateAccuracy(
            data.attempts,
            data.correct
        );


    $("overallAccuracy")
        .textContent =
        `${accuracy}%`;


    $("correctPredictions")
        .textContent =
        data.correct;


    $("streakCount")
        .textContent =
        data.streak;


    $("totalXP")
        .textContent =
        data.xp;


    const level =
        calculateLevel(
            data.xp
        );


    $("dashboardLevel")
        .textContent =
        level;


    $("levelProgress")
        .textContent =
        `${data.xp} XP`;
}


/* =======================================================
   PERFORMANCE SCORE
======================================================= */

function calculatePerformanceScore(
    accuracy,
    streak,
    xp
) {

    if (
        accuracy === 0 &&
        streak === 0 &&
        xp === 0
    ) {

        return 0;
    }


    /*
    This is a dashboard visualization score,
    not an AI/model accuracy score.
    */


    const score =
        (
            accuracy * 0.60
        ) +
        (
            Math.min(
                streak * 4,
                20
            )
        ) +
        (
            Math.min(
                xp / 50,
                20
            )
        );


    return Math.min(
        100,
        Math.round(score)
    );
}


/* =======================================================
   UPDATE PERFORMANCE
======================================================= */

function updatePerformance(data) {

    const accuracy =
        calculateAccuracy(
            data.attempts,
            data.correct
        );


    const score =
        calculatePerformanceScore(
            accuracy,
            data.streak,
            data.xp
        );


    $("scoreValue")
        .textContent =
        score;


    const circle =
        $("scoreCircle");


    if (circle) {

        const degrees =
            score * 3.6;


        circle.style.background =
            `conic-gradient(
                var(--success) 0deg,
                var(--success) ${degrees}deg,
                #E3ECEE ${degrees}deg,
                #E3ECEE 360deg
            )`;
    }


    const consistency =
        Math.min(
            100,
            data.streak * 10
        );


    const mastery =
        accuracy;


    const improvement =
        data.predictions.length > 1
            ? calculateImprovement(
                data.predictions
            )
            : 0;


    setMetric(
        "accuracyBar",
        "accuracyMetric",
        accuracy
    );


    setMetric(
        "consistencyBar",
        "consistencyMetric",
        consistency
    );


    setMetric(
        "masteryBar",
        "masteryMetric",
        mastery
    );


    setMetric(
        "improvementBar",
        "improvementMetric",
        improvement
    );
}


/* =======================================================
   METRIC
======================================================= */

function setMetric(
    barId,
    textId,
    value
) {

    const safeValue =
        Math.max(
            0,
            Math.min(
                100,
                Math.round(value)
            )
        );


    const bar =
        $(barId);


    const text =
        $(textId);


    if (bar) {

        bar.style.width =
            `${safeValue}%`;
    }


    if (text) {

        text.textContent =
            `${safeValue}%`;
    }
}


/* =======================================================
   IMPROVEMENT
======================================================= */

function calculateImprovement(
    predictions
) {

    if (
        predictions.length < 4
    ) {

        return 0;
    }


    const middle =
        Math.floor(
            predictions.length / 2
        );


    const first =
        predictions.slice(
            0,
            middle
        );


    const second =
        predictions.slice(
            middle
        );


    const firstAccuracy =
        calculateAccuracy(
            first.length,
            first.filter(
                item => item.correct
            ).length
        );


    const secondAccuracy =
        calculateAccuracy(
            second.length,
            second.filter(
                item => item.correct
            ).length
        );


    if (secondAccuracy <= firstAccuracy) {

        return secondAccuracy;
    }


    return Math.min(
        100,
        secondAccuracy +
        (
            secondAccuracy -
            firstAccuracy
        )
    );
}


/* =======================================================
   AI COACH
======================================================= */

function updateCoach(data) {

    const accuracy =
        calculateAccuracy(
            data.attempts,
            data.correct
        );


    const coachMessage =
        $("coachMessage");


    const coachFocus =
        $("coachFocus");


    if (!data.attempts) {

        coachMessage.textContent =
            "Start your first practice session. Once you record attempts, your dashboard will identify patterns in your performance.";

        coachFocus.innerHTML = `
            <span class="focus-tag">
                Start practicing
            </span>
        `;

        return;
    }


    if (accuracy < 50) {

        coachMessage.textContent =
            "Your recorded accuracy is below 50%. Focus on hand position, finger placement and keeping your hand clearly inside the camera frame.";

    }
    else if (accuracy < 75) {

        coachMessage.textContent =
            "You are building consistency. Continue practicing the signs that produce incorrect predictions and compare your hand position with the reference.";

    }
    else {

        coachMessage.textContent =
            "Your recorded accuracy is strong. Continue practicing weaker signs and work toward maintaining the same accuracy across different sessions.";
    }


    const focusSigns =
        getWeakSigns(
            data.predictions
        );


    if (!focusSigns.length) {

        coachFocus.innerHTML = `
            <span class="focus-tag">
                Keep practicing
            </span>
        `;

        return;
    }


    coachFocus.innerHTML =
        focusSigns
            .slice(0, 3)
            .map(
                sign => `
                    <span class="focus-tag">
                        Practice ${escapeHTML(sign)}
                    </span>
                `
            )
            .join("");
}


/* =======================================================
   WEAK SIGNS
======================================================= */

function getWeakSigns(
    predictions
) {

    const stats =
        {};


    predictions.forEach(
        item => {

            const sign =
                (
                    item.target ||
                    item.prediction
                ).toUpperCase();


            if (!sign) {
                return;
            }


            if (!stats[sign]) {

                stats[sign] = {

                    attempts: 0,
                    correct: 0

                };
            }


            stats[sign].attempts++;


            if (item.correct) {

                stats[sign].correct++;
            }
        }
    );


    return Object.entries(stats)

        .map(
            ([sign, value]) => ({

                sign,

                attempts:
                    value.attempts,

                correct:
                    value.correct,

                accuracy:
                    calculateAccuracy(
                        value.attempts,
                        value.correct
                    )

            })
        )

        .sort(
            (a, b) => {

                if (
                    a.accuracy !==
                    b.accuracy
                ) {

                    return (
                        a.accuracy -
                        b.accuracy
                    );
                }


                return (
                    b.attempts -
                    a.attempts
                );
            }
        )

        .map(
            item => item.sign
        );
}


/* =======================================================
   PRACTICE FOCUS
======================================================= */

function renderPracticeFocus(
    predictions
) {

    const container =
        $("practiceFocus");


    const stats =
        {};


    predictions.forEach(
        item => {

            const sign =
                (
                    item.target ||
                    item.prediction
                ).toUpperCase();


            if (!sign) {
                return;
            }


            if (!stats[sign]) {

                stats[sign] = {

                    attempts: 0,
                    correct: 0,
                    bestConfidence: 0

                };
            }


            stats[sign].attempts++;


            if (item.correct) {

                stats[sign].correct++;
            }


            stats[sign].bestConfidence =
                Math.max(
                    stats[sign].bestConfidence,
                    item.confidence
                );
        }
    );


    const signs =
        Object.entries(stats)

            .map(
                ([sign, value]) => ({

                    sign,

                    ...value,

                    accuracy:
                        calculateAccuracy(
                            value.attempts,
                            value.correct
                        )

                })
            )

            .sort(
                (a, b) =>
                    a.accuracy -
                    b.accuracy
            )

            .slice(0, 3);


    if (!signs.length) {

        container.innerHTML = `
            <div class="empty-state">

                <i class="fa-solid fa-hand"></i>

                Practice some signs to generate
                personalized recommendations.

            </div>
        `;

        return;
    }


    container.innerHTML =
        signs.map(
            item => {

                const difficulty =
                    item.accuracy >= 80
                        ? "easy"
                        : item.accuracy >= 50
                            ? "medium"
                            : "hard";


                const difficultyText =
                    difficulty === "easy"
                        ? "Review"
                        : difficulty === "medium"
                            ? "Improve"
                            : "Needs Practice";


                return `

                    <div class="focus-card">

                        <div class="focus-top">

                            <div class="sign-letter">
                                ${escapeHTML(item.sign)}
                            </div>

                            <span class="difficulty ${difficulty}">
                                ${difficultyText}
                            </span>

                        </div>


                        <h3>
                            Sign ${escapeHTML(item.sign)}
                        </h3>


                        <p>
                            ${item.attempts}
                            attempt${item.attempts === 1 ? "" : "s"}
                            ·
                            ${item.correct}
                            correct
                        </p>


                        <div class="mini-progress">

                            <div style="
                                width:${item.accuracy}%;
                            "></div>

                        </div>


                        <div class="focus-bottom">

                            <span>
                                ${item.accuracy}% accuracy
                            </span>


                            <button
                                class="practice-small-btn"
                                type="button"
                                onclick="practiceSign('${escapeJS(item.sign)}')">

                                Practice

                            </button>

                        </div>

                    </div>

                `;
            }
        ).join("");
}


/* =======================================================
   RECENT PREDICTIONS
======================================================= */

function renderRecentPredictions(
    predictions
) {

    const container =
        $("recentPredictions");


    if (!predictions.length) {

        container.innerHTML = `
            <div class="empty-state">

                <i class="fa-solid fa-chart-line"></i>

                No practice attempts recorded yet.

            </div>
        `;

        return;
    }


    const recent =
        [...predictions]
            .reverse()
            .slice(0, 8);


    container.innerHTML =
        recent.map(
            item => {

                const target =
                    item.target || "-";


                const prediction =
                    item.prediction || "-";


                const confidence =
                    Math.round(
                        item.confidence
                    );


                const resultClass =
                    item.correct
                        ? "correct"
                        : "incorrect";


                const resultText =
                    item.correct
                        ? "Correct"
                        : "Incorrect";


                return `

                    <div class="recent-item">

                        <div class="recent-sign">
                            ${escapeHTML(target)}
                        </div>


                        <div class="recent-info">

                            <strong>
                                Target:
                                ${escapeHTML(target)}
                            </strong>

                            <small>
                                Predicted:
                                ${escapeHTML(prediction)}
                                ·
                                ${confidence}% confidence
                            </small>

                        </div>


                        <div class="
                            recent-result
                            ${resultClass}
                        ">

                            ${resultText}

                        </div>

                    </div>

                `;
            }
        ).join("");
}


/* =======================================================
   SIGN PERFORMANCE TABLE
======================================================= */

function renderSignPerformance(
    predictions
) {

    const tbody =
        $("signPerformance");


    if (!predictions.length) {

        tbody.innerHTML = `

            <tr>

                <td colspan="6">

                    <div class="empty-state">

                        <i class="fa-solid fa-hand"></i>

                        No sign performance data yet.

                    </div>

                </td>

            </tr>

        `;

        return;
    }


    const stats =
        {};


    predictions.forEach(
        item => {

            const sign =
                (
                    item.target ||
                    item.prediction
                ).toUpperCase();


            if (!sign) {
                return;
            }


            if (!stats[sign]) {

                stats[sign] = {

                    attempts: 0,
                    correct: 0,
                    bestConfidence: 0

                };
            }


            stats[sign].attempts++;


            if (item.correct) {

                stats[sign].correct++;
            }


            stats[sign].bestConfidence =
                Math.max(
                    stats[sign].bestConfidence,
                    item.confidence
                );
        }
    );


    const rows =
        Object.entries(stats)

            .map(
                ([sign, value]) => {

                    const accuracy =
                        calculateAccuracy(
                            value.attempts,
                            value.correct
                        );


                    let className =
                        "accuracy-low";


                    if (accuracy >= 80) {

                        className =
                            "accuracy-good";

                    }
                    else if (accuracy >= 50) {

                        className =
                            "accuracy-mid";
                    }


                    return `

                        <tr>

                            <td>
                                ${escapeHTML(sign)}
                            </td>

                            <td>
                                ${value.attempts}
                            </td>

                            <td>
                                ${value.correct}
                            </td>

                            <td>

                                <span class="
                                    accuracy-pill
                                    ${className}
                                ">

                                    ${accuracy}%

                                </span>

                            </td>

                            <td>
                                ${Math.round(
                                    value.bestConfidence
                                )}%
                            </td>

                            <td>

                                <button
                                    class="practice-small-btn"
                                    type="button"
                                    onclick="practiceSign('${escapeJS(sign)}')">

                                    Practice

                                </button>

                            </td>

                        </tr>

                    `;
                }
            );


    tbody.innerHTML =
        rows.join("");
}


/* =======================================================
   PRACTICE SIGN
======================================================= */

function practiceSign(sign) {

    if (!sign) {
        return;
    }


    const encoded =
        encodeURIComponent(
            sign
        );


    window.location.href =
        `/practice?sign=${encoded}`;
}


/* =======================================================
   REFRESH DASHBOARD
======================================================= */

async function refreshDashboard() {

    try {

        const backendData =
            await loadBackendData();


        const localData =
            getLocalPracticeData();


        dashboardData =
            buildDashboardData(
                backendData,
                localData
            );


        updateKPI(
            dashboardData
        );


        updatePerformance(
            dashboardData
        );


        updateCoach(
            dashboardData
        );


        renderPracticeFocus(
            dashboardData.predictions
        );


        renderRecentPredictions(
            dashboardData.predictions
        );


        renderSignPerformance(
            dashboardData.predictions
        );


    }
    catch (error) {

        console.error(
            "Dashboard update failed:",
            error
        );
    }
}


/* =======================================================
   LOGOUT
======================================================= */

function logout() {

    localStorage.removeItem("token");

    localStorage.removeItem(
        "access_token"
    );

    localStorage.removeItem(
        "user_id"
    );

    localStorage.removeItem(
        "userId"
    );

    localStorage.removeItem(
        "name"
    );

    localStorage.removeItem(
        "username"
    );

    window.location.href =
        "/login";
}


/* =======================================================
   ESCAPE HTML
======================================================= */

function escapeHTML(value) {

    return String(value)

        .replaceAll(
            "&",
            "&amp;"
        )

        .replaceAll(
            "<",
            "&lt;"
        )

        .replaceAll(
            ">",
            "&gt;"
        )

        .replaceAll(
            '"',
            "&quot;"
        )

        .replaceAll(
            "'",
            "&#039;"
        );
}


function escapeJS(value) {

    return String(value)
        .replaceAll(
            "\\",
            "\\\\"
        )
        .replaceAll(
            "'",
            "\\'"
        )
        .replaceAll(
            "\n",
            "\\n"
        );
}


/* =======================================================
   EVENTS
======================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        loadUser();


        const logout =
            $("logoutBtn");


        if (logout) {

            logout.addEventListener(
                "click",
                logout
            );
        }


        refreshDashboard();


        /*
        Refresh while the dashboard is open.
        This allows a completed practice attempt
        to appear without manually refreshing.
        */

        refreshTimer =
            setInterval(
                refreshDashboard,
                REFRESH_INTERVAL
            );
    }
);


/* =======================================================
   REFRESH WHEN RETURNING TO DASHBOARD
======================================================= */

window.addEventListener(
    "focus",
    () => {

        refreshDashboard();

    }
);


document.addEventListener(
    "visibilitychange",
    () => {

        if (
            document.visibilityState ===
            "visible"
        ) {

            refreshDashboard();
        }
    }
);


/* =======================================================
   CROSS-TAB UPDATE
======================================================= */

window.addEventListener(
    "storage",
    event => {

        if (
            event.key ===
            "practice_updated_at"
        ) {

            refreshDashboard();
        }
    }
);