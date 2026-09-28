// =========================================================
// SignAI Practice System
// Camera + MediaPipe + Manual Guess + AI Prediction
// =========================================================


// =========================================================
// DOM ELEMENTS
// =========================================================

const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const handCanvas = document.getElementById("handCanvas");

const ctx = canvas ? canvas.getContext("2d") : null;
const handCtx = handCanvas ? handCanvas.getContext("2d") : null;

const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");

// IMPORTANT:
// Your new HTML should contain this button.
const guessBtn = document.getElementById("guessBtn");

const prediction = document.getElementById("prediction");
const predictionLabel = document.getElementById("predictionLabel");

const confidenceText = document.getElementById("confidenceText");
const progressCircle = document.getElementById("progressCircle");

const statusText = document.getElementById("statusText");
const cameraStatus = document.getElementById("cameraStatus");

const cameraOverlay = document.getElementById("cameraOverlay");
const cameraWrapper = document.querySelector(".camera-wrapper");

const landmarkStatus = document.getElementById("landmarkStatus");

const historyList = document.getElementById("historyList");

// Practice elements
const targetImage = document.getElementById("targetImage");
const targetName = document.getElementById("targetName");
const targetCategory = document.getElementById("targetCategory");
const targetDifficulty = document.getElementById("targetDifficulty");
const targetInstruction = document.getElementById("targetInstruction");

// Result elements
const resultCard = document.getElementById("resultCard");
const resultStatus = document.getElementById("resultStatus");
const resultMessage = document.getElementById("resultMessage");
const detectedSign = document.getElementById("detectedSign");
const resultTarget = document.getElementById("resultTarget");
const resultConfidence = document.getElementById("resultConfidence");
const suggestionText = document.getElementById("suggestionText");

const tryAgainBtn = document.getElementById("tryAgainBtn");
const nextSignBtn = document.getElementById("nextSignBtn");


// =========================================================
// DONUT CONFIGURATION
// =========================================================

const radius = 65;

const circumference =
    2 * Math.PI * radius;


if (progressCircle) {

    progressCircle.style.strokeDasharray =
        circumference;

    progressCircle.style.strokeDashoffset =
        circumference;

}


// =========================================================
// SIGN CONFIGURATION
// =========================================================

const SIGN_DATA = {

    A: {
        name: "A",
        category: "Alphabet",
        image: "/static/images/signs/A.jpg",
        difficulty: "Beginner"
    },

    B: {
        name: "B",
        category: "Alphabet",
        image: "/static/images/signs/B.jpg",
        difficulty: "Beginner"
    },

    C: {
        name: "C",
        category: "Alphabet",
        image: "/static/images/signs/C.jpg",
        difficulty: "Beginner"
    },

    D: {
        name: "D",
        category: "Alphabet",
        image: "/static/images/signs/D.jpg",
        difficulty: "Beginner"
    },

    E: {
        name: "E",
        category: "Alphabet",
        image: "/static/images/signs/E.jpg",
        difficulty: "Beginner"
    },

    F: {
        name: "F",
        category: "Alphabet",
        image: "/static/images/signs/F.jpg",
        difficulty: "Beginner"
    },

    G: {
        name: "G",
        category: "Alphabet",
        image: "/static/images/signs/G.jpg",
        difficulty: "Beginner"
    },

    H: {
        name: "H",
        category: "Alphabet",
        image: "/static/images/signs/H.jpg",
        difficulty: "Beginner"
    },

    I: {
        name: "I",
        category: "Alphabet",
        image: "/static/images/signs/I.jpg",
        difficulty: "Beginner"
    },

    J: {
        name: "J",
        category: "Alphabet",
        image: "/static/images/signs/J.jpg",
        difficulty: "Beginner"
    },

    K: {
        name: "K",
        category: "Alphabet",
        image: "/static/images/signs/K.jpg",
        difficulty: "Beginner"
    },

    L: {
        name: "L",
        category: "Alphabet",
        image: "/static/images/signs/L.jpg",
        difficulty: "Beginner"
    },

    M: {
        name: "M",
        category: "Alphabet",
        image: "/static/images/signs/M.jpg",
        difficulty: "Beginner"
    },

    N: {
        name: "N",
        category: "Alphabet",
        image: "/static/images/signs/N.jpg",
        difficulty: "Beginner"
    },

    O: {
        name: "O",
        category: "Alphabet",
        image: "/static/images/signs/O.jpg",
        difficulty: "Beginner"
    },

    P: {
        name: "P",
        category: "Alphabet",
        image: "/static/images/signs/P.jpg",
        difficulty: "Beginner"
    },

    Q: {
        name: "Q",
        category: "Alphabet",
        image: "/static/images/signs/Q.jpg",
        difficulty: "Beginner"
    },

    R: {
        name: "R",
        category: "Alphabet",
        image: "/static/images/signs/R.jpg",
        difficulty: "Beginner"
    },

    S: {
        name: "S",
        category: "Alphabet",
        image: "/static/images/signs/S.jpg",
        difficulty: "Beginner"
    },

    T: {
        name: "T",
        category: "Alphabet",
        image: "/static/images/signs/T.jpg",
        difficulty: "Beginner"
    },

    U: {
        name: "U",
        category: "Alphabet",
        image: "/static/images/signs/U.jpg",
        difficulty: "Beginner"
    },

    V: {
        name: "V",
        category: "Alphabet",
        image: "/static/images/signs/V.jpg",
        difficulty: "Beginner"
    },

    W: {
        name: "W",
        category: "Alphabet",
        image: "/static/images/signs/W.jpg",
        difficulty: "Beginner"
    },

    X: {
        name: "X",
        category: "Alphabet",
        image: "/static/images/signs/X.jpg",
        difficulty: "Beginner"
    },

    Y: {
        name: "Y",
        category: "Alphabet",
        image: "/static/images/signs/Y.jpg",
        difficulty: "Beginner"
    },

    Z: {
        name: "Z",
        category: "Alphabet",
        image: "/static/images/signs/Z.jpg",
        difficulty: "Beginner"
    }

};


// =========================================================
// PRACTICE STATE
// =========================================================

let currentTarget = null;

let stream = null;

let hands = null;

let handsReady = false;

let handDetected = false;

let predictionBusy = false;

let lastPrediction = null;

let lastConfidence = 0;

let sessionAttempts = 0;

let sessionCorrect = 0;


// =========================================================
// INITIALIZE MEDIAPIPE
// =========================================================

function initializeHands() {

    if (typeof Hands === "undefined") {

        console.error(
            "MediaPipe Hands library is not loaded."
        );

        updateStatus(
            "MediaPipe failed to load."
        );

        return;

    }


    hands = new Hands({

        locateFile: file => {

            return (
                "https://cdn.jsdelivr.net/npm/@mediapipe/hands/" +
                file
            );

        }

    });


    hands.setOptions({

        maxNumHands: 1,

        modelComplexity: 1,

        minDetectionConfidence: 0.55,

        minTrackingConfidence: 0.55

    });


    hands.onResults(
        handleHandResults
    );


    handsReady = true;


    console.log(
        "MediaPipe Hands initialized."
    );

}


// =========================================================
// HAND RESULTS
// =========================================================

function handleHandResults(results) {

    if (!handCanvas || !handCtx || !video) {

        return;

    }


    if (!video.videoWidth || !video.videoHeight) {

        return;

    }


    handCanvas.width =
        video.videoWidth;

    handCanvas.height =
        video.videoHeight;


    handCtx.clearRect(
        0,
        0,
        handCanvas.width,
        handCanvas.height
    );


    const detectedHands =
        results.multiHandLandmarks || [];


    if (detectedHands.length === 0) {

        handDetected = false;

        updateLandmarkStatus(
            "✋ No hand detected",
            "no-hand"
        );

        return;

    }


    handDetected = true;


    updateLandmarkStatus(
        "✋ Hand detected",
        "detected"
    );


    detectedHands.forEach(
        landmarks => {

            drawHandConnections(
                landmarks
            );

            drawHandPoints(
                landmarks
            );

        }
    );

}


// =========================================================
// DRAW CONNECTIONS
// =========================================================

function drawHandConnections(landmarks) {

    if (
        typeof HAND_CONNECTIONS ===
        "undefined"
    ) {

        return;

    }


    handCtx.lineWidth = 3;

    handCtx.strokeStyle =
        "#2563EB";


    HAND_CONNECTIONS.forEach(
        connection => {

            const start =
                landmarks[
                    connection[0]
                ];

            const end =
                landmarks[
                    connection[1]
                ];


            if (!start || !end) {

                return;

            }


            handCtx.beginPath();


            handCtx.moveTo(

                start.x *
                handCanvas.width,

                start.y *
                handCanvas.height

            );


            handCtx.lineTo(

                end.x *
                handCanvas.width,

                end.y *
                handCanvas.height

            );


            handCtx.stroke();

        }
    );

}


// =========================================================
// DRAW LANDMARK POINTS
// =========================================================

function drawHandPoints(landmarks) {

    landmarks.forEach(point => {

        const x =
            point.x *
            handCanvas.width;

        const y =
            point.y *
            handCanvas.height;


        handCtx.beginPath();


        handCtx.arc(
            x,
            y,
            5,
            0,
            Math.PI * 2
        );


        handCtx.fillStyle =
            "#FFFFFF";

        handCtx.fill();


        handCtx.lineWidth = 2;

        handCtx.strokeStyle =
            "#1D4ED8";

        handCtx.stroke();

    });

}


// =========================================================
// LANDMARK STATUS
// =========================================================

function updateLandmarkStatus(
    text,
    className
) {

    if (!landmarkStatus) {

        return;

    }


    landmarkStatus.textContent =
        text;


    landmarkStatus.classList.remove(
        "detected",
        "no-hand"
    );


    if (className) {

        landmarkStatus.classList.add(
            className
        );

    }

}


// =========================================================
// STATUS
// =========================================================

function updateStatus(text) {

    if (statusText) {

        statusText.textContent =
            text;

    }

}


// =========================================================
// LOAD TARGET
// =========================================================

function loadTargetSign(sign) {

    const normalized =
        String(sign || "")
            .trim()
            .toUpperCase();


    if (!SIGN_DATA[normalized]) {

        console.error(
            "Unknown target sign:",
            normalized
        );

        return;

    }


    currentTarget =
        normalized;


    const data =
        SIGN_DATA[normalized];


    if (targetImage) {

        targetImage.src =
            data.image;

        targetImage.alt =
            `ASL sign ${data.name}`;


        targetImage.onerror =
            () => {

                console.error(
                    "Reference image not found:",
                    data.image
                );

                targetImage.style.display =
                    "none";

            };

    }


    if (targetName) {

        targetName.textContent =
            data.name;

    }


    if (targetCategory) {

        targetCategory.textContent =
            data.category;

    }


    if (targetDifficulty) {

        targetDifficulty.textContent =
            data.difficulty;

    }


    if (targetInstruction) {

        targetInstruction.textContent =
            `Make the ${data.name} hand sign shown in the reference image.`;

    }


    // Reset previous result
    resetResult();


    console.log(
        "Target sign:",
        currentTarget
    );

}


// =========================================================
// RANDOM SIGN
// =========================================================

function loadRandomSign() {

    const signs =
        Object.keys(SIGN_DATA);


    const random =
        signs[
            Math.floor(
                Math.random() *
                signs.length
            )
        ];


    loadTargetSign(random);

}


// =========================================================
// START CAMERA
// =========================================================

async function startCamera() {

    if (stream) {

        return;

    }


    try {

        if (
            !navigator.mediaDevices ||
            !navigator.mediaDevices.getUserMedia
        ) {

            throw new Error(
                "Camera API is not supported."
            );

        }


        stream =
            await navigator.mediaDevices
                .getUserMedia({

                    video: {

                        facingMode: "user",

                        width: {
                            ideal: 1280
                        },

                        height: {
                            ideal: 720
                        }

                    },

                    audio: false

                });


        video.srcObject =
            stream;


        video.muted = true;

        video.autoplay = true;

        video.playsInline = true;


        await video.play();


        if (cameraWrapper) {

            cameraWrapper.classList.add(
                "camera-active"
            );

        }


        if (cameraOverlay) {

            cameraOverlay.style.opacity =
                "0";

            cameraOverlay.style.visibility =
                "hidden";

        }


        if (cameraStatus) {

            cameraStatus.innerHTML =
                '<i class="fa-solid fa-circle"></i> Camera Ready';

            cameraStatus.classList.add(
                "active"
            );

        }


        updateStatus(
            "🟢 Camera running — perform the target sign."
        );


        updateLandmarkStatus(
            "🔎 Looking for your hand",
            ""
        );


        if (guessBtn) {

            guessBtn.disabled =
                false;

        }


        console.log(
            "Camera started."
        );

    }


    catch (error) {

        console.error(
            "Camera error:",
            error
        );


        stream = null;


        if (error.name === "NotAllowedError") {

            updateStatus(
                "❌ Camera permission denied."
            );

        }

        else if (
            error.name === "NotFoundError"
        ) {

            updateStatus(
                "❌ No camera found."
            );

        }

        else {

            updateStatus(
                "❌ Unable to access camera."
            );

        }

    }

}


// =========================================================
// STOP CAMERA
// =========================================================

function stopCamera() {

    if (stream) {

        stream
            .getTracks()
            .forEach(
                track => track.stop()
            );

        stream = null;

    }


    if (video) {

        video.pause();

        video.srcObject =
            null;

    }


    if (
        handCtx &&
        handCanvas
    ) {

        handCtx.clearRect(
            0,
            0,
            handCanvas.width,
            handCanvas.height
        );

    }


    handDetected = false;


    if (cameraWrapper) {

        cameraWrapper.classList.remove(
            "camera-active"
        );

    }


    if (cameraOverlay) {

        cameraOverlay.style.opacity =
            "1";

        cameraOverlay.style.visibility =
            "visible";

    }


    if (cameraStatus) {

        cameraStatus.innerHTML =
            '<i class="fa-solid fa-circle"></i> Camera Off';

        cameraStatus.classList.remove(
            "active"
        );

    }


    updateLandmarkStatus(
        "✋ Waiting for hand",
        ""
    );


    updateStatus(
        "Camera stopped."
    );


    if (guessBtn) {

        guessBtn.disabled =
            true;

    }

}


// =========================================================
// MEDIAPIPE FRAME LOOP
// =========================================================

async function runHandDetection() {

    if (
        stream &&
        video &&
        handsReady &&
        hands &&
        video.readyState >= 2
    ) {

        try {

            await hands.send({
                image: video
            });

        }

        catch (error) {

            console.error(
                "MediaPipe error:",
                error
            );

        }

    }


    requestAnimationFrame(
        runHandDetection
    );

}


// =========================================================
// GUESS BUTTON
// =========================================================

async function captureGuessFrame() {

    if (!stream) {

        updateStatus(
            "⚠ Start the camera first."
        );

        return;

    }


    if (!handDetected) {

        updateStatus(
            "✋ No hand detected. Place your hand clearly inside the frame."
        );

        return;

    }


    if (!currentTarget) {

        loadRandomSign();

    }


    if (predictionBusy) {

        return;

    }


    predictionBusy = true;


    if (guessBtn) {

        guessBtn.disabled =
            true;

        guessBtn.innerHTML =
            '<i class="fa-solid fa-spinner fa-spin"></i> Analyzing...';

    }


    updateStatus(
        "🤖 Analyzing your sign..."
    );


    try {

        // -------------------------------------------------
        // CAPTURE EXACTLY ONE FRAME
        // -------------------------------------------------

        canvas.width =
            video.videoWidth;

        canvas.height =
            video.videoHeight;


        ctx.drawImage(

            video,

            0,
            0,

            canvas.width,
            canvas.height

        );


        const blob =
            await new Promise(
                resolve => {

                    canvas.toBlob(

                        resolve,

                        "image/jpeg",

                        0.90

                    );

                }
            );


        if (!blob) {

            throw new Error(
                "Unable to capture camera frame."
            );

        }


        // -------------------------------------------------
        // SEND ONE FRAME TO REAL MODEL
        // -------------------------------------------------

        const form =
            new FormData();


        form.append(
            "file",
            blob,
            "practice-frame.jpg"
        );


        const token =
            localStorage.getItem(
                "token"
            );


        const headers = {};


        if (token) {

            headers.Authorization =
                "Bearer " + token;

        }


        const response =
            await fetch(
                "/predict",
                {

                    method: "POST",

                    headers,

                    body: form

                }
            );


        if (!response.ok) {

            throw new Error(
                `Prediction API failed: ${response.status}`
            );

        }


        const data =
            await response.json();


        console.log(
            "REAL MODEL RESPONSE:",
            data
        );


        // -------------------------------------------------
        // READ REAL MODEL RESULT
        // -------------------------------------------------

        const predictedSign =
            String(
                data.prediction ||
                "Unknown"
            )
            .trim()
            .toUpperCase();


        const confidence =
            Number(
                data.confidence || 0
            );


        lastPrediction =
            predictedSign;


        lastConfidence =
            confidence;


        // -------------------------------------------------
        // DISPLAY PREDICTION
        // -------------------------------------------------

        displayPrediction(
            predictedSign,
            confidence
        );


        // -------------------------------------------------
        // COMPARE AGAINST TARGET
        // -------------------------------------------------

        const correct =
            comparePredictionWithTarget(
                predictedSign
            );


        // -------------------------------------------------
        // RECORD ATTEMPT
        // -------------------------------------------------

        await recordAttempt({

            target_sign:
                currentTarget,

            predicted_sign:
                predictedSign,

            confidence:
                confidence,

            correct:
                correct

        });


    }


    catch (error) {

        console.error(
            "Prediction error:",
            error
        );


        updateStatus(
            "❌ Unable to connect to the AI prediction service."
        );

    }


    finally {

        predictionBusy =
            false;


        if (guessBtn) {

            guessBtn.disabled =
                false;

            guessBtn.innerHTML =
                '<i class="fa-solid fa-wand-magic-sparkles"></i> Guess';

        }

    }

}


// =========================================================
// DISPLAY PREDICTION
// =========================================================

function displayPrediction(
    predictedSign,
    confidence
) {

    if (prediction) {

        prediction.textContent =
            predictedSign;

    }


    if (predictionLabel) {

        predictionLabel.textContent =
            `AI detected ${predictedSign}`;

    }


    updateDonut(
        confidence
    );

}


// =========================================================
// COMPARE PREDICTION
// =========================================================

function comparePredictionWithTarget(
    predictedSign
) {

    const target =
        String(
            currentTarget || ""
        )
        .trim()
        .toUpperCase();


    const predicted =
        String(
            predictedSign || ""
        )
        .trim()
        .toUpperCase();


    const correct =
        target !== "" &&
        predicted === target;


    showResult(
        correct,
        target,
        predicted,
        lastConfidence
    );


    if (correct) {

        sessionCorrect++;

    }


    sessionAttempts++;


    return correct;

}


// =========================================================
// SHOW RESULT
// =========================================================

function showResult(
    correct,
    target,
    detected,
    confidence
) {

    if (resultCard) {

        resultCard.style.display =
            "block";

    }


    if (detectedSign) {

        detectedSign.textContent =
            detected;

    }


    if (resultTarget) {

        resultTarget.textContent =
            target;

    }


    if (resultConfidence) {

        resultConfidence.textContent =
            `${Number(confidence).toFixed(0)}%`;

    }


    if (correct) {

        if (resultStatus) {

            resultStatus.textContent =
                "✓ CORRECT";

            resultStatus.className =
                "result-correct";

        }


        if (resultMessage) {

            resultMessage.textContent =
                `Excellent! You performed the ${target} sign correctly.`;

        }


        if (suggestionText) {

            suggestionText.textContent =
                "Excellent work. Keep your hand position steady and try to reproduce the gesture consistently.";

        }


        updateStatus(
            "✅ Correct sign!"
        );

    }

    else {

        if (resultStatus) {

            resultStatus.textContent =
                "✕ INCORRECT";

            resultStatus.className =
                "result-incorrect";

        }


        if (resultMessage) {

            resultMessage.textContent =
                `Target: ${target} • Detected: ${detected}`;

        }


        if (suggestionText) {

            suggestionText.textContent =
                generateSuggestion(
                    target,
                    detected,
                    confidence
                );

        }


        updateStatus(
            "❌ Incorrect sign. Compare your hand with the reference image."
        );

    }

}


// =========================================================
// SUGGESTION
// =========================================================

function generateSuggestion(
    target,
    detected,
    confidence
) {

    if (
        detected === "UNKNOWN" ||
        detected === "NO HAND"
    ) {

        return (
            "Make sure your entire hand is visible inside the camera frame."
        );

    }


    if (
        Number(confidence) < 60
    ) {

        return (
            "The model has low confidence. Move your hand closer to the camera, keep the full hand visible and hold the sign steadily."
        );

    }


    if (
        detected !== target
    ) {

        return (
            `Your detected sign was ${detected}, but the target is ${target}. Compare the finger positions and thumb placement with the reference image and try again.`
        );

    }


    return (
        "Try holding the hand position steady and keep your fingers clearly visible."
    );

}


// =========================================================
// DONUT
// =========================================================

function updateDonut(confidence) {

    confidence =
        Math.max(
            0,
            Math.min(
                100,
                Number(confidence) || 0
            )
        );


    const offset =
        circumference -
        (
            confidence / 100
        ) *
        circumference;


    if (progressCircle) {

        progressCircle.style.strokeDashoffset =
            offset;


        if (confidence >= 80) {

            progressCircle.style.stroke =
                "#16A34A";

        }

        else if (confidence >= 60) {

            progressCircle.style.stroke =
                "#F59E0B";

        }

        else {

            progressCircle.style.stroke =
                "#DC2626";

        }

    }


    if (confidenceText) {

        confidenceText.textContent =
            `${confidence.toFixed(0)}%`;

    }

}


// =========================================================
// RESET RESULT
// =========================================================

function resetResult() {

    if (resultCard) {

        resultCard.style.display =
            "none";

    }


    if (prediction) {

        prediction.textContent =
            "Waiting...";

    }


    if (predictionLabel) {

        predictionLabel.textContent =
            "Perform the target sign and click Guess.";

    }


    updateDonut(0);

}


// =========================================================
// TRY AGAIN
// =========================================================

if (tryAgainBtn) {

    tryAgainBtn.addEventListener(
        "click",
        () => {

            resetResult();

            updateStatus(
                "Perform the target sign and click Guess."
            );

        }
    );

}


// =========================================================
// NEXT SIGN
// =========================================================

if (nextSignBtn) {

    nextSignBtn.addEventListener(
        "click",
        () => {

            loadRandomSign();

            updateStatus(
                "New target selected. Perform the sign and click Guess."
            );

        }
    );

}


// =========================================================
// RECORD PRACTICE ATTEMPT
// =========================================================

async function recordAttempt(attempt) {

    const token =
        localStorage.getItem(
            "token"
        );


    if (!token) {

        console.warn(
            "No authentication token. Attempt not saved."
        );

        return;

    }


    try {

        const response =
            await fetch(
                "/practice/attempt",
                {

                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json",

                        "Authorization":
                            "Bearer " +
                            token

                    },

                    body:
                        JSON.stringify({

                            target_sign:
                                attempt.target_sign,

                            predicted_sign:
                                attempt.predicted_sign,

                            confidence:
                                attempt.confidence,

                            correct:
                                attempt.correct

                        })

                }
            );


        if (!response.ok) {

            console.warn(
                "Practice attempt could not be saved:",
                response.status
            );

            return;

        }


        const data =
            await response.json();


        console.log(
            "Practice attempt saved:",
            data
        );


    }

    catch (error) {

        console.error(
            "Practice attempt error:",
            error
        );

    }

}


// =========================================================
// LOCAL HISTORY
// =========================================================

function updateLocalHistory(
    predictedSign,
    confidence,
    correct
) {

    if (!historyList) {

        return;

    }


    const li =
        document.createElement(
            "li"
        );


    li.textContent =
        `${predictedSign} • ${Number(confidence).toFixed(0)}% • ${correct ? "Correct" : "Incorrect"}`;


    historyList.prepend(
        li
    );


    while (
        historyList.children.length >
        5
    ) {

        historyList.removeChild(
            historyList.lastChild
        );

    }

}


// =========================================================
// BUTTON EVENTS
// =========================================================

if (startBtn) {

    startBtn.addEventListener(
        "click",
        startCamera
    );

}


if (stopBtn) {

    stopBtn.addEventListener(
        "click",
        stopCamera
    );

}


if (guessBtn) {

    guessBtn.disabled = true;

    guessBtn.addEventListener(
        "click",
        captureGuessFrame
    );

}


// =========================================================
// INITIALIZATION
// =========================================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        initializeHands();

        // ---------------------------------------------
        // Default target
        // ---------------------------------------------

        loadRandomSign();

        // ---------------------------------------------
        // Start MediaPipe loop.
        // It does nothing until camera starts.
        // ---------------------------------------------

        requestAnimationFrame(
            runHandDetection
        );

    }
);