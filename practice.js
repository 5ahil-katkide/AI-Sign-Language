"use strict";

/*
Frontend flow:

Start Practice
↓
Camera
↓
MediaPipe Hands
↓
21 hand landmarks
↓
Capture original camera frame
↓
POST /api/ai/predict
↓
Existing FastAPI ML backend
↓
Prediction + confidence + correctness
↓
POST /practice/attempt
↓
Progress / XP / streak

IMPORTANT:

Existing ML model is NOT changed.

Existing backend endpoint is NOT changed.

Camera frame sent to backend is NOT mirrored.

Landmark drawing is mirrored only for visual alignment.
========================================================= */

/* =========================================================
API
========================================================= */

const PREDICT_API_URL = "/api/ai/predict";
const PRACTICE_ATTEMPT_URL = "/practice/attempt";
const PROGRESS_API_URL = "/practice/progress";
const RECOMMENDATION_API_URL = "/practice/recommendation";

/* =========================================================
CAMERA CONFIGURATION
========================================================= */

const CAMERA_WIDTH = 1280;
const CAMERA_HEIGHT = 720;

/*
Landmark data older than this is considered stale.
*/
const MAX_LANDMARK_AGE = 1000;

/* =========================================================
DOM ELEMENTS
========================================================= */

const video =
document.getElementById("video");

const landmarkCanvas =
document.getElementById("landmarkCanvas");

const captureCanvas =
document.getElementById("captureCanvas") ||
document.createElement("canvas");

const startBtn =
document.getElementById("startBtn");

const stopBtn =
document.getElementById("stopBtn");

const recognizeBtn =
document.getElementById("recognizeBtn");

const cameraStatus =
document.getElementById("cameraStatus");

const cameraOverlay =
document.getElementById("cameraOverlay");

const landmarkStatus =
document.getElementById("landmarkStatus");

const fpsElement =
document.getElementById("fps");

/* =========================================================
REFERENCE SIGN
========================================================= */

const predictSignImage =
document.getElementById("predictSignImage");

const predictImagePlaceholder =
document.getElementById("predictImagePlaceholder");

const referenceLoading =
document.getElementById("referenceLoading");

const predictSignName =
document.getElementById("predictSignName");

const predictSignTitle =
document.getElementById("predictSignTitle");

const predictSignDescription =
document.getElementById("predictSignDescription");

const targetCategory =
document.getElementById("targetCategory");

const targetDifficulty =
document.getElementById("targetDifficulty");

const targetWord =
document.getElementById("targetWord");

const currentSignNumber =
document.getElementById("currentSignNumber");

const selectedSignLabel =
document.getElementById("selectedSignLabel");

const selectedCount =
document.getElementById("selectedCount");

/* =========================================================
RESULT
========================================================= */

const predictionElement =
document.getElementById("prediction");

const confidenceText =
document.getElementById("confidenceText");

const predictionStatus =
document.getElementById("predictionStatus");

const resultTarget =
document.getElementById("resultTarget");

const resultDetected =
document.getElementById("resultDetected");

const resultMessage =
document.getElementById("resultMessage");

const resultMessageText =
document.getElementById("resultMessageText");

const suggestionTitle =
document.getElementById("suggestionTitle");

const suggestionText =
document.getElementById("suggestionText");

const recommendationElement =
document.getElementById("recommendation");

const progressCircle =
document.getElementById("progressCircle");

/* =========================================================
RESULT BUTTONS
========================================================= */

const tryAgainBtn =
document.getElementById("tryAgainBtn");

const nextWordBtn =
document.getElementById("nextWord");

/* =========================================================
SESSION
========================================================= */

const sessionProgress =
document.getElementById("sessionProgress");

const sessionProgressBar =
document.getElementById("sessionProgressBar");

const sessionProgressPercent =
document.getElementById(
"sessionProgressPercent"
);

const earnedXPElement =
document.getElementById("earnedXP");

const attemptsElement =
document.getElementById("attempts");

const correctElement =
document.getElementById("correct");

const practiceAccuracyElement =
document.getElementById("practiceAccuracy");

const practiceStreakElement =
document.getElementById("practiceStreak");

const goalPercent =
document.getElementById("goalPercent");

const goalText =
document.getElementById("goalText");

const goalBar =
document.getElementById("goalBar");

const currentLevel =
document.getElementById("currentLevel");

/* =========================================================
SETTINGS
========================================================= */

const difficultyElement =
document.getElementById("difficulty");

const sessionLengthElement =
document.getElementById("sessionLength");

const signCategoryElement =
document.getElementById("signCategory");

const sessionTimer =
document.getElementById("sessionTimer");

/* =========================================================
PRACTICE CONTROLS
========================================================= */

const startPracticeBtn =
document.getElementById("startPractice");

const customModeBtn =
document.getElementById("customMode");

const randomModeBtn =
document.getElementById("randomMode");

const weakModeBtn =
document.getElementById("weakMode");

const practiceStatusBtn =
document.getElementById("practiceStatusBtn");

/* =========================================================
CANVAS CONTEXT
========================================================= */

const landmarkCtx =
landmarkCanvas
? landmarkCanvas.getContext("2d")
: null;

const captureCtx =
captureCanvas
? captureCanvas.getContext("2d")
: null;

/* =========================================================
STATE
========================================================= */

let stream = null;

let hands = null;

let mediaPipeReady = false;

let isCameraRunning = false;

let isProcessingFrame = false;

let isGuessing = false;

let isFrameFrozen = false;

let animationFrameId = null;

let latestLandmarks = null;

let latestHandedness = null;

let latestLandmarkTime = 0;

let latestFrameTime = 0;

let frameCounter = 0;

let currentWord = "A";

let currentDifficulty =
difficultyElement?.value || "easy";

let sessionTotal =
Number(sessionLengthElement?.value) || 10;

let currentAttempt = 0;

let sessionActive = false;

let practiceMode = "custom";

let weakSign = null;

let lastPrediction = null;

let lastConfidence = 0;

let lastResultCorrect = false;

let earnedXP = 0;

let attemptsCount = 0;

let correctCount = 0;

let streakCount = 0;

/* =========================================================
SIGN IMAGES
========================================================= */

const SIGN_IMAGES = {};

"ABCDEFGHIJKLMNOPQRSTUVWXYZ"
.split("")
.forEach(letter => {

    SIGN_IMAGES[letter] = [

        `/static/images/signs/${letter}.jpg`,

        `/static/images/signs/${letter}.jpeg`,

        `/static/images/signs/${letter}.png`,

        `/static/images/signs/${letter}.webp`,

        `/static/images/sign_language/${letter}.jpg`,

        `/static/images/sign_language/${letter}.jpeg`,

        `/static/images/sign_language/${letter}.png`,

        `/static/images/sign_language/${letter}.webp`

    ];

});

/* =========================================================
USER / AUTH
========================================================= */

function getUserId() {

return (
    localStorage.getItem("user_id") ||
    localStorage.getItem("userId") ||
    ""
);

}

function getAuthHeaders() {

const token =
    localStorage.getItem("token");

if (!token) {
    return {};
}

return {
    Authorization: `Bearer ${token}`
};

}

/* =========================================================
INITIALIZATION
========================================================= */

if (
document.readyState === "loading"
) {

document.addEventListener(
    "DOMContentLoaded",
    initializePage,
    { once: true }
);

}
else {

initializePage();

}

async function initializePage() {

console.log(
    "✓ SignAI practice page initializing..."
);

setupButtons();

setupPracticeModes();

setupAlphabetButtons();

setupDifficulty();

setupSessionLength();

updateCameraUI(false);

resetResult();

updateStatistics();

updateSessionUI();

updateTargetDisplay();

await selectSign("A");

const ready =
    await waitForMediaPipe();

if (!ready) {

    if (landmarkStatus) {

        landmarkStatus.textContent =
            "⚠ MediaPipe failed to load.";

    }

    console.error(
        "MediaPipe Hands could not be loaded."
    );

}

await loadProgress();

await loadRecommendation();

autoCheckCamera();

console.log(
    "✓ SignAI practice page ready."
);

}

/* =========================================================
WAIT FOR MEDIAPIPE
========================================================= */

function waitForMediaPipe() {

return new Promise(resolve => {

    if (
        typeof window.Hands === "function"
    ) {

        resolve(true);

        return;
    }

    let attempts = 0;

    const maxAttempts = 150;

    const timer =
        setInterval(() => {

            attempts++;

            if (
                typeof window.Hands === "function"
            ) {

                clearInterval(timer);

                console.log(
                    "✓ MediaPipe Hands loaded."
                );

                resolve(true);

                return;
            }

            if (
                attempts >= maxAttempts
            ) {

                clearInterval(timer);

                resolve(false);
            }

        }, 100);

});

}

/* =========================================================
BUTTON SETUP
========================================================= */

function setupButtons() {

if (startPracticeBtn) {

    startPracticeBtn.addEventListener(
        "click",
        async event => {

            event.preventDefault();

            await startPractice();

        }
    );

}


if (startBtn) {

    startBtn.addEventListener(
        "click",
        async event => {

            event.preventDefault();

            await startCamera();

        }
    );

}


if (stopBtn) {

    stopBtn.addEventListener(
        "click",
        event => {

            event.preventDefault();

            stopCamera();

        }
    );

}


if (recognizeBtn) {

    recognizeBtn.addEventListener(
        "click",
        async event => {

            event.preventDefault();

            await guessSign();

        }
    );

}


if (tryAgainBtn) {

    tryAgainBtn.addEventListener(
        "click",
        async event => {

            event.preventDefault();

            await tryAgain();

        }
    );

}


if (nextWordBtn) {

    nextWordBtn.addEventListener(
        "click",
        async event => {

            event.preventDefault();

            await nextSign();

        }
    );

}


if (practiceStatusBtn) {

    practiceStatusBtn.addEventListener(
        "click",
        async event => {

            event.preventDefault();

            if (!isCameraRunning) {

                await startCamera();

            }

        }
    );

}


const logoutBtn =
    document.getElementById("logoutBtn");

if (logoutBtn) {

    logoutBtn.addEventListener(
        "click",
        () => {

            stopCamera();

            localStorage.removeItem("token");

            localStorage.removeItem("name");

            localStorage.removeItem("user_id");

            localStorage.removeItem("userId");

            localStorage.removeItem("currentUser");

            window.location.href = "/";

        }
    );

}

}

/* =========================================================
PRACTICE MODES
========================================================= */

function setupPracticeModes() {

const modes = [

    [customModeBtn, "custom"],

    [randomModeBtn, "random"],

    [weakModeBtn, "weak"]

];


modes.forEach(
    ([button, mode]) => {

        if (!button) {
            return;
        }

        button.addEventListener(
            "click",
            async event => {

                event.preventDefault();

                if (sessionActive) {
                    return;
                }

                practiceMode = mode;

                modes.forEach(
                    ([item]) => {

                        if (item) {

                            item.classList.toggle(
                                "active",
                                item === button
                            );

                        }

                    }
                );


                if (mode === "custom") {

                    updateTargetDisplay();

                    if (selectedSignLabel) {

                        selectedSignLabel.textContent =
                            `Selected: ${currentWord}`;

                    }

                    if (selectedCount) {

                        selectedCount.textContent =
                            "1 selected";

                    }

                }


                else if (mode === "random") {

                    clearSelectedSignChip();

                    if (selectedSignLabel) {

                        selectedSignLabel.textContent =
                            "Random signs";

                    }

                    if (selectedCount) {

                        selectedCount.textContent =
                            "Auto selected";

                    }

                }


                else {

                    clearSelectedSignChip();

                    await refreshWeakSign();

                    if (selectedSignLabel) {

                        selectedSignLabel.textContent =
                            weakSign
                                ? `Weak sign: ${weakSign}`
                                : "Weak sign will be selected";

                    }

                    if (selectedCount) {

                        selectedCount.textContent =
                            weakSign
                                ? "1 recommended"
                                : "Needs history";

                    }

                }

            }
        );

    }
);

}

/* =========================================================
ALPHABET BUTTONS
========================================================= */

function setupAlphabetButtons() {

document
    .querySelectorAll(".sign-chip")
    .forEach(button => {

        if (
            button.dataset.practiceBound === "1"
        ) {

            return;
        }

        const sign =
            String(
                button.dataset.sign || ""
            )
            .trim()
            .toUpperCase();

        if (
            !/^[A-Z]$/.test(sign)
        ) {

            return;
        }

        button.dataset.practiceBound =
            "1";

        button.addEventListener(
            "click",
            async event => {

                event.preventDefault();

                if (sessionActive) {
                    return;
                }

                practiceMode = "custom";

                if (customModeBtn) {

                    customModeBtn.classList.add(
                        "active"
                    );

                }

                if (randomModeBtn) {

                    randomModeBtn.classList.remove(
                        "active"
                    );

                }

                if (weakModeBtn) {

                    weakModeBtn.classList.remove(
                        "active"
                    );

                }

                await selectSign(sign);

            }
        );

    });

}

/* =========================================================
SELECT SIGN
========================================================= */

async function selectSign(sign) {

const normalized =
    String(sign || "A")
        .trim()
        .toUpperCase();

if (
    !/^[A-Z]$/.test(normalized)
) {

    return;

}

currentWord =
    normalized;


document
    .querySelectorAll(".sign-chip")
    .forEach(button => {

        const value =
            String(
                button.dataset.sign || ""
            )
            .trim()
            .toUpperCase();

        const selected =
            value === currentWord;

        button.classList.toggle(
            "selected",
            selected
        );

        button.setAttribute(
            "aria-pressed",
            selected
                ? "true"
                : "false"
        );

    });


updateTargetDisplay();

await loadReferenceImage(
    currentWord
);


latestLandmarks = null;

latestHandedness = null;

latestLandmarkTime = 0;

lastPrediction = null;

lastConfidence = 0;

lastResultCorrect = false;


if (selectedSignLabel) {

    selectedSignLabel.textContent =
        `Selected: ${currentWord}`;

}


if (selectedCount) {

    selectedCount.textContent =
        "1 selected";

}


updateGuessButton();

}



/* =========================================================
TARGET DISPLAY
========================================================= */

function updateTargetDisplay() {

currentDifficulty =
    difficultyElement?.value ||
    "easy";


if (predictSignName) {

    predictSignName.textContent =
        currentWord;

}


if (predictSignTitle) {

    predictSignTitle.textContent =
        `Practice the "${currentWord}" sign`;

}


if (predictSignDescription) {

    predictSignDescription.textContent =
        `Perform the "${currentWord}" sign clearly in front of the camera, then click Guess Sign.`;

}


if (targetCategory) {

    targetCategory.textContent =
        "Alphabet";

}


if (targetDifficulty) {

    targetDifficulty.textContent =
        capitalize(
            currentDifficulty
        );

}


if (targetWord) {

    targetWord.textContent =
        currentWord;

}


if (resultTarget) {

    resultTarget.textContent =
        currentWord;

}


if (currentSignNumber) {

    currentSignNumber.textContent =
        String(
            Math.max(
                1,
                currentAttempt + 1
            )
        ).padStart(2, "0");

}

}

/* =========================================================
LOAD REFERENCE IMAGE
========================================================= */

async function loadReferenceImage(sign) {

if (!predictSignImage) {

    return false;

}


const normalized =
    String(sign || "A")
        .trim()
        .toUpperCase();

const candidates =
    SIGN_IMAGES[normalized] || [];


predictSignImage.style.display =
    "none";

predictSignImage.removeAttribute(
    "src"
);


if (referenceLoading) {

    referenceLoading.style.display =
        "flex";

}


if (predictImagePlaceholder) {

    predictImagePlaceholder.style.display =
        "none";

}


for (
    const src of candidates
) {

    try {

        await loadImage(src);

        predictSignImage.src =
            src;

        predictSignImage.alt =
            `Sign language reference for ${normalized}`;

        predictSignImage.style.display =
            "block";


        if (referenceLoading) {

            referenceLoading.style.display =
                "none";

        }


        if (predictImagePlaceholder) {

            predictImagePlaceholder.style.display =
                "none";

        }


        return true;

    }
    catch (_) {

        continue;

    }

}


if (referenceLoading) {

    referenceLoading.style.display =
        "none";

}


if (predictImagePlaceholder) {

    predictImagePlaceholder.style.display =
        "flex";

    const message =
        predictImagePlaceholder.querySelector(
            "span"
        );

    if (message) {

        message.textContent =
            `Reference image for "${normalized}" was not found.`;

    }

}


return false;

}

function loadImage(src) {

return new Promise(
    (resolve, reject) => {

        const image =
            new Image();

        image.onload =
            () => resolve(image);

        image.onerror =
            () => reject(
                new Error(
                    `Image not found: ${src}`
                )
            );

        image.src =
            src;

    }
);

}

/* =========================================================
MEDIAPIPE INITIALIZATION
========================================================= */

function initializeMediaPipe() {

if (mediaPipeReady) {

    return true;

}


if (
    typeof window.Hands !== "function"
) {

    return false;

}


try {

    hands =
        new window.Hands({

            locateFile: file =>
                `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`

        });


    hands.setOptions({

        maxNumHands: 1,

        modelComplexity: 1,

        minDetectionConfidence: 0.65,

        minTrackingConfidence: 0.65

    });


    hands.onResults(
        handleHandResults
    );


    mediaPipeReady = true;

    console.log(
        "✓ MediaPipe initialized."
    );

    return true;

}
catch (error) {

    console.error(
        "MediaPipe initialization error:",
        error
    );

    mediaPipeReady = false;

    return false;

}

}

/* =========================================================
START CAMERA
========================================================= */

async function startCamera() {

if (isCameraRunning) {

    return true;

}


try {

    if (
        !navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia
    ) {

        throw new Error(
            "Camera API is not supported by this browser."
        );

    }


    if (!mediaPipeReady) {

        const ready =
            initializeMediaPipe();

        if (!ready) {

            throw new Error(
                "MediaPipe is not ready."
            );

        }

    }


    updateCameraStatus(
        "Requesting camera..."
    );


   stream =
await navigator.mediaDevices.getUserMedia({

    video: {

        width: {
            ideal: CAMERA_WIDTH
        },

        height: {
            ideal: CAMERA_HEIGHT
        },

        facingMode: "user"

    },

    audio: false

});

if (!video) {

throw new Error(
    "Video element was not found."
);

}

video.srcObject =
stream;

if (cameraOverlay) {

cameraOverlay.hidden =
    true;

cameraOverlay.classList.add(
    "hidden"
);

}

    video.srcObject =
        stream;


    await waitForVideoReady();


    await video.play();


    isCameraRunning = true;

    isGuessing = false;

    isFrameFrozen = false;

    latestLandmarks = null;

    latestHandedness = null;

    latestLandmarkTime = 0;


    updateCameraStatus(
        "Camera active"
    );

    updateLandmarkStatus(
        "✋ Looking for hand..."
    );


    updateCameraUI(true);

    updateGuessButton();

    resizeLandmarkCanvas();

    processCameraFrame();


    console.log(
        "✓ Camera started."
    );


    return true;

}
catch (error) {

    console.error(
        "Camera error:",
        error
    );


    isCameraRunning =
        false;


    if (cameraOverlay) {

        cameraOverlay.hidden =
            false;

        cameraOverlay.classList.remove(
            "hidden"
        );

    }


    updateCameraStatus(
        "Camera unavailable"
    );


    updateLandmarkStatus(
        "Camera could not be started"
    );


    updateCameraUI(false);

    updateGuessButton();


    showCameraError(
        error
    );


    return false;

}

}

/* =========================================================
WAIT FOR VIDEO
========================================================= */

function waitForVideoReady() {

return new Promise(
    (resolve, reject) => {

        if (!video) {

            reject(
                new Error(
                    "Video element missing."
                )
            );

            return;

        }


        if (
            video.readyState >= 1
        ) {

            resolve();

            return;

        }


        const timeout =
            setTimeout(
                () => {

                    reject(
                        new Error(
                            "Camera video initialization timed out."
                        )
                    );

                },
                10000
            );


        video.onloadedmetadata =
            () => {

                clearTimeout(
                    timeout
                );

                resolve();

            };

    }
);

}

/* =========================================================
PROCESS CAMERA FRAME
========================================================= */

/* =========================================================
PROCESS CAMERA FRAME
========================================================= */

async function processCameraFrame() {

if (!isCameraRunning) {
    return;
}

animationFrameId =
    requestAnimationFrame(
        processCameraFrame
    );

/*
   Keep MediaPipe running continuously.

   IMPORTANT:
   Do NOT stop landmark detection while
   Guess Sign is processing.
*/

if (
isProcessingFrame ||
video.readyState < 2

) {
return;
}

isProcessingFrame = true;

try {

    console.log(
        "MediaPipe processing frame..."
    );

    await hands.send({
        image: video
    });

    console.log(
        "MediaPipe frame processed."
    );

}


catch (error) {

    console.warn(
        "MediaPipe frame error:",
        error
    );

}
finally {

    isProcessingFrame = false;

}

}

/* =========================================================
MEDIAPIPE RESULTS
========================================================= */

function handleHandResults(results) {

if (
    !video ||
    !landmarkCanvas ||
    !landmarkCtx
) {

    return;

}


const width =
    video.videoWidth ||
    CAMERA_WIDTH;

const height =
    video.videoHeight ||
    CAMERA_HEIGHT;


if (
    landmarkCanvas.width !== width ||
    landmarkCanvas.height !== height
) {

    landmarkCanvas.width =
        width;

    landmarkCanvas.height =
        height;

}


landmarkCtx.clearRect(
    0,
    0,
    width,
    height
);


if (
    !results ||
    !results.multiHandLandmarks ||
    results.multiHandLandmarks.length === 0
) {

    latestLandmarks =
        null;

    latestHandedness =
        null;

    latestLandmarkTime =
        0;


    updateLandmarkStatus(
        "✋ No hand detected"
    );

    updateGuessButton();

    return;

}


const hand =
    results.multiHandLandmarks[0];


if (
    !hand ||
    hand.length !== 21
) {

    latestLandmarks =
        null;

    latestHandedness =
        null;

    latestLandmarkTime =
        0;

    updateGuessButton();

    return;

}


latestLandmarks =
    hand.map(
        point => ({

            x: Number(point.x),

            y: Number(point.y),

            z: Number(point.z)

        })
    );


latestHandedness =
    results.multiHandedness?.[0] ||
    null;


latestLandmarkTime =
    performance.now();


frameCounter++;


drawHandLandmarks(
    hand,
    width,
    height
);


updateLandmarkStatus(
    "✓ Hand detected • 21 landmarks"
);


updateGuessButton();

}

/* =========================================================
DRAW LANDMARKS
========================================================= */

function drawHandLandmarks(
landmarks,
width,
height
) {

if (
    !landmarkCtx ||
    !landmarks
) {

    return;

}


const connections = [

    [0, 1],
    [1, 2],
    [2, 3],
    [3, 4],

    [0, 5],
    [5, 6],
    [6, 7],
    [7, 8],

    [0, 9],
    [9, 10],
    [10, 11],
    [11, 12],

    [0, 13],
    [13, 14],
    [14, 15],
    [15, 16],

    [0, 17],
    [17, 18],
    [18, 19],
    [19, 20],

    [5, 9],
    [9, 13],
    [13, 17]

];


/*
   IMPORTANT:

   The video display is mirrored by the HTML/CSS.

   Therefore landmarks are mirrored ONLY when drawn.

   The original video frame remains unchanged
   when sent to FastAPI.
*/

landmarkCtx.lineWidth =
    3;

landmarkCtx.strokeStyle =
    "#2563eb";


connections.forEach(
    ([a, b]) => {

        const pointA =
            landmarks[a];

        const pointB =
            landmarks[b];


        if (
            !pointA ||
            !pointB
        ) {

            return;

        }


        const x1 =
            (1 - pointA.x) *
            width;

        const y1 =
            pointA.y *
            height;

        const x2 =
            (1 - pointB.x) *
            width;

        const y2 =
            pointB.y *
            height;


        landmarkCtx.beginPath();

        landmarkCtx.moveTo(
            x1,
            y1
        );

        landmarkCtx.lineTo(
            x2,
            y2
        );

        landmarkCtx.stroke();

    }
);


landmarkCtx.fillStyle =
    "#ffffff";

landmarkCtx.strokeStyle =
    "#2563eb";

landmarkCtx.lineWidth =
    2;


landmarks.forEach(
    point => {

        const x =
            (1 - point.x) *
            width;

        const y =
            point.y *
            height;


        landmarkCtx.beginPath();

        landmarkCtx.arc(
            x,
            y,
            5,
            0,
            Math.PI * 2
        );

        landmarkCtx.fill();

        landmarkCtx.stroke();

    }
);

}

/* =========================================================
RESIZE LANDMARK CANVAS
========================================================= */

function resizeLandmarkCanvas() {

if (
    !video ||
    !landmarkCanvas
) {

    return;

}


const width =
    video.videoWidth ||
    CAMERA_WIDTH;

const height =
    video.videoHeight ||
    CAMERA_HEIGHT;


if (
    width > 0 &&
    height > 0
) {

    landmarkCanvas.width =
        width;

    landmarkCanvas.height =
        height;

}

}
/* =========================================================
CAMERA / LANDMARK STATUS HELPERS
========================================================= */

function updateCameraStatus(message) {

if (!cameraStatus) {
    return;
}

cameraStatus.textContent = String(message || "");

}

function updateLandmarkStatus(message) {

if (!landmarkStatus) {
    return;
}

landmarkStatus.textContent = String(message || "");

}

/* =========================================================
CAMERA UI
========================================================= */

function updateCameraUI(running) {

if (startBtn) {

    startBtn.disabled =
        running;

}


if (stopBtn) {

    stopBtn.disabled =
        !running;

}


if (!running) {

    if (cameraOverlay) {

        cameraOverlay.hidden =
            false;

        cameraOverlay.classList.remove(
            "hidden"
        );

    }

}

}



/* =========================================================
GUESS BUTTON
========================================================= */

function updateGuessButton() {

if (!recognizeBtn) {
    return;
}

/*
   IMPORTANT:
   Do not disable Guess Sign just because the last
   MediaPipe landmark frame became slightly old.

   guessSign() performs a fresh MediaPipe detection
   before sending the image to FastAPI.
*/

const canGuess =
    isCameraRunning &&
    !isGuessing;

recognizeBtn.disabled =
    !canGuess;

if (canGuess) {

    recognizeBtn.removeAttribute("disabled");

    recognizeBtn.title =
        "Click to recognize your sign.";

}
else if (!isCameraRunning) {

    recognizeBtn.title =
        "Start the camera first.";

}
else if (isGuessing) {

    recognizeBtn.title =
        "Sign recognition is in progress.";

}

}

/* =========================================================
LANDMARK FRESHNESS
========================================================= */

function isLandmarkFresh() {

if (
    !latestLandmarks ||
    latestLandmarks.length !== 21
) {

    return false;

}


if (
    !latestLandmarkTime
) {

    return false;

}


const age =
    performance.now() -
    latestLandmarkTime;


return (
    age >= 0 &&
    age <= MAX_LANDMARK_AGE
);

}



/* =========================================================
FORCE FRESH HAND DETECTION
========================================================= */

async function forceFreshHandDetection() {

    if (!isCameraRunning || !video || !hands) {
        return false;
    }

    /*
     * Ask MediaPipe to process the current camera frame.
     * The result will update latestLandmarks through
     * handleHandResults().
     */

    try {

        await hands.send({
            image: video
        });

    }
    catch (error) {

        console.warn(
            "Fresh MediaPipe detection failed:",
            error
        );

        return false;
    }

    /*
     * Give onResults() a short amount of time to update
     * latestLandmarks.
     */

    const startTime =
        performance.now();

    const timeout =
        1500;

    while (
        performance.now() - startTime <
        timeout
    ) {

        if (
            latestLandmarks &&
            latestLandmarks.length === 21 &&
            latestLandmarkTime > 0
        ) {

            return true;
        }

        await sleep(50);
    }

    return (
        latestLandmarks &&
        latestLandmarks.length === 21
    );
}

/* =========================================================
CURRENT TARGET
========================================================= */

function getCurrentTarget() {

return String(
    currentWord || "A"
)
.trim()
.toUpperCase();

}
/* =========================================================
GUESS SIGN
========================================================= */


async function guessSign() {

if (isGuessing) {
    return;
}

if (!isCameraRunning) {

    showPredictionError(
        "Please start the camera first."
    );

    return;
}

if (!video || video.readyState < 2) {

    showPredictionError(
        "Camera frame is not ready."
    );

    return;
}

isGuessing = true;

updateGuessButton();

try {

    updateCameraStatus(
        "Checking hand..."
    );


    // --------------------------------------------------
    // GET FRESH MEDIAPIPE DETECTION
    // --------------------------------------------------

    const detected =
        await forceFreshHandDetection();

    if (!detected) {

        showNoHandResult();

        return;
    }

    // --------------------------------------------------
    // CAPTURE CURRENT CAMERA FRAME
    // --------------------------------------------------

    updateCameraStatus(
        "Capturing sign..."
    );

    const blob =
        await captureCurrentFrame();

    console.log(
        "✓ Frame ready for prediction:",
        blob.size,
        "bytes"
    );

    // --------------------------------------------------
    // TARGET
    // --------------------------------------------------

    const target =
        getCurrentTarget();

    console.log(
        "Target sign:",
        target
    );

    // --------------------------------------------------
    // SEND TO EXISTING FASTAPI ENDPOINT
    // --------------------------------------------------

    updateCameraStatus(
        "Recognizing sign..."
    );

    // --------------------------------------------------
    // SEND IMAGE TO FASTAPI
    // --------------------------------------------------

    const result =
        await sendPrediction(
            blob,
            target
        );

    console.log(
        "✓ Prediction response:",
        result
    );


    // --------------------------------------------------
    // NORMALIZE BACKEND RESPONSE
    // --------------------------------------------------

    const prediction =
        normalizePrediction(result);

    const confidence =
        normalizeConfidence(result);

    const isCorrect =
        predictionMatchesTarget(
            result,
            prediction,
            target
        );


    console.log(
        "Prediction:",
        prediction
    );

    console.log(
        "Confidence:",
        confidence
    );

    console.log(
        "Correct:",
        isCorrect
    );


    // --------------------------------------------------
    // DISPLAY RESULT
    // --------------------------------------------------

    displayPredictionResult(
        prediction,
        confidence,
        isCorrect,
        result
    );


    // --------------------------------------------------
    // SAVE PRACTICE ATTEMPT
    // --------------------------------------------------

    await savePracticeAttempt({

        prediction: prediction,

        confidence: confidence,

        isCorrect: isCorrect

    });


    // --------------------------------------------------
    // MOVE TO NEXT ATTEMPT
    // --------------------------------------------------

    currentAttempt++;

    updateSessionUI();


    // --------------------------------------------------
    // CHECK SESSION COMPLETION
    // --------------------------------------------------

    if (
        currentAttempt >= sessionTotal
    ) {

        sessionComplete();

    }


} catch (error) {

    console.error(
        "Guess error:",
        error
    );

    showPredictionError(
        error.message ||
        "Prediction failed."
    );

} finally {

    isGuessing = false;

    updateGuessButton();

    updateCameraStatus(
        "Camera active"
    );

}

}



/* =========================================================
CAPTURE ORIGINAL CAMERA FRAME
========================================================= */

async function captureCurrentFrame() {

if (
    !video ||
    !captureCanvas ||
    !captureCtx
) {

    return null;

}


const width =
    video.videoWidth ||
    CAMERA_WIDTH;

const height =
    video.videoHeight ||
    CAMERA_HEIGHT;


captureCanvas.width =
    width;

captureCanvas.height =
    height;


/*
   DO NOT mirror this image.

   The backend receives the original camera frame.
*/

captureCtx.drawImage(
    video,
    0,
    0,
    width,
    height
);


return new Promise(
    resolve => {

        captureCanvas.toBlob(
            blob => resolve(blob),
            "image/jpeg",
            0.92
        );

    }
);

}
function normalizePredictionValue(value) {

if (
    value === null ||
    value === undefined
) {
    return "";
}

// Already a normal string/number
if (
    typeof value === "string" ||
    typeof value === "number"
) {
    return String(value)
        .trim()
        .toUpperCase();
}

// Backend returned an object
if (
    typeof value === "object"
) {

    const nested =
        value.prediction ??
        value.predicted_sign ??
        value.predicted_label ??
        value.label ??
        value.sign ??
        value.class_name ??
        value.name ??
        value.value ??
        "";

    if (
        nested !== value
    ) {
        return normalizePredictionValue(
            nested
        );
    }
}

return "";

}



/* =========================================================
SEND PREDICTION
========================================================= */

async function sendPrediction(
imageBlob,
target
) {

const formData =
    new FormData();


formData.append(
    "file",
    imageBlob,
    "practice_capture.jpg"
);


if (target) {

    formData.append(
        "target",
        target
    );

}


const userId =
    getUserId();


if (userId) {

    formData.append(
        "user_id",
        userId
    );

}


const token =
    localStorage.getItem(
        "token"
    );


const headers = {};


if (token) {

    headers.Authorization =
        `Bearer ${token}`;

}


const response =
    await fetch(
        PREDICT_API_URL,
        {

            method:
                "POST",

            headers:
                headers,

            body:
                formData

        }
    );


if (!response.ok) {

    let message =
        `Prediction request failed (${response.status}).`;


    try {

        const errorData =
            await response.json();

        message =
            errorData.detail ||
            errorData.message ||
            message;

    }
    catch (_) {
        /* Keep default error. */
    }


    throw new Error(
        message
    );

}


const data =
    await response.json();


if (
    !data ||
    typeof data !== "object"
) {

    throw new Error(
        "Invalid prediction response."
    );

}


return data;

}



/* =========================================================
NORMALIZE PREDICTION
========================================================= */

function normalizePrediction(result) {

let value =
    result?.prediction ??
    result?.predicted_sign ??
    result?.predicted_label ??
    result?.label ??
    result?.sign ??
    result?.class_name ??
    result?.name ??
    result?.result ??
    "";

/*
   If backend returns an object instead of a string,
   extract the actual prediction from it.
*/

while (
    value &&
    typeof value === "object"
) {

    value =
        value.prediction ??
        value.predicted_sign ??
        value.predicted_label ??
        value.label ??
        value.sign ??
        value.class_name ??
        value.name ??
        value.value ??
        "";
}

if (
    value === null ||
    value === undefined ||
    value === ""
) {

    return "Nothing";

}

return String(value)
    .trim()
    .toUpperCase();

}

/* =========================================================
NORMALIZE CONFIDENCE
========================================================= */

function normalizeConfidence(result) {

let value =
    result?.confidence ??
    result?.confidence_score ??
    result?.score ??
    result?.probability ??
    0;

while (
    value &&
    typeof value === "object"
) {

    value =
        value.value ??
        value.score ??
        value.confidence ??
        value.probability ??
        0;
}

let confidence =
    Number(value);

if (!Number.isFinite(confidence)) {
    return 0;
}

/*
   Backend may return either:
   0.87  -> 87%
   87    -> 87%
*/

if (
    confidence > 0 &&
    confidence <= 1
) {

    confidence *= 100;

}

return Math.max(
    0,
    Math.min(
        100,
        confidence
    )
);

}

/* =========================================================
CHECK TARGET
========================================================= */

function predictionMatchesTarget(
result,
prediction,
target
) {

if (
    typeof result?.is_correct ===
    "boolean"
) {

    return result.is_correct;

}


if (
    typeof result?.isCorrect ===
    "boolean"
) {

    return result.isCorrect;

}


return (
    String(prediction)
        .trim()
        .toLowerCase()
    ===
    String(target)
        .trim()
        .toLowerCase()
);

}

/* =========================================================
DISPLAY RESULT
========================================================= */

function displayPredictionResult(
detected,
confidence,
isCorrect,
rawResult
) {

lastPrediction =
    detected;

lastConfidence =
    confidence;

lastResultCorrect =
    isCorrect;


if (predictionElement) {

    predictionElement.textContent =
        getDisplayName(
            detected
        );

}


if (confidenceText) {

    confidenceText.textContent =
        `${confidence.toFixed(1)}%`;

}


if (resultTarget) {

    resultTarget.textContent =
        getDisplayName(
            currentWord
        );

}


if (resultDetected) {

    resultDetected.textContent =
        getDisplayName(
            detected
        );

}


updateConfidenceRing(
    confidence
);


if (predictionStatus) {

    predictionStatus.textContent =
        isCorrect
            ? "✓ PASS"
            : "✗ TRY AGAIN";

    predictionStatus.classList.toggle(
        "correct",
        isCorrect
    );

    predictionStatus.classList.toggle(
        "incorrect",
        !isCorrect
    );

}


if (resultMessage) {

    resultMessage.classList.toggle(
        "success",
        isCorrect
    );

    resultMessage.classList.toggle(
        "error",
        !isCorrect
    );

}


if (resultMessageText) {

    if (isCorrect) {

        resultMessageText.textContent =
            `Excellent! You performed the "${currentWord}" sign correctly.`;

    }
    else {

        resultMessageText.textContent =
            `The AI detected "${detected}" instead of "${currentWord}".`;

    }

}


const feedback =
    buildFeedback(
        detected,
        confidence,
        isCorrect,
        rawResult
    );


if (suggestionTitle) {

    suggestionTitle.textContent =
        isCorrect
            ? "Great work"
            : "Improve this sign";

}


if (suggestionText) {

    suggestionText.textContent =
        feedback.text;

}


if (recommendationElement) {

    recommendationElement.textContent =
        feedback.recommendation;

}


if (nextWordBtn) {

    nextWordBtn.disabled =
        false;

}

}

/* =========================================================
FEEDBACK
========================================================= */

function buildFeedback(
detected,
confidence,
isCorrect,
rawResult
) {

const backendFeedback =
    rawResult?.feedback ||
    rawResult?.message ||
    "";


if (isCorrect) {

    return {

        text:
            backendFeedback ||
            (
                confidence >= 90
                    ? "Excellent sign execution. Your hand shape closely matches the target."
                    : "Correct sign detected. Keep practicing for higher confidence."
            ),

        recommendation:
            confidence >= 90
                ? "Excellent performance. Continue to the next sign."
                : "Keep your hand centered and match the reference hand shape closely."

    };

}


if (
    detected === "Nothing"
) {

    return {

        text:
            backendFeedback ||
            "The AI could not identify the sign clearly.",

        recommendation:
            "Place your complete hand inside the camera frame and improve lighting."

    };

}


if (
    confidence < 40
) {

    return {

        text:
            backendFeedback ||
            "The hand was detected, but the sign confidence is low.",

        recommendation:
            "Move your hand closer to the center, keep all fingers visible, and match the reference image."

    };

}


return {

    text:
        backendFeedback ||
        `The target was "${currentWord}", but the AI detected "${detected}".`,

    recommendation:
        "Compare your finger positions, thumb placement and hand orientation with the reference sign."

};

}

/* =========================================================
CONFIDENCE RING
========================================================= */

function updateConfidenceRing(
confidence
) {

if (!progressCircle) {

    return;

}


const radius =
    Number(
        progressCircle.getAttribute(
            "r"
        )
    ) || 70;


const circumference =
    2 *
    Math.PI *
    radius;


const safe =
    Math.max(
        0,
        Math.min(
            100,
            Number(confidence) || 0
        )
    );


progressCircle.style.strokeDasharray =
    circumference;


progressCircle.style.strokeDashoffset =
    circumference -
    (
        safe / 100
    ) *
    circumference;

}

/* =========================================================
NO HAND RESULT
========================================================= */

function showNoHandResult() {

if (predictionElement) {

    predictionElement.textContent =
        "Nothing";

}


if (confidenceText) {

    confidenceText.textContent =
        "0%";

}


if (predictionStatus) {

    predictionStatus.textContent =
        "NO HAND";

}


if (resultMessageText) {

    resultMessageText.textContent =
        "No hand detected. Place your hand clearly inside the camera frame.";

}


if (suggestionTitle) {

    suggestionTitle.textContent =
        "Hand not detected";

}


if (suggestionText) {

    suggestionText.textContent =
        "Keep your complete hand visible and make sure the lighting is clear.";

}


updateConfidenceRing(0);

}

/* =========================================================
TRY AGAIN
========================================================= */

async function tryAgain() {

if (!sessionActive) {

    return;

}


resetResult();


if (resultMessageText) {

    resultMessageText.textContent =
        `Perform the "${currentWord}" sign again and click Guess Sign.`;

}


latestLandmarks =
    null;

latestHandedness =
    null;

latestLandmarkTime =
    0;


updateGuessButton();

}

/* =========================================================
NEXT SIGN
========================================================= */

async function nextSign() {

/*
   A next sign is allowed only after at least one
   completed attempt and while the session is active.
*/

if (!sessionActive) {

    console.warn(
        "Next Sign blocked: no active practice session."
    );

    return;

}

if (
    currentAttempt >=
    sessionTotal
) {

    sessionComplete();

    return;

}

isFrameFrozen = false;

lastPrediction = null;
lastConfidence = 0;
lastResultCorrect = false;

/*
   Select the next target.
*/

if (practiceMode === "random") {

    currentWord =
        randomAlphabet();

    await selectSign(
        currentWord
    );

}

else if (practiceMode === "weak") {

    await refreshWeakSign();

    currentWord =
        weakSign ||
        randomAlphabet();

    await selectSign(
        currentWord
    );

}

else {

    /*
       Custom mode keeps the selected sign.
    */

    await selectSign(
        currentWord
    );

}

resetResult();

updateTargetDisplay();

updateSessionUI();

updateGuessButton();

/*
   Next Sign has now been consumed.
   Disable it until the next prediction.
*/

if (nextWordBtn) {

    nextWordBtn.disabled =
        true;

}

if (resultMessageText) {

    resultMessageText.textContent =
        `Perform the "${currentWord}" sign and click Guess Sign.`;

}

if (suggestionTitle) {

    suggestionTitle.textContent =
        "Practice tip";

}

if (suggestionText) {

    suggestionText.textContent =
        "Keep your hand centered and clearly visible.";

}

}

/* =========================================================
SESSION COMPLETE
========================================================= */

function sessionComplete() {

sessionActive =
    false;


if (startPracticeBtn) {

    startPracticeBtn.disabled =
        false;

    startPracticeBtn.innerHTML =
        '<i class="fa-solid fa-play"></i> Start Practice';

}


if (nextWordBtn) {

    nextWordBtn.disabled =
        true;

}


if (resultMessageText) {

    resultMessageText.textContent =
        `Practice session complete. You completed ${sessionTotal} attempt${sessionTotal === 1 ? "" : "s"}.`;

}


if (suggestionTitle) {

    suggestionTitle.textContent =
        "Session complete";

}


if (suggestionText) {

    const accuracy =
        sessionTotal > 0
            ? (
                correctCount /
                Math.max(
                    attemptsCount,
                    1
                )
            ) *
            100
            : 0;

    suggestionText.textContent =
        `Keep practicing consistently. Your current session accuracy is ${accuracy.toFixed(1)}%.`;

}


updateSessionUI();


console.log(
    "✓ Practice session completed."
);

}

/* =========================================================
RESET RESULT
========================================================= */

function resetResult() {

if (predictionElement) {

    predictionElement.textContent =
        "Waiting...";

}


if (confidenceText) {

    confidenceText.textContent =
        "0%";

}


if (predictionStatus) {

    predictionStatus.textContent =
        "Waiting";

    predictionStatus.classList.remove(
        "correct",
        "incorrect"
    );

}


if (resultTarget) {

    resultTarget.textContent =
        currentWord;

}


if (resultDetected) {

    resultDetected.textContent =
        "—";

}


if (resultMessage) {

    resultMessage.classList.remove(
        "success",
        "error"
    );

}


if (resultMessageText) {

    resultMessageText.textContent =
        "Show the target sign to the camera.";

}


if (suggestionTitle) {

    suggestionTitle.textContent =
        "Practice tip";

}


if (suggestionText) {

    suggestionText.textContent =
        "Keep your hand centered and clearly visible.";

}


updateConfidenceRing(0);


if (nextWordBtn) {

    nextWordBtn.disabled =
        true;

}

}

/* =========================================================
SAVE PRACTICE ATTEMPT
========================================================= */

async function savePracticeAttempt(
result
) {

const userId =
    getUserId();


if (!userId) {

    console.warn(
        "No user ID. Practice attempt will not be saved."
    );

    return;

}


const payload = {

    user_id:
        Number(userId),

    target:
        currentWord,

    prediction:
        result.prediction,

    confidence:
        result.confidence,

    difficulty:
        difficultyElement?.value ||
        "easy",

    correct:
        Boolean(
            result.isCorrect
        ),

    practice_type:
        "alphabet",

    feedback:
        result.isCorrect
            ? "Correct sign"
            : "Needs improvement"

};


try {

    const headers = {

        "Content-Type":
            "application/json",

        ...getAuthHeaders()

    };


    const response =
        await fetch(
            PRACTICE_ATTEMPT_URL,
            {

                method:
                    "POST",

                headers:
                    headers,

                body:
                    JSON.stringify(
                        payload
                    )

            }
        );


    if (!response.ok) {

        console.warn(
            "Practice attempt API returned:",
            response.status
        );

        return;

    }


    const data =
        await response.json();


    if (
        data &&
        data.xp !== undefined
    ) {

        earnedXP =
            Number(data.xp) || 0;

    }


    if (
        data &&
        data.level &&
        currentLevel
    ) {

        currentLevel.textContent =
            String(data.level);

    }


    await loadProgress();

}
catch (error) {

    console.warn(
        "Practice attempt save failed:",
        error
    );

}

}

/* =========================================================
LOAD PROGRESS
========================================================= */

async function loadProgress() {

const userId =
    getUserId();


if (!userId) {

    return;

}


try {

    const response =
        await fetch(
            `${PROGRESS_API_URL}/${encodeURIComponent(userId)}`,
            {

                method:
                    "GET",

                headers:
                    getAuthHeaders()

            }
        );


    if (!response.ok) {

        console.warn(
            "Progress API returned:",
            response.status
        );

        return;

    }


    const data =
        await response.json();


    if (
        data.attempts !== undefined
    ) {

        attemptsCount =
            Number(data.attempts) || 0;

    }


    if (
        data.correct !== undefined
    ) {

        correctCount =
            Number(data.correct) || 0;

    }


    if (
        data.xp !== undefined
    ) {

        earnedXP =
            Number(data.xp) || 0;

    }


    if (
        data.streak !== undefined
    ) {

        streakCount =
            Number(data.streak) || 0;

    }


    updateStatistics();


    updateWeakSigns(
        data
    );

}
catch (error) {

    console.warn(
        "Progress loading failed:",
        error
    );

}

}

/* =========================================================
LOAD RECOMMENDATION
========================================================= */

async function loadRecommendation(
userId = getUserId()
) {

if (
    !userId ||
    !recommendationElement
) {

    return;

}


try {

    const response =
        await fetch(
            `${RECOMMENDATION_API_URL}/${encodeURIComponent(userId)}`,
            {

                headers:
                    getAuthHeaders()

            }
        );


    if (!response.ok) {

        return;

    }


    const data =
        await response.json();


    if (
        data.success &&
        data.recommendation
    ) {

        recommendationElement.textContent =
            String(
                data.recommendation
            );

    }

}
catch (error) {

    console.warn(
        "Recommendation loading failed:",
        error
    );

}

}

/* =========================================================
WEAK SIGN
========================================================= */

function updateWeakSigns(data) {

if (
    data &&
    data.weak_sign
) {

    weakSign =
        String(
            data.weak_sign
        )
        .trim()
        .toUpperCase();

}

}

/* =========================================================
REFRESH WEAK SIGN
========================================================= */

async function refreshWeakSign() {

const userId =
    getUserId();


if (!userId) {

    weakSign =
        null;

    return;

}


try {

    const response =
        await fetch(
            `${PROGRESS_API_URL}/${encodeURIComponent(userId)}`,
            {

                headers:
                    getAuthHeaders()

            }
        );


    if (!response.ok) {

        weakSign =
            null;

        return;

    }


    const data =
        await response.json();


    updateWeakSigns(
        data
    );

}
catch (error) {

    console.warn(
        "Weak sign loading failed:",
        error
    );

    weakSign =
        null;

}

}

/* =========================================================
RANDOM ALPHABET
========================================================= */

function randomAlphabet() {

const letters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

return letters[
    Math.floor(
        Math.random() *
        letters.length
    )
];

}

/* =========================================================
START PRACTICE
========================================================= */

async function startPractice() {

if (sessionActive) {

    return;

}


readSessionSettings();


if (
    practiceMode === "weak"
) {

    await refreshWeakSign();


    if (!weakSign) {

        showTemporaryMessage(
            "Complete a few attempts first so SignAI can identify your weak sign."
        );

        return;

    }


    currentWord =
        weakSign;

}


else if (
    practiceMode === "random"
) {

    currentWord =
        randomAlphabet();

}


currentAttempt =
    0;

sessionActive =
    true;

isFrameFrozen =
    false;

isGuessing =
    false;

latestLandmarks =
    null;

latestHandedness =
    null;

latestLandmarkTime =
    0;


await selectSign(
    currentWord
);


resetResult();

updateSessionUI();


if (!isCameraRunning) {

    const started =
        await startCamera();

    if (!started) {

        sessionActive =
            false;

        return;

    }

}


if (startPracticeBtn) {

    startPracticeBtn.disabled =
        true;

    startPracticeBtn.innerHTML =
        '<i class="fa-solid fa-circle-play"></i> Practice Running';

}


if (resultMessageText) {

    resultMessageText.textContent =
        `Perform the "${currentWord}" sign and click Guess Sign.`;

}


if (landmarkStatus) {

    landmarkStatus.textContent =
        "✋ Looking for your hand...";

}


updateGuessButton();


console.log(
    "✓ Practice started."
);

}

/* =========================================================
READ SETTINGS
========================================================= */

function readSessionSettings() {

currentDifficulty =
    difficultyElement?.value ||
    "easy";


const length =
    Number(
        sessionLengthElement?.value
    );


if (
    Number.isFinite(length) &&
    length > 0
) {

    sessionTotal =
        length;

}
else {

    sessionTotal =
        10;

}

}

/* =========================================================
DIFFICULTY
========================================================= */

function setupDifficulty() {

if (!difficultyElement) {

    return;

}


difficultyElement.addEventListener(
    "change",
    async () => {

        currentDifficulty =
            difficultyElement.value;

        updateTargetDisplay();


        if (
            sessionActive &&
            practiceMode === "custom"
        ) {

            await loadRecommendation();

        }

    }
);

}

/* =========================================================
SESSION LENGTH
========================================================= */

function setupSessionLength() {

if (!sessionLengthElement) {

    return;

}


sessionLengthElement.addEventListener(
    "change",
    () => {

        readSessionSettings();

        updateSessionUI();

    }
);

}

/* =========================================================
SESSION UI
========================================================= */

function updateSessionUI() {

const completed =
    Math.min(
        currentAttempt,
        sessionTotal
    );


const percent =
    sessionTotal > 0
        ? (
            completed /
            sessionTotal
        ) *
        100
        : 0;


if (sessionProgress) {

    sessionProgress.textContent =
        `${completed} / ${sessionTotal}`;

}


if (sessionProgressBar) {

    sessionProgressBar.style.width =
        `${Math.min(100, percent)}%`;

}


if (sessionProgressPercent) {

    sessionProgressPercent.textContent =
        `${Math.round(
            Math.min(
                100,
                Math.max(
                    0,
                    percent
                )
            )
        )}%`;

}


if (goalPercent) {

    goalPercent.textContent =
        `${Math.round(percent)}%`;

}


if (goalText) {

    goalText.textContent =
        `${completed} of ${sessionTotal} signs`;

}


if (goalBar) {

    goalBar.style.width =
        `${Math.min(100, percent)}%`;

}


if (currentSignNumber) {

    currentSignNumber.textContent =
        String(
            Math.min(
                currentAttempt + 1,
                sessionTotal
            )
        ).padStart(
            2,
            "0"
        );

}

}

/* =========================================================
STATISTICS
========================================================= */

function updateStatistics() {

if (attemptsElement) {

    attemptsElement.textContent =
        String(
            attemptsCount
        );

}


if (correctElement) {

    correctElement.textContent =
        String(
            correctCount
        );

}


const accuracy =
    attemptsCount > 0
        ? (
            correctCount /
            attemptsCount
        ) *
        100
        : 0;


if (practiceAccuracyElement) {

    practiceAccuracyElement.textContent =
        `${accuracy.toFixed(1)}%`;

}


if (earnedXPElement) {

    earnedXPElement.textContent =
        `+${earnedXP} XP`;

}


if (practiceStreakElement) {

    practiceStreakElement.textContent =
        String(
            streakCount
        );

}

}

/* =========================================================
AUTO CAMERA CHECK
========================================================= */

async function autoCheckCamera() {

if (
    !navigator.mediaDevices ||
    !navigator.mediaDevices.getUserMedia
) {

    updateCameraStatus(
        "Camera not supported"
    );

    return;

}


updateCameraStatus(
    "Camera ready"
);

}

/* =========================================================
STOP CAMERA
========================================================= */

function stopCamera() {

isCameraRunning =
    false;

isGuessing =
    false;

isFrameFrozen =
    false;


if (animationFrameId) {

    cancelAnimationFrame(
        animationFrameId
    );

    animationFrameId =
        null;

}


if (stream) {

    stream
        .getTracks()
        .forEach(track => {

            try {

                track.stop();

            }
            catch (error) {

                console.warn(
                    "Unable to stop camera track:",
                    error
                );

            }

        });

    stream =
        null;

}


if (video) {

    try {

        video.pause();

    }
    catch (_) {}


    video.srcObject =
        null;

}


latestLandmarks =
    null;

latestHandedness =
    null;

latestLandmarkTime =
    0;


if (
    landmarkCtx &&
    landmarkCanvas
) {

    landmarkCtx.clearRect(
        0,
        0,
        landmarkCanvas.width,
        landmarkCanvas.height
    );

}


if (cameraOverlay) {

    cameraOverlay.hidden =
        false;

    cameraOverlay.classList.remove(
        "hidden"
    );

}


updateCameraStatus(
    "Camera stopped"
);

updateLandmarkStatus(
    "✋ Camera stopped"
);


updateCameraUI(false);

updateGuessButton();


console.log(
    "✓ Camera stopped."
);

}

/* =========================================================
FPS
========================================================= */

setInterval(
() => {

    if (!isCameraRunning) {

        return;

    }


    const now =
        performance.now();


    if (
        !latestFrameTime
    ) {

        latestFrameTime =
            now;

        return;

    }


    const elapsed =
        now -
        latestFrameTime;


    if (
        elapsed >= 1000
    ) {

        if (fpsElement) {

            fpsElement.textContent =
                String(
                    frameCounter
                );

        }


        frameCounter =
            0;

        latestFrameTime =
            now;

    }

},
250

);

/* =========================================================
VIDEO EVENTS
========================================================= */

if (video) {

video.addEventListener(
    "loadedmetadata",
    resizeLandmarkCanvas
);


video.addEventListener(
    "play",
    resizeLandmarkCanvas
);

}

/* =========================================================
WINDOW RESIZE
========================================================= */

window.addEventListener(
"resize",
resizeLandmarkCanvas
);

/* =========================================================
PAGE VISIBILITY
========================================================= */

document.addEventListener(
"visibilitychange",
async () => {

    if (
        document.hidden
    ) {

        return;

    }


    if (
        isCameraRunning &&
        video
    ) {

        try {

            await video.play();

        }
        catch (_) {}

    }

}

);

/* =========================================================
BEFORE UNLOAD
========================================================= */

window.addEventListener(
"beforeunload",
() => {

    stopCamera();

}

);

/* =========================================================
TEMPORARY MESSAGE
========================================================= */

function showTemporaryMessage(
message
) {

if (resultMessageText) {

    resultMessageText.textContent =
        message;

}


if (suggestionText) {

    suggestionText.textContent =
        message;

}

}

/* =========================================================
CAMERA ERROR
========================================================= */

function showCameraError(
error
) {

let message =
    "Unable to access the camera.";


if (
    error?.name ===
    "NotAllowedError"
) {

    message =
        "Camera permission was denied. Allow camera access in your browser and try again.";

}


else if (
    error?.name ===
    "NotFoundError"
) {

    message =
        "No camera was found on this device.";

}


else if (
    error?.name ===
    "NotReadableError"
) {

    message =
        "The camera is already being used by another application.";

}


else if (
    error?.message
) {

    message =
        error.message;

}


showTemporaryMessage(
    message
);

}

/* =========================================================
PREDICTION ERROR
========================================================= */

function showPredictionError(
message
) {

if (predictionStatus) {

    predictionStatus.textContent =
        "ERROR";

}


if (resultMessageText) {

    resultMessageText.textContent =
        message ||
        "Prediction failed. Please try again.";

}


if (suggestionTitle) {

    suggestionTitle.textContent =
        "Prediction error";

}


if (suggestionText) {

    suggestionText.textContent =
        "Make sure your hand is clearly visible and try again.";

}

}

/* =========================================================
API ERROR MESSAGE
========================================================= */

function getApiErrorMessage(
error
) {

if (
    error?.message
) {

    return error.message;

}


return (
    "Unable to recognize the sign. Please try again."
);

}

/* =========================================================
DISPLAY NAME
========================================================= */

function getDisplayName(
value
) {

if (
    value === null ||
    value === undefined ||
    value === ""
) {

    return "Nothing";

}


return String(value);

}

/* =========================================================
CAPITALIZE
========================================================= */

function capitalize(
value
) {

const text =
    String(
        value || ""
    );


if (!text) {

    return "";

}


return (
    text.charAt(0).toUpperCase() +
    text.slice(1)
);

}

/* =========================================================
SLEEP
========================================================= */

function sleep(
milliseconds
) {

return new Promise(
    resolve =>
        setTimeout(
            resolve,
            milliseconds
        )
);

}

/* =========================================================
DEBUG API
========================================================= */

window.signAIPractice = {

getLandmarks:
    () => latestLandmarks,

getHandedness:
    () => latestHandedness,

getPrediction:
    () => lastPrediction,

getConfidence:
    () => lastConfidence,

getTarget:
    () => currentWord,

getCurrentAttempt:
    () => currentAttempt,

getSessionTotal:
    () => sessionTotal,

getAttempts:
    () => attemptsCount,

getCorrect:
    () => correctCount,

getStreak:
    () => streakCount,

getXP:
    () => earnedXP,

isCameraRunning:
    () => isCameraRunning,

isMediaPipeReady:
    () => mediaPipeReady,

isLandmarkFresh:
    () => isLandmarkFresh(),

getLandmarkAge:
    () =>
        latestLandmarkTime
            ? performance.now() -
              latestLandmarkTime
            : null,

startCamera:
    () => startCamera(),

stopCamera:
    () => stopCamera(),

startPractice:
    () => startPractice(),

guessSign:
    () => guessSign(),

nextSign:
    () => nextSign(),

tryAgain:
    () => tryAgain(),

selectSign:
    sign => selectSign(sign)

};

console.log(
"✓ SignAI practice.js loaded successfully."
);