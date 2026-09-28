"use strict";

/* =========================================================
   SIGN AI - CERTIFICATE.JS
   =========================================================

   Handles:

   - Individual course certificate
   - Certificate validation
   - User name
   - Course name
   - Course level
   - Completion score
   - Issue date
   - Certificate ID
   - PDF download
   - Print
   ========================================================= */


/* =========================================================
   DOM
========================================================= */

const certificateWrapper =
    document.getElementById(
        "certificateWrapper"
    );


const certificateLoading =
    document.getElementById(
        "certificateLoading"
    );


const certificateError =
    document.getElementById(
        "certificateError"
    );


const certificateErrorMessage =
    document.getElementById(
        "certificateErrorMessage"
    );


const certificateElement =
    document.getElementById(
        "certificate"
    );


const certificateUserName =
    document.getElementById(
        "certificateUserName"
    );


const certificateCourseName =
    document.getElementById(
        "certificateCourseName"
    );


const certificateDescription =
    document.getElementById(
        "certificateDescription"
    );


const certificateLevel =
    document.getElementById(
        "certificateLevel"
    );


const certificateScore =
    document.getElementById(
        "certificateScore"
    );


const certificateDate =
    document.getElementById(
        "certificateDate"
    );


const certificateId =
    document.getElementById(
        "certificateId"
    );

const certificateLabel =
    document.getElementById(
        "certificateLabel"
    );

const certificateHeading =
    document.getElementById(
        "certificateHeading"
    );

const certificateCompletionText =
    document.getElementById(
        "certificateCompletionText"
    );

const certificateNote =
    document.getElementById(
        "certificateNote"
    );

const downloadCertificateBtn =
    document.getElementById(
        "downloadCertificateBtn"
    );


const downloadCertificateBtnBottom =
    document.getElementById(
        "downloadCertificateBtnBottom"
    );


const printCertificateBtn =
    document.getElementById(
        "printCertificateBtn"
    );


const printCertificateBtnBottom =
    document.getElementById(
        "printCertificateBtnBottom"
    );


const certificateToast =
    document.getElementById(
        "certificateToast"
    );


const certificateToastMessage =
    document.getElementById(
        "certificateToastMessage"
    );


/* =========================================================
   COURSE DATA
========================================================= */

const COURSE_DETAILS = {

    1: {

        title:
            "Sign Language Fundamentals",

        level:
            "Beginner",

        description:
            "Fundamentals of hand positions, alphabet, numbers and essential sign language communication."

    },


    2: {

        title:
            "ASL Alphabet Mastery",

        level:
            "Beginner",

        description:
            "Master A-Z hand signs through interactive practice and AI-powered feedback."

    },


    3: {

        title:
            "Everyday Communication",

        level:
            "Intermediate",

        description:
            "Learn commonly used signs for everyday conversations, introductions, questions and responses."

    },


    4: {

        title:
            "Advanced Sign Language",

        level:
            "Advanced",

        description:
            "Improve fluency with advanced signs, sentence formation and real-world communication."

    },


    5: {

        title:
            "AI Sign Recognition",

        level:
            "Advanced",

        description:
            "Understand AI and computer vision concepts used to recognize hand landmarks and sign language gestures."

    },


    6: {

        title:
            "Sign Language Conversation",

        level:
            "Intermediate",

        description:
            "Build confidence through realistic conversation exercises and AI-powered practice sessions."

    }

};


/* =========================================================
   STATE
========================================================= */

let currentCertificate =
    null;


/* =========================================================
   INITIALIZE
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    initializeCertificate
);


function initializeCertificate() {

    try {

        currentCertificate = getCertificate();

        if (!currentCertificate) {

            showCertificateError(
                "This certificate is not available. Complete the course first."
            );

            return;
        }

        populateCertificate(
            currentCertificate
        );

        setupCertificateButtons();

        showCertificate();

    }
    catch (error) {

        console.error(
            "Certificate initialization error:",
            error
        );

        showCertificateError(
            "Unable to load this certificate."
        );

    }

}


/* =========================================================
   GET CERTIFICATE
========================================================= */

function getCertificate() {

    const params =
        new URLSearchParams(
            window.location.search
        );

    const courseId =
        params.get("course");

    const isPreview =
        params.get("preview") === "true";


    /*
     * =====================================================
     * CERTIFICATE PREVIEW
     * =====================================================
     *
     * Preview mode does NOT create or save a certificate.
     *
     * Example:
     *
     * certificate.html?course=1&preview=true
     */

    if (isPreview) {

        if (!courseId) {
            return null;
        }

        const numericCourseId =
            Number(courseId);

        const course =
            COURSE_DETAILS[numericCourseId];

        if (!course) {
            return null;
        }

        const userName =
            localStorage.getItem("username") ||
            localStorage.getItem("name") ||
            localStorage.getItem("userName") ||
            "SignAI Learner";


        return {

            id: "PREVIEW",

            courseId:
                numericCourseId,

            courseTitle:
                course.title,

            userName:
                userName,

            score:
                null,

            issuedAt:
                null,

            type:
                "preview"

        };

    }


    /*
     * =====================================================
     * REAL / EARNED CERTIFICATE
     * =====================================================
     */

    const stored =
        localStorage.getItem(
            "selected_certificate"
        );


    if (stored) {

        try {

            const certificate =
                JSON.parse(stored);


            /*
             * Make sure the certificate belongs
             * to the requested course.
             */

            if (
                !courseId ||
                Number(
                    certificate.courseId
                ) ===
                Number(courseId)
            ) {

                return certificate;

            }

        }
        catch (error) {

            console.warn(
                "Stored certificate could not be parsed.",
                error
            );

        }

    }


    /*
     * Fallback:
     * Read the complete earned certificate collection.
     */

    const storedCertificates =
        localStorage.getItem(
            "signai_certificates"
        );


    if (
        storedCertificates &&
        courseId
    ) {

        try {

            const certificates =
                JSON.parse(
                    storedCertificates
                );


            if (
                certificates[courseId]
            ) {

                return certificates[courseId];

            }

        }
        catch (error) {

            console.warn(
                "Certificate collection could not be parsed.",
                error
            );

        }

    }


    return null;

}

/* =========================================================
   POPULATE
========================================================= */

function populateCertificate(
    certificate
) {

    const courseId =
        Number(
            certificate.courseId
        );


    const course =
        COURSE_DETAILS[courseId] ||
        {};


    const userName =
        certificate.userName ||
        localStorage.getItem(
            "username"
        ) ||
        localStorage.getItem(
            "name"
        ) ||
        "SignAI Learner";


    const courseName =
        certificate.courseTitle ||
        course.title ||
        "Sign Language Course";


    const level =
        course.level ||
        "General";


    const description =
        course.description ||
        "SignAI learning program";


    const isPreview =
    certificate.type === "preview";

    const score =
        isPreview
        ? null
        : normalizeScore(
            certificate.score
        );


    const issueDate =
        formatDate(
            certificate.issuedAt
        );


    const id =
         certificate.type === "preview"
        ? "PREVIEW"
        : (
            certificate.id ||
            `CERT-${Date.now()}`
        );


    if (certificateUserName) {

        certificateUserName.textContent =
            userName;

    }


    if (certificateCourseName) {

        certificateCourseName.textContent =
            courseName;

    }


    if (certificateDescription) {

        certificateDescription.textContent =
            description;

    }


    if (certificateLevel) {

        certificateLevel.textContent =
            level;

    }


    if (certificateScore) {

        certificateScore.textContent =
        isPreview
            ? "PREVIEW"
            : `${score}%`;

        }


    if (certificateDate) {

        certificateDate.textContent =
            issueDate;

    }


    if (certificateId) {

        certificateId.textContent =
            id;

    }

}
/*
 * =====================================================
 * PREVIEW MODE UI
 * =====================================================
 */

if (isPreview) {

    if (certificateLabel) {

        certificateLabel.textContent =
            "CERTIFICATE PREVIEW";

    }


    if (certificateHeading) {

        certificateHeading.textContent =
            "Preview";

    }


    if (certificateCompletionText) {

        certificateCompletionText.textContent =
            "certificate preview for the course";

    }


    if (certificateNote) {

        certificateNote.textContent =
            "This is a certificate preview. It does not represent successful course completion.";

    }

}
else {

    if (certificateLabel) {

        certificateLabel.textContent =
            "OFFICIAL CERTIFICATE";

    }


    if (certificateHeading) {

        certificateHeading.textContent =
            "Completion";

    }


    if (certificateCompletionText) {

        certificateCompletionText.textContent =
            "for successfully completing the course";

    }


    if (certificateNote) {

        certificateNote.textContent =
            "This certificate was issued by SignAI Academy upon successful completion of the course.";

    }

}

/* =========================================================
   SCORE
========================================================= */

function normalizeScore(
    score
) {

    const value =
        Number(score);


    if (
        !Number.isFinite(value)
    ) {

        return 0;

    }


    return Math.max(
        0,
        Math.min(
            100,
            Math.round(value)
        )
    );

}


/* =========================================================
   DATE
========================================================= */

function formatDate(
    value
) {

    if (!value) {

        return "—";

    }


    const date =
        new Date(
            value
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "—";

    }


    return date.toLocaleDateString(
        "en-IN",
        {

            day:
                "numeric",

            month:
                "long",

            year:
                "numeric"

        }
    );

}


/* =========================================================
   BUTTONS
========================================================= */

function setupCertificateButtons() {

    const downloadButtons = [

        downloadCertificateBtn,

        downloadCertificateBtnBottom

    ];


    downloadButtons.forEach(
        button => {

            if (!button) {
                return;
            }

            button.addEventListener(
                "click",
                downloadCertificatePDF
            );

        }
    );


    const printButtons = [

        printCertificateBtn,

        printCertificateBtnBottom

    ];


    printButtons.forEach(
        button => {

            if (!button) {
                return;
            }

            button.addEventListener(
                "click",
                printCertificate
            );

        }
    );

}


/* =========================================================
   SHOW CERTIFICATE
========================================================= */

function showCertificate() {

    if (certificateLoading) {

        certificateLoading.classList.add(
            "hidden"
        );

    }


    if (certificateError) {

        certificateError.classList.add(
            "hidden"
        );

    }


    if (certificateWrapper) {

        certificateWrapper.classList.remove(
            "hidden"
        );

    }

}


/* =========================================================
   ERROR
========================================================= */

function showCertificateError(
    message
) {

    if (certificateLoading) {

        certificateLoading.classList.add(
            "hidden"
        );

    }


    if (certificateWrapper) {

        certificateWrapper.classList.add(
            "hidden"
        );

    }


    if (certificateErrorMessage) {

        certificateErrorMessage.textContent =
            message;

    }


    if (certificateError) {

        certificateError.classList.remove(
            "hidden"
        );

    }

}


/* =========================================================
   DOWNLOAD PDF
========================================================= */

async function downloadCertificatePDF() {

    if (!currentCertificate) {

        showToast(
            "Certificate data is unavailable.",
            "error"
        );

        return;

    }


    if (
        !window.jspdf ||
        !window.jspdf.jsPDF
    ) {

        showToast(
            "PDF library could not be loaded. Use Print instead.",
            "error"
        );

        return;

    }


    const buttons = [

        downloadCertificateBtn,

        downloadCertificateBtnBottom

    ];


    buttons.forEach(
        button => {

            if (button) {

                button.disabled =
                    true;

                button.dataset.originalText =
                    button.innerHTML;

                button.innerHTML =
                    '<i class="fa-solid fa-spinner fa-spin"></i> Creating PDF...';

            }

        }
    );


    try {

        const {
            jsPDF
        } = window.jspdf;


        /*
           A4 landscape.
        */

        const pdf =
            new jsPDF({

                orientation:
                    "landscape",

                unit:
                    "mm",

                format:
                    "a4",

                compress:
                    true

            });


        const pageWidth =
            pdf.internal.pageSize.getWidth();


        const pageHeight =
            pdf.internal.pageSize.getHeight();


        /*
           Background.
        */

        pdf.setFillColor(
            248,
            250,
            252
        );


        pdf.rect(
            0,
            0,
            pageWidth,
            pageHeight,
            "F"
        );


        /*
           Outer border.
        */

        pdf.setDrawColor(
            190,
            207,
            230
        );


        pdf.setLineWidth(
            1.2
        );


        pdf.rect(
            8,
            8,
            pageWidth - 16,
            pageHeight - 16
        );


        /*
           Inner border.
        */

        pdf.setLineWidth(
            0.35
        );


        pdf.setDrawColor(
            220,
            230,
            242
        );


        pdf.rect(
            12,
            12,
            pageWidth - 24,
            pageHeight - 24
        );


        /*
           Accent top line.
        */

        pdf.setDrawColor(
            37,
            99,
            235
        );


        pdf.setLineWidth(
            1.5
        );


        pdf.line(
            25,
            25,
            pageWidth - 25,
            25
        );


        /*
           SignAI.
        */

        pdf.setTextColor(
            23,
            32,
            51
        );


        pdf.setFont(
            "helvetica",
            "bold"
        );


        pdf.setFontSize(
            21
        );


        pdf.text(
            "SignAI",
            30,
            39
        );


        pdf.setFont(
            "helvetica",
            "normal"
        );


        pdf.setFontSize(
            7
        );


        pdf.setTextColor(
            100,
            116,
            139
        );


        pdf.text(
            "AI SIGN LANGUAGE ACADEMY",
            30,
            45
        );


        /*
           Certificate label.
        */

        pdf.setFont(
            "helvetica",
            "bold"
        );


        pdf.setFontSize(
            7
        );


        pdf.setTextColor(
            37,
            99,
            235
        );


        
        pdf.text(
          isPreviewCertificate()
        ? "CERTIFICATE PREVIEW"
        : "OFFICIAL CERTIFICATE",
         pageWidth - 30,
         39,
           {
            align:
            "right"
           }
        );


        /*
           Main heading.
        */

        pdf.setTextColor(
            37,
            99,
            235
        );


        pdf.setFontSize(
            10
        );


        pdf.text(
            "CERTIFICATE OF",
            pageWidth / 2,
            55,
            {
                align:
                    "center"
            }
        );


        pdf.setTextColor(
            23,
            32,
            51
        );


        pdf.setFont(
            "times",
            "normal"
        );


        pdf.setFontSize(
            36
        );


        pdf.text(
        isPreviewCertificate()
            ? "Preview"
            : "Completion",
        pageWidth / 2,
        72,
        {
            align:
                "center"
        }
    );


        /*
           Recipient.
        */

        pdf.setFont(
            "helvetica",
            "normal"
        );


        pdf.setFontSize(
            9
        );


        pdf.setTextColor(
            100,
            116,
            139
        );


        pdf.text(
            "This certificate is proudly presented to",
            pageWidth / 2,
            87,
            {
                align:
                    "center"
            }
        );


        pdf.setFont(
            "times",
            "bold"
        );


        pdf.setFontSize(
            27
        );


        pdf.setTextColor(
            23,
            32,
            51
        );


        pdf.text(
            getCertificateUserName(),
            pageWidth / 2,
            101,
            {
                align:
                    "center"
            }
        );


        pdf.setDrawColor(
            185,
            203,
            229
        );


        pdf.setLineWidth(
            0.3
        );


        pdf.line(
            78,
            105,
            pageWidth - 78,
            105
        );


        /*
           Course.
        */

        pdf.setFont(
            "helvetica",
            "normal"
        );


        pdf.setFontSize(
            9
        );


        pdf.setTextColor(
            100,
            116,
            139
        );


        pdf.text(
        isPreviewCertificate()
            ? "certificate preview for the course"
            : "for successfully completing the course",
            pageWidth / 2,
        117,
        {
            align:
                "center"
        }
    );


        pdf.setFont(
            "helvetica",
            "bold"
        );


        pdf.setFontSize(
            19
        );


        pdf.setTextColor(
            37,
            99,
            235
        );


        const courseTitle =
            getCertificateCourse();


        pdf.text(
            courseTitle,
            pageWidth / 2,
            130,
            {
                align:
                    "center",
                maxWidth:
                    pageWidth - 80
            }
        );


        /*
           Information.
        */

        const infoY =
            150;


        pdf.setDrawColor(
            220,
            230,
            242
        );


        pdf.line(
            58,
            infoY - 6,
            pageWidth - 58,
            infoY - 6
        );


        pdf.line(
            58,
            infoY + 14,
            pageWidth - 58,
            infoY + 14
        );


        const columns = [

            {
                x:
                    pageWidth * 0.30,

                label:
                    "COURSE LEVEL",

                value:
                    getCertificateLevel()

            },

            {
                x:
                    pageWidth * 0.50,

                label:
                    "COMPLETION SCORE",

                value:
                    isPreviewCertificate()
                    ? "PREVIEW"
                    : `${getCertificateScore()}%`

            },

            {
                x:
                    pageWidth * 0.70,

                label:
                    "ISSUE DATE",

                value:
                    getCertificateDate()

            }

        ];
function isPreviewCertificate() {

    return (
        currentCertificate &&
        currentCertificate.type === "preview"
    );

}

        columns.forEach(
            item => {

                pdf.setFont(
                    "helvetica",
                    "bold"
                );


                pdf.setFontSize(
                    6
                );


                pdf.setTextColor(
                    100,
                    116,
                    139
                );


                pdf.text(
                    item.label,
                    item.x,
                    infoY,
                    {
                        align:
                            "center"
                    }
                );


                pdf.setFontSize(
                    9
                );


                pdf.setTextColor(
                    23,
                    32,
                    51
                );


                pdf.text(
                    item.value,
                    item.x,
                    infoY + 8,
                    {
                        align:
                            "center"
                    }
                );

            }
        );


        /*
           Bottom signature.
        */

        const bottomY =
            180;


        pdf.setFont(
            "times",
            "italic"
        );


        pdf.setFontSize(
            12
        );


        pdf.setTextColor(
            51,
            65,
            85
        );


        pdf.text(
            "SignAI Academy",
            60,
            bottomY,
            {
                align:
                    "center"
            }
        );


        pdf.setDrawColor(
            159,
            178,
            205
        );


        pdf.setLineWidth(
            0.3
        );


        pdf.line(
            35,
            bottomY + 3,
            85,
            bottomY + 3
        );


        pdf.setFont(
            "helvetica",
            "normal"
        );


        pdf.setFontSize(
            6
        );


        pdf.setTextColor(
            100,
            116,
            139
        );


        pdf.text(
            "AUTHORIZED ISSUER",
            60,
            bottomY + 9,
            {
                align:
                    "center"
            }
        );


        /*
           Certificate ID.
        */

        pdf.setFont(
            "helvetica",
            "bold"
        );


        pdf.setFontSize(
            6
        );


        pdf.text(
            "CERTIFICATE ID",
            pageWidth - 60,
            bottomY,
            {
                align:
                    "center"
            }
        );


        pdf.setFontSize(
            8
        );


        pdf.setTextColor(
            23,
            32,
            51
        );


        pdf.text(
            getCertificateId(),
            pageWidth - 60,
            bottomY + 8,
            {
                align:
                    "center"
            }
        );


        pdf.setFont(
            "helvetica",
            "normal"
        );


        pdf.setFontSize(
            6
        );


        pdf.setTextColor(
            100,
            116,
            139
        );


        pdf.text(
            "SignAI Academy",
            pageWidth - 60,
            bottomY + 15,
            {
                align:
                    "center"
            }
        );


        /*
           Save.
        */

        const filename =
            createFileName();


        pdf.save(
            filename
        );


        showToast(
            "Certificate PDF downloaded successfully.",
            "success"
        );

    }
    catch (error) {

        console.error(
            "PDF generation failed:",
            error
        );

        showToast(
            "Unable to create the PDF. Try Print instead.",
            "error"
        );

    }
    finally {

        buttons.forEach(
            button => {

                if (!button) {
                    return;
                }

                button.disabled =
                    false;

                button.innerHTML =
                    button.dataset.originalText ||
                    '<i class="fa-solid fa-download"></i> Download PDF';

            }
        );

    }

}


/* =========================================================
   PRINT
========================================================= */

function printCertificate() {

    if (!currentCertificate) {

        showToast(
            "Certificate is unavailable.",
            "error"
        );

        return;

    }


    window.print();

}


/* =========================================================
   GETTERS
========================================================= */

function getCertificateUserName() {

    return (
        certificateUserName?.textContent ||
        "SignAI Learner"
    ).trim();

}


function getCertificateCourse() {

    return (
        certificateCourseName?.textContent ||
        "Sign Language Course"
    ).trim();

}


function getCertificateLevel() {

    return (
        certificateLevel?.textContent ||
        "General"
    ).trim();

}


function getCertificateScore() {

    return normalizeScore(
        certificateScore?.textContent
            ?.replace(
                "%",
                ""
            )
    );

}


function getCertificateDate() {

    return (
        certificateDate?.textContent ||
        "—"
    ).trim();

}


function getCertificateId() {

    return (
        certificateId?.textContent ||
        "CERT-000000"
    ).trim();

}


/* =========================================================
   FILE NAME
========================================================= */

function createFileName() {

    const course =
        getCertificateCourse()
            .replace(
                /[^a-z0-9]+/gi,
                "-"
            )
            .replace(
                /^-+|-+$/g,
                ""
            );


    if (isPreviewCertificate()) {

        return `SignAI-${course}-Certificate-Preview.pdf`;

    }


    return `SignAI-${course}-Certificate.pdf`;

}


/* =========================================================
   TOAST
========================================================= */

function showToast(
    message,
    type = "success"
) {

    if (
        !certificateToast ||
        !certificateToastMessage
    ) {

        return;

    }


    certificateToastMessage.textContent =
        message;


    certificateToast.classList.toggle(
        "error",
        type === "error"
    );


    certificateToast.classList.add(
        "show"
    );


    setTimeout(
        () => {

            certificateToast.classList.remove(
                "show"
            );

        },
        3500
    );

}


/* =========================================================
   DEBUG
========================================================= */

window.SignAICertificate = {

    getCertificate:
        () =>
            currentCertificate,

    download:
        downloadCertificatePDF,

    print:
        printCertificate

};


console.log(
    "✓ SignAI certificate.js loaded successfully."
);