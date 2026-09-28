```javascript
"use strict";

/*
===========================================================
 SIGN AI - PRACTICE ENGINE
===========================================================

 FIXES:
 - A-Z reference images work
 - Word references use individual letter images
 - MediaPipe hand landmarks work
 - Camera works with getUserMedia
 - Landmark overlay is correctly positioned
 - Guess button activates only when a hand is detected
 - /predict endpoint matches FastAPI router
 - Practice attempts are saved
 - Progress is loaded
 - No screenshot UI
===========================================================
*/


/* =========================================================
   API
========================================================= */

const PREDICT_API_URL = "/predict";

const PRACTICE_ATTEMPT_URL =
    "/practice/attempt";

const PROGRESS_API_URL =
    "/practice/progress";

const RECOMMENDATION_API_URL =
    "/practice/recommendation";


/* =========================================================
   SIGN IMAGE CONFIGURATION
========================================================= */

const SIGN_IMAGE_BASE =
    "/static/images/signs/";


/*
    These are the images that actually exist
    in your static folder.
*/

const SIGN_IMAGES = {};

"ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    .split("")
    .forEach(letter => {

        SIGN_IMAGES[letter] =
            `${SIGN_IMAGE_BASE}${letter}.jpg`;

    });


/* =========================================================
   GLOBAL STATE
========================================================= */

let currentWord = "";

let cameraStream = null;

let latestLandmarks = null;

let latestHandedness = null;

let isCameraRunning = false;

let isProcessingFrame = false;

let animationFrameId = null;

let sessionActive = false;

let currentAttempt = 0;

let sessionTotal = 10;

let earnedXP = 0;

let hands = null;


/* =========================================================
   DOM
========================================================= */

const video =
    document.getElementById("video");

const landmarkCanvas =
    document.getElementById("landmarkCanvas");

const captureCanvas =
    document.getElementById("captureCanvas");

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


/* Reference */

const predictSignImage =
    document.getElementById("predictSignImage");

const referenceLoading =
    document.getElementById("referenceLoading");

const referenceGallery =
    document.getElementById("referenceGallery");

const predictSignName =
    document.getElementById("predictSignName");

const predictSignTitle =
    document.getElementById("predictSignTitle");

const predictSignDescription =
    document.getElementById(
        "predictSignDescription"
    );

const targetInstruction =
    document.getElementById(
        "targetInstruction"
    );

const targetCategory =
    document.getElementById(
        "targetCategory"
    );

const targetDifficulty =
    document.getElementById(
        "targetDifficulty"
    );

const targetWord =
    document.getElementById(
        "targetWord"
    );

const currentSignNumber =
    document.getElementById(
        "currentSignNumber"
    );


/* Results */

const predictionElement =
    document.getElementById(
        "prediction"
    );

const confidenceText =
    document.getElementById(
        "confidenceText"
    );

const progressCircle =
    document.getElementById(
        "progressCircle"
    );

const resultTarget =
    document.getElementById(
        "resultTarget"
    );

const resultDetected =
    document.getElementById(
        "resultDetected"
    );

const predictionStatus =
    document.getElementById(
        "predictionStatus"
    );

const resultMessage =
    document.getElementById(
        "resultMessage"
    );

const resultMessageText =
    document.getElementById(
        "resultMessageText"
    );

const suggestionTitle =
    document.getElementById(
        "suggestionTitle"
    );

const suggestionText =
    document.getElementById(
        "suggestionText"
    );

const tryAgainBtn =
    document.getElementById(
        "tryAgainBtn"
    );

const nextWordBtn =
    document.getElementById(
        "nextWord"
    );


/* Progress */

const sessionProgress =
    document.getElementById(
        "sessionProgress"
    );

const sessionProgressPercent =
    document.getElementById(
        "sessionProgressPercent"
    );

const sessionProgressBar =
    document.getElementById(
        "sessionProgressBar"
    );

const earnedXPElement =
    document.getElementById(
        "earnedXP"
    );


/* Stats */

const attemptsElement =
    document.getElementById(
        "attempts"
    );

const correctElement =
    document.getElementById(
        "correct"
    );

const practiceAccuracy =
    document.getElementById(
        "practiceAccuracy"
    );

const practiceStreak =
    document.getElementById(
        "practiceStreak"
    );

const recommendationElement =
    document.getElementById(
        "recommendation"
    );

const currentLevel =
    document.getElementById(
        "currentLevel"
    );


/* Goal */

const goalPercent =
    document.getElementById(
        "goalPercent"
    );

const goalText =
    document.getElementById(
        "goalText"
    );

const goalBar =
    document.getElementById(
        "goalBar"
    );


/* Practice status */

const practiceRunningBtn =
    document.getElementById(
        "practiceRunningBtn"
    );

const practiceRunningText =
    document.getElementById(
        "practiceRunningText"
    );


/* =========================================================
   CANVAS
========================================================= */

const ctx =
    landmarkCanvas
        ? landmarkCanvas.getContext("2d")
        : null;


/* =========================================================
   INITIALIZE MEDIAPIPE
========================================================= */

function initializeMediaPipe() {

    if (
        typeof Hands === "undefined"
    ) {

        console.error(
            "MediaPipe Hands is not loaded."
        );

        if (landmarkStatus) {

            landmarkStatus.textContent =
                "🔴 MediaPipe failed to load";

        }

        return;

    }


    hands = new Hands({

        locateFile: file => {

            return (
                "https://cdn.jsdelivr.net/npm/" +
                "@mediapipe/hands/" +
                file
            );

        }

    });


    hands.setOptions({

        maxNumHands: 1,

        modelComplexity: 1,

        minDetectionConfidence: 0.60,

        minTrackingConfidence: 0.60

    });


    hands.onResults(
        handleHandResults
    );

}


initializeMediaPipe();


/* =========================================================
   PAGE INITIALIZATION
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        setupEventListeners();

        updateSessionUI();

        updateCameraUI(false);

        updatePracticeStatus(false);

        resetReferenceImage();

        resetResult();

        await loadProgress();

    }
);


/* =========================================================
   EVENT LISTENERS
========================================================= */

function setupEventListeners() {


    if (startBtn) {

        startBtn.addEventListener(
            "click",
            startCamera
        );

    }


    if (stopBtn) {

        stopBtn.addEventListener(
            "click",
            () => stopCamera(true)
        );

    }


    if (recognizeBtn) {

        recognizeBtn.addEventListener(
            "click",
            guessSign
        );

    }


    if (tryAgainBtn) {

        tryAgainBtn.addEventListener(
            "click",
            tryAgain
        );

    }


    if (nextWordBtn) {

        nextWordBtn.addEventListener(
            "click",
            nextSign
        );

    }


    if (practiceRunningBtn) {

        practiceRunningBtn.addEventListener(
            "click",
            async () => {

                if (!sessionActive) {

                    await startPractice();

                }

            }
        );

    }


    /*
        Practice modes
    */

    document
        .querySelectorAll(
            "#randomMode, #customMode, #weakMode"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    document
                        .querySelectorAll(
                            "#randomMode, #customMode, #weakMode"
                        )
                        .forEach(item => {

                            item.classList.remove(
                                "active"
                            );

                        });


                    button.classList.add(
                        "active"
                    );


                    const customPanel =
                        document.getElementById(
                            "customSignsPanel"
                        );


                    if (
                        customPanel &&
                        button.id === "customMode"
                    ) {

                        customPanel.style.display =
                            "block";

                    }

                    else if (customPanel) {

                        customPanel.style.display =
                            "none";

                    }

                }
            );

        });


    /*
        Custom sign buttons
    */

    document
        .querySelectorAll(".sign-chip")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    document
                        .querySelectorAll(
                            ".sign-chip"
                        )
                        .forEach(item => {

                            item.classList.remove(
                                "selected"
                            );

                        });


                    button.classList.add(
                        "selected"
                    );


                    const selectedCount =
                        document.getElementById(
                            "selectedCount"
                        );


                    if (selectedCount) {

                        selectedCount.textContent =
                            "1 selected";

                    }

                }
            );

        });

}


/* =========================================================
   START PRACTICE
========================================================= */

async function startPractice() {

    const difficultyElement =
        document.getElementById(
            "difficulty"
        );

    const categoryElement =
        document.getElementById(
            "signCategory"
        );

    const sessionLengthElement =
        document.getElementById(
            "sessionLength"
        );


    const difficulty =
        difficultyElement
            ? difficultyElement.value
            : "easy";


    const category =
        categoryElement
            ? categoryElement.value
            : "alphabet";


    sessionTotal =
        sessionLengthElement
            ? Number(
                sessionLengthElement.value
            )
            : 10;


    currentAttempt = 0;

    earnedXP = 0;

    sessionActive = true;


    updatePracticeStatus(true);

    updateSessionUI();


    /*
        Check custom mode.
    */

    const customMode =
        document.getElementById(
            "customMode"
        );


    let selectedSign = null;


    if (
        customMode &&
        customMode.classList.contains(
            "active"
        )
    ) {

        const selected =
            document.querySelector(
                ".sign-chip.selected"
            );


        if (selected) {

            selectedSign =
                selected.dataset.sign;

        }

    }


    /*
        Get target.
    */

    if (selectedSign) {

        currentWord =
            selectedSign;

    }

    else {

        currentWord =
            await getTargetSign(
                difficulty,
                category
            );

    }


    /*
        Absolute fallback.
    */

    if (!currentWord) {

        currentWord = "A";

    }


    currentWord =
        String(currentWord)
            .trim();


    updateTargetDisplay(
        currentWord,
        difficulty,
        category
    );


    /*
        THIS IS THE IMPORTANT PART:
        load the reference before camera.
    */

    await loadReferenceImages(
        currentWord
    );


    resetResult();


    /*
        Start camera.
    */

    await startCamera();

}


/* =========================================================
   GET TARGET
========================================================= */

async function getTargetSign(
    difficulty,
    category
) {


    /*
        Alphabet
    */

    if (
        category === "alphabet" ||
        category === "numbers"
    ) {

        try {

            const response =
                await fetch(
                    `/practice/letter/${encodeURIComponent(
                        difficulty
                    )}`,
                    {
                        cache: "no-store"
                    }
                );


            if (response.ok) {

                const data =
                    await response.json();


                if (
                    data &&
                    data.question
                ) {

                    return String(
                        data.question
                    ).trim();

                }

            }

        }

        catch (error) {

            console.warn(
                "Letter API failed:",
                error
            );

        }


        return randomAlphabet();

    }


    /*
        Word categories
    */

    try {

        const response =
            await fetch(
                `/practice/word/${encodeURIComponent(
                    difficulty
                )}`,
                {
                    cache: "no-store"
                }
            );


        if (response.ok) {

            const data =
                await response.json();


            if (
                data &&
                data.question
            ) {

                return String(
                    data.question
                ).trim();

            }

        }

    }

    catch (error) {

        console.warn(
            "Word API failed:",
            error
        );

    }


    return "HELLO";

}


/* =========================================================
   RANDOM ALPHABET
========================================================= */

function randomAlphabet() {

    const alphabet =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZ";


    return alphabet[
        Math.floor(
            Math.random() *
            alphabet.length
        )
    ];

}


/* =========================================================
   UPDATE TARGET
========================================================= */

function updateTargetDisplay(
    target,
    difficulty,
    category
) {

    const displayName =
        getDisplayName(target);


    if (predictSignName) {

        predictSignName.textContent =
            displayName;

    }


    if (predictSignTitle) {

        predictSignTitle.textContent =
            displayName;

    }


    if (targetWord) {

        targetWord.textContent =
            displayName;

    }


    if (targetDifficulty) {

        targetDifficulty.textContent =
            difficulty === "adaptive"
                ? "AI Adaptive"
                : capitalize(
                    difficulty
                );

    }


    if (targetCategory) {

        targetCategory.textContent =
            capitalize(
                category
            );

    }


    if (currentSignNumber) {

        currentSignNumber.textContent =
            String(
                currentAttempt + 1
            ).padStart(
                2,
                "0"
            );

    }


    if (predictSignDescription) {

        predictSignDescription.textContent =
            `Match the ${displayName} reference shown below.`;

    }


    if (targetInstruction) {

        targetInstruction.textContent =
            "Keep your complete hand visible, match the reference and click Guess.";

    }

}


/* =========================================================
   LOAD REFERENCE IMAGES
========================================================= */

async function loadReferenceImages(
    target
) {

    if (!predictSignImage) {

        console.error(
            "#predictSignImage is missing."
        );

        return false;

    }


    const cleanTarget =
        String(target)
            .trim()
            .toUpperCase();


    /*
        Clear old references.
    */

    predictSignImage.style.display =
        "none";

    predictSignImage.removeAttribute(
        "src"
    );


    if (referenceGallery) {

        referenceGallery.innerHTML = "";

        referenceGallery.style.display =
            "none";

    }


    if (referenceLoading) {

        referenceLoading.style.display =
            "flex";


        const strong =
            referenceLoading.querySelector(
                "strong"
            );

        const span =
            referenceLoading.querySelector(
                "span"
            );


        if (strong) {

            strong.textContent =
                "Loading reference...";

        }


        if (span) {

            span.textContent =
                `Loading ${cleanTarget} reference image.`;

        }

    }


    /*
        SINGLE LETTER
    */

    if (
        cleanTarget.length === 1 &&
        SIGN_IMAGES[cleanTarget]
    ) {

        return loadSingleReference(
            SIGN_IMAGES[cleanTarget],
            cleanTarget
        );

    }


    /*
        WORD
        Example:

        CAT

        C.jpg
        A.jpg
        T.jpg
    */

    const letters =
        cleanTarget
            .replace(
                /[^A-Z]/g,
                ""
            )
            .split("");


    if (
        letters.length === 0
    ) {

        return showReferenceUnavailable(
            "No valid reference sign found."
        );

    }


    const validLetters =
        letters.filter(
            letter =>
                Boolean(
                    SIGN_IMAGES[letter]
                )
        );


    if (
        validLetters.length === 0
    ) {

        return showReferenceUnavailable(
            `No reference images are available for "${cleanTarget}".`
        );

    }


    if (referenceGallery) {

        referenceGallery.innerHTML = "";

        referenceGallery.style.display =
            "grid";

    }


    let loadedCount = 0;


    for (
        const letter of validLetters
    ) {

        const image =
            document.createElement(
                "img"
            );


        image.className =
            "reference-letter-image";


        image.alt =
            `Sign ${letter}`;


        image.src =
            SIGN_IMAGES[letter] +
            `?v=${Date.now()}`;


        image.loading =
            "eager";


        image.decoding =
            "async";


        image.addEventListener(
            "load",
            () => {

                loadedCount++;

            }
        );


        image.addEventListener(
            "error",
            () => {

                console.error(
                    "Reference image failed:",
                    image.src
                );

            }
        );


        const wrapper =
            document.createElement(
                "div"
            );


        wrapper.className =
            "reference-letter-card";


        const label =
            document.createElement(
                "strong"
            );


        label.textContent =
            letter;


        wrapper.appendChild(
            image
        );

        wrapper.appendChild(
            label
        );


        referenceGallery.appendChild(
            wrapper
        );

    }


    if (referenceLoading) {

        referenceLoading.style.display =
            "none";

    }


    return true;

}


/* =========================================================
   SINGLE REFERENCE
========================================================= */

function loadSingleReference(
    imagePath,
    letter
) {

    return new Promise(
        resolve => {

            predictSignImage.onload =
                () => {

                    predictSignImage.style.display =
                        "block";

                    predictSignImage.style.visibility =
                        "visible";


                    if (referenceLoading) {

                        referenceLoading.style.display =
                            "none";

                    }


                    console.log(
                        "Reference loaded:",
                        imagePath
                    );


                    resolve(true);

                };


            predictSignImage.onerror =
                () => {

                    console.error(
                        "Reference image failed:",
                        imagePath
                    );


                    resolve(
                        showReferenceUnavailable(
                            `Unable to load ${letter} reference image.`
                        )
                    );

                };


            predictSignImage.src =
                imagePath +
                `?v=${Date.now()}`;

        }
    );

}


/* =========================================================
   REFERENCE ERROR
========================================================= */

function showReferenceUnavailable(
    message
) {

    if (predictSignImage) {

        predictSignImage.style.display =
            "none";

    }


    if (referenceGallery) {

        referenceGallery.innerHTML = "";

        referenceGallery.style.display =
            "none";

    }


    if (referenceLoading) {

        referenceLoading.style.display =
            "flex";


        const strong =
            referenceLoading.querySelector(
                "strong"
            );

        const span =
            referenceLoading.querySelector(
                "span"
            );


        if (strong) {

            strong.textContent =
                "Reference unavailable";

        }


        if (span) {

            span.textContent =
                message;

        }

    }


    return false;

}


/* =========================================================
   RESET REFERENCE
========================================================= */

function resetReferenceImage() {

    if (predictSignImage) {

        predictSignImage.style.display =
            "none";

        predictSignImage.removeAttribute(
            "src"
        );

    }


    if (referenceGallery) {

        referenceGallery.innerHTML = "";

        referenceGallery.style.display =
            "none";

    }


    if (referenceLoading) {

        referenceLoading.style.display =
            "flex";


        const strong =
            referenceLoading.querySelector(
                "strong"
            );

        const span =
            referenceLoading.querySelector(
                "span"
            );


        if (strong) {

            strong.textContent =
                "Waiting for target";

        }


        if (span) {

            span.textContent =
                "Start practice to receive your reference sign.";

        }

    }

}


/* =========================================================
   START CAMERA
========================================================= */

async function startCamera() {

    if (
        isCameraRunning &&
        cameraStream
    ) {

        return true;

    }


    stopCamera(false);


    if (
        !navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia
    ) {

        showCameraError(
            "Camera access is not supported by this browser."
        );

        return false;

    }


    if (!hands) {

        showCameraError(
            "MediaPipe Hands has not loaded. Refresh the page and try again."
        );

        return false;

    }


    try {

        updateCameraUI(
            false,
            "Requesting camera..."
        );


        cameraStream =
            await navigator.mediaDevices.getUserMedia({

                video: {

                    width: {
                        ideal: 1280
                    },

                    height: {
                        ideal: 720
                    },

                    facingMode: "user"

                },

                audio: false

            });


        video.srcObject =
            cameraStream;


        await new Promise(
            resolve => {

                if (
                    video.readyState >= 1
                ) {

                    resolve();

                    return;

                }


                video.onloadedmetadata =
                    () => resolve();

            }
        );


        await video.play();


        isCameraRunning =
            true;

        latestLandmarks =
            null;

        latestHandedness =
            null;

        isProcessingFrame =
            false;


        updateCameraUI(true);

        updatePracticeStatus(
            sessionActive
        );


        if (landmarkStatus) {

            landmarkStatus.textContent =
                "✋ Waiting for hand...";

        }


        startFrameLoop();


        return true;

    }

    catch (error) {

        console.error(
            "Camera error:",
            error
        );


        isCameraRunning =
            false;


        if (cameraStream) {

            cameraStream
                .getTracks()
                .forEach(
                    track => track.stop()
                );

        }


        cameraStream =
            null;


        updateCameraUI(false);


        showCameraError(
            getCameraErrorMessage(
                error
            )
        );


        return false;

    }

}


/* =========================================================
   FRAME LOOP
========================================================= */

function startFrameLoop() {

    if (
        animationFrameId !== null
    ) {

        cancelAnimationFrame(
            animationFrameId
        );

        animationFrameId =
            null;

    }


    const loop =
        async () => {

            if (
                !isCameraRunning
            ) {

                animationFrameId =
                    null;

                return;

            }


            await processCameraFrame();


            animationFrameId =
                requestAnimationFrame(
                    loop
                );

        };


    animationFrameId =
        requestAnimationFrame(
            loop
        );

}


/* =========================================================
   PROCESS CAMERA FRAME
========================================================= */

async function processCameraFrame() {

    if (
        !isCameraRunning ||
        !video ||
        video.readyState < 2 ||
        !hands ||
        isProcessingFrame
    ) {

        return;

    }


    try {

        isProcessingFrame =
            true;


        await hands.send({

            image: video

        });

    }

    catch (error) {

        if (isCameraRunning) {

            console.error(
                "MediaPipe frame error:",
                error
            );

        }

    }

    finally {

        isProcessingFrame =
            false;

    }

}


/* =========================================================
   MEDIAPIPE RESULTS
========================================================= */

function handleHandResults(
    results
) {

    if (
        !isCameraRunning ||
        !landmarkCanvas ||
        !ctx ||
        !video
    ) {

        return;

    }


    const width =
        video.videoWidth ||
        1280;


    const height =
        video.videoHeight ||
        720;


    /*
        Match canvas internal resolution
        with camera resolution.
    */

    if (
        landmarkCanvas.width !== width
    ) {

        landmarkCanvas.width =
            width;

    }


    if (
        landmarkCanvas.height !== height
    ) {

        landmarkCanvas.height =
            height;

    }


    ctx.clearRect(
        0,
        0,
        width,
        height
    );


    /*
        DO NOT draw results.image.

        The video element already displays
        the camera.

        We only draw landmarks.
    */


    if (
        results.multiHandLandmarks &&
        results.multiHandLandmarks.length > 0
    ) {

        latestLandmarks =
            results.multiHandLandmarks[0];


        if (
            results.multiHandedness &&
            results.multiHandedness.length > 0
        ) {

            latestHandedness =
                results.multiHandedness[0].label;

        }


        drawHandLandmarks(
            ctx,
            latestLandmarks
        );


        if (landmarkStatus) {

            landmarkStatus.textContent =
                "🟢 Hand detected";


            landmarkStatus.classList.add(
                "detected"
            );

        }

    }

    else {

        latestLandmarks =
            null;

        latestHandedness =
            null;


        if (landmarkStatus) {

            landmarkStatus.textContent =
                "✋ Waiting for hand...";


            landmarkStatus.classList.remove(
                "detected"
            );

        }

    }


    if (recognizeBtn) {

        recognizeBtn.disabled =
            !isCameraRunning ||
            !latestLandmarks;

    }

}


/* =========================================================
   DRAW LANDMARKS
========================================================= */

function drawHandLandmarks(
    context,
    landmarks
) {

    if (
        typeof drawConnectors !==
            "function" ||
        typeof drawLandmarks !==
            "function"
    ) {

        console.error(
            "MediaPipe drawing utilities are missing."
        );

        return;

    }


    drawConnectors(
        context,
        landmarks,
        HAND_CONNECTIONS,
        {

            color: "#22c55e",

            lineWidth: 5

        }
    );


    drawLandmarks(
        context,
        landmarks,
        {

            color: "#ffffff",

            fillColor: "#2563eb",

            lineWidth: 2,

            radius: 6

        }
    );

}


/* =========================================================
   STOP CAMERA
========================================================= */

function stopCamera(
    updateUI = true
) {

    isCameraRunning =
        false;

    isProcessingFrame =
        false;


    if (
        animationFrameId !== null
    ) {

        cancelAnimationFrame(
            animationFrameId
        );

        animationFrameId =
            null;

    }


    if (cameraStream) {

        cameraStream
            .getTracks()
            .forEach(
                track => {

                    try {

                        track.stop();

                    }

                    catch (_) {}

                }
            );

    }


    cameraStream =
        null;


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


    if (ctx && landmarkCanvas) {

        ctx.clearRect(
            0,
            0,
            landmarkCanvas.width,
            landmarkCanvas.height
        );

    }


    if (recognizeBtn) {

        recognizeBtn.disabled =
            true;

    }


    if (updateUI) {

        updateCameraUI(false);

    }

}


/* =========================================================
   CAMERA UI
========================================================= */

function updateCameraUI(
    running,
    customStatus = null
) {

    if (cameraStatus) {

        if (running) {

            cameraStatus.className =
                "camera-status on";

            cameraStatus.innerHTML =
                '<i class="fa-solid fa-circle"></i> Camera On';

        }

        else {

            cameraStatus.className =
                "camera-status off";

            cameraStatus.innerHTML =
                '<i class="fa-solid fa-circle"></i> ' +
                (
                    customStatus ||
                    "Camera Off"
                );

        }

    }


    if (cameraOverlay) {

        cameraOverlay.style.display =
            running
                ? "none"
                : "flex";

    }


    if (startBtn) {

        startBtn.disabled =
            running;

    }


    if (stopBtn) {

        stopBtn.disabled =
            !running;

    }


    if (recognizeBtn) {

        recognizeBtn.disabled =
            !running ||
            !latestLandmarks;

    }

}


/* =========================================================
   PRACTICE STATUS
========================================================= */

function updatePracticeStatus(
    running
) {

    if (!practiceRunningBtn) {

        return;

    }


    if (running) {

        practiceRunningBtn.classList.add(
            "running"
        );


        practiceRunningBtn.innerHTML =
            '<i class="fa-solid fa-rotate fa-spin"></i>' +
            '<span>Practice Running</span>';

    }

    else {

        practiceRunningBtn.classList.remove(
            "running"
        );


        practiceRunningBtn.innerHTML =
            '<i class="fa-solid fa-play"></i>' +
            '<span>Start Practice</span>';

    }

}


/* =========================================================
   CAMERA ERROR
========================================================= */

function showCameraError(
    message
) {

    if (landmarkStatus) {

        landmarkStatus.textContent =
            "🔴 Camera unavailable";

    }


    if (cameraOverlay) {

        cameraOverlay.style.display =
            "flex";


        const title =
            cameraOverlay.querySelector(
                "h3"
            );


        const description =
            cameraOverlay.querySelector(
                "p"
            );


        if (title) {

            title.textContent =
                "Camera unavailable";

        }


        if (description) {

            description.textContent =
                message;

        }

    }

}


/* =========================================================
   CAMERA ERROR MESSAGE
========================================================= */

function getCameraErrorMessage(
    error
) {

    if (!error) {

        return "Unable to access camera.";

    }


    switch (error.name) {

        case "NotAllowedError":

            return (
                "Camera permission was denied. " +
                "Allow camera access in your browser."
            );


        case "NotFoundError":

            return (
                "No camera was found."
            );


        case "NotReadableError":

            return (
                "The camera is already being used " +
                "by another application."
            );


        case "OverconstrainedError":

            return (
                "The requested camera settings are not supported."
            );


        case "SecurityError":

            return (
                "Camera access was blocked by the browser."
            );


        default:

            return (
                error.message ||
                "Unable to access camera."
            );

    }

}


/* =========================================================
   GUESS SIGN
========================================================= */

async function guessSign() {

    if (!currentWord) {

        alert(
            "Start a practice session first."
        );

        return;

    }


    if (!isCameraRunning) {

        alert(
            "Start the camera first."
        );

        return;

    }


    if (!latestLandmarks) {

        alert(
            "No hand detected. Place your hand clearly inside the camera."
        );

        return;

    }


    if (recognizeBtn) {

        recognizeBtn.disabled =
            true;


        recognizeBtn.innerHTML =
            '<i class="fa-solid fa-spinner fa-spin"></i> Analyzing...';

    }


    try {

        /*
            Capture current camera frame.
        */

        const imageBlob =
            await captureCurrentFrame();


        const formData =
            new FormData();


        formData.append(
            "file",
            imageBlob,
            "sign_capture.jpg"
        );


        formData.append(
            "target",
            currentWord
        );


        const userId =
            getUserId();


        if (userId) {

            formData.append(
                "user_id",
                String(userId)
            );

        }


        console.log(
            "Sending prediction request:",
            {
                target: currentWord,
                user_id: userId,
                imageSize: imageBlob.size
            }
        );


        const response =
            await fetch(
                PREDICT_API_URL,
                {

                    method: "POST",

                    body: formData

                }
            );


        const responseText =
            await response.text();


        let data = {};


        try {

            data =
                responseText
                    ? JSON.parse(
                        responseText
                    )
                    : {};

        }

        catch (_) {

            throw new Error(
                "Server returned invalid JSON: " +
                responseText
            );

        }


        if (!response.ok) {

            throw new Error(
                getApiErrorMessage(
                    data,
                    response.status
                )
            );

        }


        if (
            data.success === false
        ) {

            throw new Error(
                data.message ||
                "Prediction failed."
            );

        }


        if (
            data.prediction ===
            "No Hand"
        ) {

            throw new Error(
                data.message ||
                "The AI could not detect a hand."
            );

        }


        const prediction =
            normalizePrediction(
                data.prediction
            );


        const confidence =
            normalizeConfidence(
                data.confidence
            );


        const isCorrect =
            typeof data.is_correct ===
            "boolean"

                ? data.is_correct

                : predictionMatchesTarget(
                    prediction,
                    currentWord
                );


        displayPredictionResult(
            prediction,
            confidence,
            isCorrect
        );


        await savePracticeAttempt(
            prediction,
            confidence,
            isCorrect
        );


        currentAttempt++;


        if (isCorrect) {

            earnedXP +=
                getXPGain();

        }


        updateSessionUI();


        await loadProgress();

    }

    catch (error) {

        console.error(
            "Prediction error:",
            error
        );


        showPredictionError(
            error.message
        );

    }

    finally {

        if (recognizeBtn) {

            recognizeBtn.innerHTML =
                '<i class="fa-solid fa-wand-magic-sparkles"></i> Guess';


            recognizeBtn.disabled =
                !isCameraRunning ||
                !latestLandmarks;

        }

    }

}


/* =========================================================
   CAPTURE FRAME
========================================================= */

async function captureCurrentFrame() {

    if (
        !video ||
        !video.videoWidth ||
        !video.videoHeight
    ) {

        throw new Error(
            "Camera frame is not ready."
        );

    }


    captureCanvas.width =
        video.videoWidth;


    captureCanvas.height =
        video.videoHeight;


    const context =
        captureCanvas.getContext(
            "2d"
        );


    context.clearRect(
        0,
        0,
        captureCanvas.width,
        captureCanvas.height
    );


    /*
        Do NOT mirror the frame.

        The backend receives the original camera frame.
    */

    context.drawImage(
        video,
        0,
        0,
        captureCanvas.width,
        captureCanvas.height
    );


    return new Promise(
        (resolve, reject) => {

            captureCanvas.toBlob(
                blob => {

                    if (!blob) {

                        reject(
                            new Error(
                                "Unable to capture camera image."
                            )
                        );

                        return;

                    }


                    resolve(blob);

                },

                "image/jpeg",

                0.90

            );

        }
    );

}


/* =========================================================
   DISPLAY RESULT
========================================================= */

function displayPredictionResult(
    prediction,
    confidence,
    isCorrect
) {

    if (predictionElement) {

        predictionElement.textContent =
            getDisplayName(
                prediction
            );

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
                prediction
            );

    }


    if (confidenceText) {

        confidenceText.textContent =
            `${confidence.toFixed(1)}%`;

    }


    updateConfidenceRing(
        confidence
    );


    if (predictionStatus) {

        predictionStatus.textContent =
            isCorrect
                ? "✓ Correct Sign"
                : "✗ Sign Does Not Match";


        predictionStatus.className =
            isCorrect
                ? "prediction-status correct"
                : "prediction-status incorrect";

    }


    if (
        resultMessage &&
        resultMessageText
    ) {

        resultMessage.className =
            isCorrect
                ? "result-message success"
                : "result-message error";


        resultMessageText.textContent =
            isCorrect

                ? "Excellent! Your sign matches the target."

                : "The detected sign does not match the target.";

    }


    if (suggestionTitle) {

        suggestionTitle.textContent =
            isCorrect
                ? "Great work!"
                : "Keep practicing";

    }


    if (suggestionText) {

        if (isCorrect) {

            suggestionText.textContent =
                `You matched "${getDisplayName(
                    currentWord
                )}" with ${confidence.toFixed(
                    1
                )}% AI confidence.`;

        }

        else if (
            confidence < 50
        ) {

            suggestionText.textContent =
                "Keep your entire hand visible and match the finger position shown in the reference.";

        }

        else {

            suggestionText.textContent =
                `Compare your thumb, fingers and hand orientation with the ${getDisplayName(
                    currentWord
                )} reference.`;

        }

    }

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
        70;


    const circumference =
        2 *
        Math.PI *
        radius;


    progressCircle.style.strokeDasharray =
        circumference;


    const safe =
        Math.max(
            0,
            Math.min(
                100,
                Number(
                    confidence
                ) || 0
            )
        );


    const offset =
        circumference -
        (
            safe / 100
        ) *
        circumference;


    progressCircle.style.strokeDashoffset =
        offset;

}


/* =========================================================
   PREDICTION ERROR
========================================================= */

function showPredictionError(
    message
) {

    if (
        resultMessage &&
        resultMessageText
    ) {

        resultMessage.className =
            "result-message error";


        resultMessageText.textContent =
            message ||
            "Unable to analyze the sign.";

    }


    if (suggestionTitle) {

        suggestionTitle.textContent =
            "Unable to analyze";

    }


    if (suggestionText) {

        suggestionText.textContent =
            "Check the camera and make sure your complete hand is visible.";

    }

}


/* =========================================================
   SAVE ATTEMPT
========================================================= */

async function savePracticeAttempt(
    prediction,
    confidence,
    isCorrect
) {

    const userId =
        getUserId();


    if (!userId) {

        console.warn(
            "No user ID found."
        );

        return;

    }


    const difficultyElement =
        document.getElementById(
            "difficulty"
        );


    const categoryElement =
        document.getElementById(
            "signCategory"
        );


    const payload = {

        user_id:
            Number(userId),

        target:
            currentWord,

        prediction:
            prediction,

        confidence:
            confidence,

        difficulty:
            difficultyElement
                ? difficultyElement.value
                : "easy",

        correct:
            isCorrect,

        practice_type:
            categoryElement
                ? categoryElement.value
                : "alphabet",

        feedback:
            isCorrect
                ? "Correct sign"
                : "Try matching the reference sign."

    };


    try {

        const response =
            await fetch(
                PRACTICE_ATTEMPT_URL,
                {

                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body:
                        JSON.stringify(
                            payload
                        )

                }
            );


        if (!response.ok) {

            console.warn(
                "Practice attempt failed:",
                await response.text()
            );

            return;

        }


        const data =
            await response.json();


        if (
            data.xp !== undefined
        ) {

            earnedXP =
                Number(
                    data.xp
                );

        }


    }

    catch (error) {

        console.warn(
            "Could not save practice attempt:",
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
                `${PROGRESS_API_URL}/${encodeURIComponent(
                    userId
                )}`,
                {
                    cache: "no-store"
                }
            );


        if (response.ok) {

            const data =
                await response.json();


            if (attemptsElement) {

                attemptsElement.textContent =
                    data.attempts ?? 0;

            }


            if (correctElement) {

                correctElement.textContent =
                    data.correct ?? 0;

            }


            if (practiceAccuracy) {

                practiceAccuracy.textContent =
                    `${Number(
                        data.accuracy || 0
                    ).toFixed(1)}%`;

            }


            if (practiceStreak) {

                practiceStreak.textContent =
                    data.streak ?? 0;

            }


            if (
                currentLevel &&
                data.level
            ) {

                currentLevel.textContent =
                    data.level;

            }


            if (
                recommendationElement &&
                data.recommendation
            ) {

                recommendationElement.textContent =
                    data.recommendation;

            }

        }

    }

    catch (error) {

        console.warn(
            "Progress unavailable:",
            error
        );

    }


    /*
        Recommendation endpoint
    */

    try {

        const response =
            await fetch(
                `${RECOMMENDATION_API_URL}/${encodeURIComponent(
                    userId
                )}`,
                {
                    cache: "no-store"
                }
            );


        if (
            response.ok &&
            recommendationElement
        ) {

            const data =
                await response.json();


            if (
                data.recommendation
            ) {

                recommendationElement.textContent =
                    data.recommendation;

            }

        }

    }

    catch (error) {

        console.warn(
            "Recommendation unavailable:",
            error
        );

    }

}


/* =========================================================
   TRY AGAIN
========================================================= */

function tryAgain() {

    resetResult();


    latestLandmarks =
        null;


    if (
        recognizeBtn &&
        isCameraRunning
    ) {

        recognizeBtn.disabled =
            true;

    }

}


/* =========================================================
   NEXT SIGN
========================================================= */

async function nextSign() {

    stopCamera();


    if (
        currentAttempt >=
        sessionTotal
    ) {

        sessionActive =
            false;


        updatePracticeStatus(
            false
        );


        if (predictSignName) {

            predictSignName.textContent =
                "Session Completed";

        }


        if (predictSignTitle) {

            predictSignTitle.textContent =
                "Completed";

        }


        showReferenceUnavailable(
            "Great work! Start a new practice session to continue."
        );


        return;

    }


    const difficultyElement =
        document.getElementById(
            "difficulty"
        );


    const categoryElement =
        document.getElementById(
            "signCategory"
        );


    const difficulty =
        difficultyElement
            ? difficultyElement.value
            : "easy";


    const category =
        categoryElement
            ? categoryElement.value
            : "alphabet";


    currentWord =
        await getTargetSign(
            difficulty,
            category
        );


    updateTargetDisplay(
        currentWord,
        difficulty,
        category
    );


    await loadReferenceImages(
        currentWord
    );


    resetResult();


    await startCamera();

}


/* =========================================================
   RESET RESULT
========================================================= */

function resetResult() {

    if (predictionElement) {

        predictionElement.textContent =
            "—";

    }


    if (resultTarget) {

        resultTarget.textContent =
            "—";

    }


    if (resultDetected) {

        resultDetected.textContent =
            "—";

    }


    if (confidenceText) {

        confidenceText.textContent =
            "0%";

    }


    if (predictionStatus) {

        predictionStatus.textContent =
            "Waiting for Guess";


        predictionStatus.className =
            "prediction-status";

    }


    if (
        resultMessage &&
        resultMessageText
    ) {

        resultMessage.className =
            "result-message neutral";


        resultMessageText.textContent =
            "Perform the target sign and click Guess.";

    }


    if (suggestionTitle) {

        suggestionTitle.textContent =
            "Ready to practice";

    }


    if (suggestionText) {

        suggestionText.textContent =
            "Start the camera, match the reference image and click Guess.";

    }


    updateConfidenceRing(
        0
    );

}


/* =========================================================
   SESSION UI
========================================================= */

function updateSessionUI() {

    const safeTotal =
        sessionTotal || 10;


    const completed =
        Math.min(
            currentAttempt,
            safeTotal
        );


    const percent =
        Math.round(
            (
                completed /
                safeTotal
            ) *
            100
        );


    if (sessionProgress) {

        sessionProgress.textContent =
            `${completed} / ${safeTotal}`;

    }


    if (sessionProgressPercent) {

        sessionProgressPercent.textContent =
            `${percent}%`;

    }


    if (sessionProgressBar) {

        sessionProgressBar.style.width =
            `${percent}%`;

    }


    if (earnedXPElement) {

        earnedXPElement.textContent =
            `+${earnedXP} XP`;

    }


    if (goalPercent) {

        goalPercent.textContent =
            `${percent}%`;

    }


    if (goalText) {

        goalText.textContent =
            `${completed} of ${safeTotal} signs completed`;

    }


    if (goalBar) {

        goalBar.style.width =
            `${percent}%`;

    }

}


/* =========================================================
   XP
========================================================= */

function getXPGain() {

    const difficultyElement =
        document.getElementById(
            "difficulty"
        );


    const difficulty =
        difficultyElement
            ? difficultyElement.value
            : "easy";


    return {

        easy: 10,

        medium: 15,

        hard: 25,

        adaptive: 20

    }[difficulty] || 10;

}


/* =========================================================
   USER ID
========================================================= */

function getUserId() {

    const keys = [

        "user_id",

        "userId",

        "id",

        "loggedInUserId",

        "currentUserId"

    ];


    for (
        const key of keys
    ) {

        const value =
            localStorage.getItem(
                key
            );


        if (
            value !== null &&
            value !== ""
        ) {

            return value;

        }

    }


    const currentUser =
        localStorage.getItem(
            "currentUser"
        );


    if (currentUser) {

        try {

            const user =
                JSON.parse(
                    currentUser
                );


            if (
                user &&
                user.id
            ) {

                return user.id;

            }

        }

        catch (_) {

            console.warn(
                "Invalid currentUser."
            );

        }

    }


    return null;

}


/* =========================================================
   NORMALIZE CONFIDENCE
========================================================= */

function normalizeConfidence(
    value
) {

    let confidence =
        Number(value);


    if (
        Number.isNaN(
            confidence
        )
    ) {

        return 0;

    }


    /*
        Backend can return:

        0.85

        OR

        85
    */

    if (
        confidence >= 0 &&
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
   NORMALIZE PREDICTION
========================================================= */

function normalizePrediction(
    prediction
) {

    if (
        prediction === null ||
        prediction === undefined
    ) {

        return "Unknown";

    }


    const value =
        String(
            prediction
        ).trim();


    return value ||
        "Unknown";

}


/* =========================================================
   COMPARE PREDICTION
========================================================= */

function predictionMatchesTarget(
    prediction,
    target
) {

    const predicted =
        String(
            prediction
        )
        .trim()
        .toLowerCase()
        .replace(
            /\s+/g,
            ""
        );


    const expected =
        String(
            target
        )
        .trim()
        .toLowerCase()
        .replace(
            /\s+/g,
            ""
        );


    return (
        predicted ===
        expected
    );

}


/* =========================================================
   DISPLAY NAME
========================================================= */

function getDisplayName(
    value
) {

    if (!value) {

        return "";

    }


    const text =
        String(
            value
        );


    if (
        text.toLowerCase() ===
        "thankyou"
    ) {

        return "Thank You";

    }


    return (
        text.charAt(0).toUpperCase() +
        text.slice(1).toLowerCase()
    );

}


/* =========================================================
   CAPITALIZE
========================================================= */

function capitalize(
    value
) {

    if (!value) {

        return "";

    }


    return (
        value.charAt(0).toUpperCase() +
        value.slice(1)
    );

}


/* =========================================================
   API ERROR
========================================================= */

function getApiErrorMessage(
    data,
    status
) {

    if (
        data &&
        data.detail
    ) {

        if (
            typeof data.detail ===
            "string"
        ) {

            return data.detail;

        }


        return JSON.stringify(
            data.detail
        );

    }


    if (
        data &&
        data.message
    ) {

        return data.message;

    }


    return (
        `Server returned HTTP ${status}.`
    );

}


/* =========================================================
   PAGE CLEANUP
========================================================= */

window.addEventListener(
    "beforeunload",
    () => {

        stopCamera(false);

    }
);


window.addEventListener(
    "pagehide",
    () => {

        stopCamera(false);

    }
);
```
