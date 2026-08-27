import {
    db
} from "./firebase.js";

import {
    doc,
    getDoc,
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";

import {
    listenAuth,
    logoutUser
} from "./auth.js";

import {
    initializeSettings
} from "./settings.js";


/* =====================================================
   FIRESTORE
===================================================== */

const formicDoc =
    doc(
        db,
        "formic_settings",
        "اصلي"
    );


/* =====================================================
   STATE
===================================================== */

let currentUser = null;

let currentRole = "";

let state = {
    شیتونه: []
};

let currentSheetId = "";

let selected = [];

let clipboard = null;

let undoStack = [];

let redoStack = [];


/* =====================================================
   SAVE ENGINE
===================================================== */

let saveTimer = null;

let retryTimer = null;

let saveBusy = false;

let pendingSave = false;

let pendingSnapshot = null;

let saveGeneration = 0;

let savedGeneration = 0;

let retryAttempt = 0;

let pageLeaving = false;

let saveFailedNoticeShown = false;


/* =====================================================
   SAVE CONFIG
===================================================== */

const SAVE_DELAY =
    850;

const MAX_RETRY_DELAY =
    20000;

const MAX_UNDO =
    50;


/* =====================================================
   LOCAL BACKUP
===================================================== */

const LOCAL_BACKUP_KEY =
    "formic_local_backup_v1";


/* =====================================================
   DOM
===================================================== */

function $(
    id
) {

    return document.getElementById(
        id
    );

}


/* =====================================================
   BASIC HELPERS
===================================================== */

function clean(
    value
) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }

    return String(
        value
    ).trim();

}


function deep(
    value
) {

    return JSON.parse(
        JSON.stringify(
            value
        )
    );

}


function isSuper() {

    return (
        currentRole ===
        "superadmin"
    );

}


function toPashtoDigits(
    value
) {

    return String(
        value
    ).replace(
        /\d/g,
        digit =>
            "۰۱۲۳۴۵۶۷۸۹"[digit]
    );

}


/* =====================================================
   MESSAGE
===================================================== */

function showMessage(
    text,
    type = "success"
) {

    const element =
        $("فورمیکپیغام");

    if (!element) {

        console.error(
            text
        );

        return;

    }


    element.textContent =
        text;

    element.className =
        `alert alert-${type}`;

    element.hidden =
        false;


    clearTimeout(
        showMessage.timer
    );


    if (
        type === "danger" ||
        type === "warning" ||
        type === "error"
    ) {

        requestAnimationFrame(
            () => {

                element.scrollIntoView(
                    {
                        behavior:
                            "smooth",

                        block:
                            "center",

                        inline:
                            "nearest"
                    }
                );

            }
        );

    }


    const duration =
        (
            type === "danger" ||
            type === "warning" ||
            type === "error"
        )
            ? 8000
            : 4500;


    showMessage.timer =
        setTimeout(
            () => {

                element.hidden =
                    true;

            },
            duration
        );

}


/* =====================================================
   FIREBASE ERROR HELPERS
===================================================== */

function errorCode(
    error
) {

    return clean(
        error?.code ||
        error?.name ||
        ""
    ).toLowerCase();

}


function errorMessage(
    error
) {

    return clean(
        error?.message ||
        ""
    ).toLowerCase();

}


function isAbortError(
    error
) {

    const code =
        errorCode(
            error
        );

    const message =
        errorMessage(
            error
        );


    return (

        code ===
            "aborterror"

        ||

        code ===
            "aborted"

        ||

        message.includes(
            "the user aborted a request"
        )

        ||

        message.includes(
            "user aborted a request"
        )

        ||

        message.includes(
            "aborted"
        )

    );

}


function isRetryableError(
    error
) {

    const code =
        errorCode(
            error
        );


    return (

        isAbortError(
            error
        )

        ||

        code ===
            "unavailable"

        ||

        code ===
            "deadline-exceeded"

        ||

        code ===
            "internal"

        ||

        code ===
            "resource-exhausted"

        ||

        code ===
            "network-request-failed"

    );

}


function firebaseErrorText(
    error
) {

    const code =
        errorCode(
            error
        );


    if (
        code ===
        "permission-denied"
    ) {

        return (
            "❌ Firestore اجازه نه ورکوي. " +
            "ډاډ ترلاسه کړئ چې حساب مو Superadmin دی او Firestore Rules مو Publish کړي دي."
        );

    }


    if (
        code ===
        "unauthenticated"
    ) {

        return (
            "❌ د Login اعتبار ختم شوی. بیا Login وکړئ."
        );

    }


    if (
        code ===
        "failed-precondition"
    ) {

        return (
            "❌ د Firebase شرط بشپړ نه شو. " +
            "د Firebase تنظیمات وګورئ."
        );

    }


    return (
        "❌ د Firebase عملیاتو پر مهال ستونزه رامنځته شوه." +
        (
            error?.message
                ? ` ${error.message}`
                : ""
        )
    );

}


/* =====================================================
   SAFE EVENT
===================================================== */

function safeEvent(
    element,
    event,
    callback
) {

    if (
        element
    ) {

        element.addEventListener(
            event,
            callback
        );

    }

}


/* =====================================================
   ELEMENTS
===================================================== */

const els = {

    sheets:
        $("شیتونوځای"),

    table:
        $("فورمیکجدول"),

    message:
        $("فورمیکپیغام"),

    status:
        $("سترحالت"),

    statusText:
        $("حالتتشریح"),

    count:
        $("دشمېرښود"),

    save:
        $("خونديکول"),

    permanentSave:
        $("تلپاتېخونديکول"),

    newSheet:
        $("نویشیت"),

    newCol:
        $("نوېستون"),

    newRow:
        $("نوېکرښه"),

    deleteSheet:
        $("شیتحذف"),

    font:
        $("دخط"),

    size:
        $("دلیکاندازه"),

    fontColor:
        $("دلیکټاکليکړنګ"),

    fillColor:
        $("دخانېشالید"),

    hAlign:
        $("دافقيبرابرول"),

    vAlign:
        $("دعموديبرابرول"),

    bold:
        $("غلظت"),

    italic:
        $("کږلیک"),

    underline:
        $("لاندېکرښه"),

    wrap:
        $("تاوول"),

    copy:
        $("کاپي"),

    cut:
        $("پرېکول"),

    paste:
        $("نښلول"),

    clear:
        $("پاکول"),

    allBorders:
        $("ټولسرحدونه"),

    noBorders:
        $("بېسرحد"),

    outerBorder:
        $("بهرنیسرحد"),

    number:
        $("عموميشمېر"),

    percent:
        $("سلنه"),

    thousands:
        $("زرمیش"),

    sum:
        $("ټولول"),

    painter:
        $("فارمیټ_پینټر"),

    clearFormat:
        $("فارمیټ_پاک"),

    find:
        $("لټون"),

    merge:
        $("خانېیوځای"),

    unmerge:
        $("خانېجلا"),

    rowUp:
        $("کرښه_پورته"),

    rowDown:
        $("کرښه_لاندې"),

    colLeft:
        $("ستون_چپ_نوی"),

    colRight:
        $("ستون_راست_نوی")

};


/* =====================================================
   LOCAL BACKUP
===================================================== */

function saveLocalBackup() {

    if (
        !isSuper()
    ) {

        return;

    }


    try {

        localStorage.setItem(
            LOCAL_BACKUP_KEY,
            JSON.stringify({

                شیتونه:
                    deep(
                        state.شیتونه
                    ),

                updatedAt:
                    Date.now()

            })
        );

    } catch (
        error
    ) {

        console.warn(
            "FORMIC LOCAL BACKUP:",
            error
        );

    }

}


function loadLocalBackup() {

    try {

        const raw =
            localStorage.getItem(
                LOCAL_BACKUP_KEY
            );


        if (!raw) {

            return null;

        }


        const parsed =
            JSON.parse(
                raw
            );


        if (
            !Array.isArray(
                parsed?.شیتونه
            )
        ) {

            return null;

        }


        return parsed;

    } catch (
        error
    ) {

        console.warn(
            "FORMIC LOCAL BACKUP LOAD:",
            error
        );


        return null;

    }

}


/* =====================================================
   DEFAULT CELL
===================================================== */

function defaultCell() {

    return {

        متن:
            "",

        fontFamily:
            "Noto Naskh Arabic",

        fontSize:
            14,

        fontColor:
            "#1F2937",

        fillColor:
            "#FFFFFF",

        hAlign:
            "right",

        vAlign:
            "middle",

        bold:
            false,

        italic:
            false,

        underline:
            false,

        wrap:
            true,

        border:
            "1px solid var(--border-color)",

        numberFormat:
            "general"

    };

}


/* =====================================================
   NORMALIZE CELL
===================================================== */

function normalizeCell(
    value
) {

    const old =
        value || {};


    return {

        ...defaultCell(),

        متن:
            old.متن ??
            old.text ??
            "",

        fontFamily:
            old.fontFamily ??
            old.فونټ ??
            "Noto Naskh Arabic",

        fontSize:
            Number(
                old.fontSize ??
                old.دلیکاندازه ??
                14
            ) || 14,

        fontColor:
            old.fontColor ??
            old.دلیک_رنګ ??
            "#1F2937",

        fillColor:
            old.fillColor ??
            old.د_شالید_رنګ ??
            "#FFFFFF",

        hAlign:
            old.hAlign ??
            old.برابرول ??
            "right",

        vAlign:
            old.vAlign ??
            old.عمودي ??
            "middle",

        bold:
            Boolean(
                old.bold ??
                old.غټ ??
                false
            ),

        italic:
            Boolean(
                old.italic ??
                old.کږ ??
                false
            ),

        underline:
            Boolean(
                old.underline ??
                old.لاندېکرښه ??
                false
            ),

        wrap:
            old.wrap ??
            old.تاو ??
            true,

        border:
            old.border ??
            old.سرحد ??
            "1px solid var(--border-color)",

        numberFormat:
            old.numberFormat ??
            old.شمېر_بڼه ??
            "general"

    };

}


/* =====================================================
   DEFAULT SHEET
===================================================== */

function defaultSheet() {

    const time =
        Date.now();


    return {

        پېژند:
            "شیت_۱",

        نوم:
            "لومړی شیت",

        ستنې: [

            {

                پېژند:
                    `ستون_${time}_1`,

                نوم:
                    "نوم",

                پلنوالی:
                    170

            },

            {

                پېژند:
                    `ستون_${time}_2`,

                نوم:
                    "تخلص",

                پلنوالی:
                    170

            },

            {

                پېژند:
                    `ستون_${time}_3`,

                نوم:
                    "معلومات",

                پلنوالی:
                    220

            }

        ],

        کرښې:
            8,

        rowHeights:
            Array(
                8
            ).fill(
                55
            ),

        حجرې:
            {},

        merges:
            []

    };

}


/* =====================================================
   NORMALIZE STATE
===================================================== */

function normalizeState(
    data
) {

    const raw =
        Array.isArray(
            data?.شیتونه
        )
            ? data.شیتونه
            : [];


    const sheets =
        raw.length
            ? raw
            : [
                defaultSheet()
            ];


    return {

        شیتونه:
            sheets.map(
                (
                    source,
                    sheetIndex
                ) => {

                    const rows =
                        Math.max(
                            1,
                            Number(
                                source?.کرښې
                            ) || 8
                        );


                    const sourceColumns =
                        Array.isArray(
                            source?.ستنې
                        )
                            ? source.ستنې
                            : [];


                    const columns =
                        sourceColumns.length
                            ? sourceColumns
                            : deep(
                                defaultSheet()
                                    .ستنې
                            );


                    const cells =
                        {};


                    Object.entries(
                        source?.حجرې ||
                        {}
                    ).forEach(
                        (
                            [
                                key,
                                value
                            ]
                        ) => {

                            cells[key] =
                                normalizeCell(
                                    value
                                );

                        }
                    );


                    const rowHeights =
                        Array.from(
                            {
                                length:
                                    rows
                            },
                            (
                                _,
                                index
                            ) => {

                                const old =
                                    source?.rowHeights?.[index] ??
                                    source?.د_کرښو_لوړوالی?.[index];


                                return Math.max(
                                    35,
                                    Number(
                                        old
                                    ) || 55
                                );

                            }
                        );


                    const oldMerges =
                        Array.isArray(
                            source?.merges
                        )
                            ? source.merges
                            : (
                                Array.isArray(
                                    source?.یوځای_شوي_خانې
                                )
                                    ? source.یوځای_شوي_خانې
                                    : []
                            );


                    const merges =
                        oldMerges
                            .filter(
                                merge => {

                                    const sr =
                                        Number(
                                            merge?.startRow
                                        );

                                    const sc =
                                        Number(
                                            merge?.startCol
                                        );

                                    const rs =
                                        Number(
                                            merge?.rowSpan
                                        );

                                    const cs =
                                        Number(
                                            merge?.colSpan
                                        );


                                    return (

                                        Number.isInteger(
                                            sr
                                        )

                                        &&

                                        Number.isInteger(
                                            sc
                                        )

                                        &&

                                        rs >=
                                            1

                                        &&

                                        cs >=
                                            1

                                        &&

                                        sr >=
                                            0

                                        &&

                                        sc >=
                                            0

                                        &&

                                        sr +
                                            rs <=
                                            rows

                                        &&

                                        sc +
                                            cs <=
                                            columns.length

                                    );

                                }
                            )
                            .map(
                                merge => ({

                                    startRow:
                                        Number(
                                            merge.startRow
                                        ),

                                    startCol:
                                        Number(
                                            merge.startCol
                                        ),

                                    rowSpan:
                                        Number(
                                            merge.rowSpan
                                        ),

                                    colSpan:
                                        Number(
                                            merge.colSpan
                                        )

                                })
                            );


                    return {

                        پېژند:
                            clean(
                                source?.پېژند
                            ) ||
                            `شیت_${
                                sheetIndex +
                                1
                            }`,

                        نوم:
                            clean(
                                source?.نوم
                            ) ||
                            `شیت ${
                                sheetIndex +
                                1
                            }`,

                        ستنې:
                            columns.map(
                                (
                                    column,
                                    columnIndex
                                ) => ({

                                    پېژند:
                                        clean(
                                            column?.پېژند
                                        ) ||
                                        `ستون_${
                                            sheetIndex +
                                            1
                                        }_${
                                            columnIndex +
                                            1
                                        }_${Date.now()}`,

                                    نوم:
                                        clean(
                                            column?.نوم
                                        ) ||
                                        `ستون ${
                                            columnIndex +
                                            1
                                        }`,

                                    پلنوالی:
                                        Math.max(
                                            90,
                                            Number(
                                                column?.پلنوالی
                                            ) || 170
                                        )

                                })
                            ),

                        کرښې:
                            rows,

                        rowHeights,

                        حجرې:
                            cells,

                        merges

                    };

                }
            )

    };

}


/* =====================================================
   CURRENT SHEET
===================================================== */

function getSheet() {

    return (

        state.شیتونه.find(
            sheet =>
                sheet.پېژند ===
                currentSheetId
        )

        ||

        state.شیتونه[0]

        ||

        null

    );

}


/* =====================================================
   CELL KEY
===================================================== */

function cellKey(
    row,
    col
) {

    const sh =
        getSheet();


    const column =
        sh?.ستنې?.[col];


    if (
        !column
    ) {

        return "";

    }


    return (
        `${row}:${column.پېژند}`
    );

}


function cellKeyByColumnId(
    row,
    columnId
) {

    return (
        `${row}:${columnId}`
    );

}


/* =====================================================
   MERGE
===================================================== */

function mergeAt(
    sh,
    row,
    col
) {

    if (
        !Array.isArray(
            sh?.merges
        )
    ) {

        return null;

    }


    return (

        sh.merges.find(
            merge =>

                row >=
                    merge.startRow

                &&

                row <
                    merge.startRow +
                    merge.rowSpan

                &&

                col >=
                    merge.startCol

                &&

                col <
                    merge.startCol +
                    merge.colSpan
        )

        ||

        null

    );

}


function mergeStart(
    sh,
    row,
    col
) {

    const merge =
        mergeAt(
            sh,
            row,
            col
        );


    if (
        !merge
    ) {

        return {

            row,

            col

        };

    }


    return {

        row:
            merge.startRow,

        col:
            merge.startCol

    };

}


/* =====================================================
   SNAPSHOT
===================================================== */

function snapshot() {

    return deep(
        state
    );

}


/* =====================================================
   SELECTION
===================================================== */

function selectCell(
    row,
    col,
    shiftKey = false
) {

    const sh =
        getSheet();


    if (
        !sh
    ) {

        return;

    }


    if (
        shiftKey &&
        selected.length
    ) {

        const first =
            selected[0];


        const startRow =
            Math.min(
                first.row,
                row
            );


        const endRow =
            Math.max(
                first.row,
                row
            );


        const startCol =
            Math.min(
                first.col,
                col
            );


        const endCol =
            Math.max(
                first.col,
                col
            );


        selected =
            [];


        for (
            let r =
                startRow;
            r <=
                endRow;
            r++
        ) {

            for (
                let c =
                    startCol;
                c <=
                    endCol;
                c++
            ) {

                const start =
                    mergeStart(
                        sh,
                        r,
                        c
                    );


                const exists =
                    selected.some(
                        item =>
                            item.row ===
                                start.row
                            &&
                            item.col ===
                                start.col
                    );


                if (
                    !exists
                ) {

                    selected.push(
                        start
                    );

                }

            }

        }

    } else {

        selected = [

            mergeStart(
                sh,
                row,
                col
            )

        ];

    }


    updateSelectionUI();


    syncToolbar();

}


/* =====================================================
   SELECTED RECTANGLE
===================================================== */

function selectedRect() {

    if (
        !selected.length
    ) {

        return null;

    }


    const rows =
        selected.map(
            item =>
                item.row
        );


    const cols =
        selected.map(
            item =>
                item.col
        );


    const startRow =
        Math.min(
            ...rows
        );


    const endRow =
        Math.max(
            ...rows
        );


    const startCol =
        Math.min(
            ...cols
        );


    const endCol =
        Math.max(
            ...cols
        );


    return {

        startRow,

        endRow,

        startCol,

        endCol,

        rows:
            endRow -
            startRow +
            1,

        cols:
            endCol -
            startCol +
            1

    };

}


/* =====================================================
   SELECTION UI
===================================================== */

function updateSelectionUI() {

    if (
        !els.table
    ) {

        return;

    }


    els.table
        .querySelectorAll(
            ".فورمیک-خانه-پوښ"
        )
        .forEach(
            wrapper => {

                wrapper.classList.remove(
                    "انتخاب-شوی"
                );

            }
        );


    selected.forEach(
        position => {

            const wrapper =
                els.table.querySelector(
                    `.فورمیک-خانه-پوښ[data-row="${position.row}"][data-col="${position.col}"]`
                );


            if (
                wrapper
            ) {

                wrapper.classList.add(
                    "انتخاب-شوی"
                );

            }

        }
    );

}


/* =====================================================
   TOOLBAR SYNC
===================================================== */

function syncToolbar() {

    if (
        !selected.length
    ) {

        return;

    }


    const sh =
        getSheet();


    if (
        !sh
    ) {

        return;

    }


    const first =
        mergeStart(
            sh,
            selected[0].row,
            selected[0].col
        );


    const cell =
        normalizeCell(
            sh.حجرې[
                cellKey(
                    first.row,
                    first.col
                )
            ]
        );


    if (
        els.font
    ) {

        els.font.value =
            cell.fontFamily;

    }


    if (
        els.size
    ) {

        els.size.value =
            String(
                cell.fontSize
            );

    }


    if (
        els.fontColor
    ) {

        els.fontColor.value =
            cell.fontColor;

    }


    if (
        els.fillColor
    ) {

        els.fillColor.value =
            cell.fillColor;

    }


    if (
        els.hAlign
    ) {

        els.hAlign.value =
            cell.hAlign;

    }


    if (
        els.vAlign
    ) {

        els.vAlign.value =
            cell.vAlign;

    }


    els.bold?.classList.toggle(
        "فعال",
        cell.bold
    );


    els.italic?.classList.toggle(
        "فعال",
        cell.italic
    );


    els.underline?.classList.toggle(
        "فعال",
        cell.underline
    );


    els.wrap?.classList.toggle(
        "فعال",
        cell.wrap
    );

}


/* =====================================================
   MUTATE
===================================================== */

function mutate(
    callback
) {

    if (
        !isSuper()
    ) {

        showMessage(
            "یوازې Superadmin کولی شي بدلون وکړي.",
            "warning"
        );

        return;

    }


    const previous =
        snapshot();


    callback();


    undoStack.push(
        previous
    );


    if (
        undoStack.length >
        MAX_UNDO
    ) {

        undoStack.shift();

    }


    redoStack =
        [];


    renderAll();


    markChanged();

}


/* =====================================================
   CHANGE TRACKING
===================================================== */

function markChanged() {

    if (
        !isSuper()
    ) {

        return;

    }


    saveGeneration +=
        1;


    pendingSave =
        true;


    pendingSnapshot =
        deep(
            state.شیتونه
        );


    saveLocalBackup();


    clearTimeout(
        saveTimer
    );


    saveTimer =
        setTimeout(
            () => {

                processSaveQueue();

            },
            SAVE_DELAY
        );

}


/* =====================================================
   SAVE QUEUE
===================================================== */

async function processSaveQueue() {

    if (
        pageLeaving ||
        !isSuper()
    ) {

        return;

    }


    if (
        !pendingSave
    ) {

        return;

    }


    if (
        saveBusy
    ) {

        return;

    }


    if (
        pendingSnapshot ===
        null
    ) {

        pendingSnapshot =
            deep(
                state.شیتونه
            );

    }


    const snapshotToSave =
        deep(
            pendingSnapshot
        );


    const generationToSave =
        saveGeneration;


    pendingSave =
        false;


    saveBusy =
        true;


    try {

        await writeSnapshot(
            snapshotToSave,
            generationToSave,
            true
        );


        retryAttempt =
            0;


        saveFailedNoticeShown =
            false;


    } catch (
        error
    ) {

        pendingSnapshot =
            snapshotToSave;


        pendingSave =
            true;


        if (
            isRetryableError(
                error
            )
        ) {

            scheduleRetry(
                false
            );

        } else {

            if (
                !saveFailedNoticeShown
            ) {

                saveFailedNoticeShown =
                    true;


                showMessage(
                    firebaseErrorText(
                        error
                    ),
                    "danger"
                );

            }

        }

    } finally {

        saveBusy =
            false;


        if (
            saveGeneration >
            generationToSave
        ) {

            pendingSnapshot =
                deep(
                    state.شیتونه
                );


            pendingSave =
                true;


            saveLocalBackup();

        }


        if (
            pendingSave &&
            !retryTimer
        ) {

            clearTimeout(
                saveTimer
            );


            saveTimer =
                setTimeout(
                    () => {

                        processSaveQueue();

                    },
                    250
                );

        }

    }

}


/* =====================================================
   RETRY
===================================================== */

function retryDelay() {

    const steps = [

        1500,

        2500,

        4000,

        6000,

        9000,

        12000,

        16000,

        MAX_RETRY_DELAY

    ];


    return steps[
        Math.min(
            retryAttempt,
            steps.length -
                1
        )
    ];

}


function scheduleRetry(
    showNotice = false
) {

    if (
        pageLeaving
    ) {

        return;

    }


    if (
        retryTimer
    ) {

        return;

    }


    if (
        navigator.onLine ===
        false
    ) {

        return;

    }


    const delay =
        retryDelay();


    retryAttempt +=
        1;


    if (
        showNotice
    ) {

        showMessage(
            "⚠️ اړیکه لنډمهاله کمزورې ده؛ معلومات ساتل شوي او Save به بیا هڅه وکړي.",
            "warning"
        );

    } else if (
        els.statusText &&
        isSuper()
    ) {

        els.statusText.textContent =
            "بدلونونه محلي خوندي دي؛ Firebase ته د همغږۍ بیا هڅه روانه ده.";

    }


    retryTimer =
        setTimeout(
            async () => {

                retryTimer =
                    null;


                if (
                    pendingSave
                ) {

                    await processSaveQueue();

                }

            },
            delay
        );

}


/* =====================================================
   ONLINE / OFFLINE
===================================================== */

window.addEventListener(
    "online",
    () => {

        if (
            !isSuper()
        ) {

            return;

        }


        retryAttempt =
            0;


        if (
            els.statusText
        ) {

            els.statusText.textContent =
                "انټرنېټ بېرته وصل شو؛ د Formic پاتې بدلونونه همغږي کېږي.";

        }


        clearTimeout(
            saveTimer
        );


        saveTimer =
            setTimeout(
                () => {

                    processSaveQueue();

                },
                300
            );

    }
);


window.addEventListener(
    "offline",
    () => {

        if (
            !isSuper()
        ) {

            return;

        }


        if (
            els.statusText
        ) {

            els.statusText.textContent =
                "انټرنېټ لنډمهاله نشته؛ Formic محلي بدلونونه ساتي او وروسته یې Firebase سره همغږي کوي.";

        }

    }
);


/* =====================================================
   LOW LEVEL WRITE
===================================================== */

async function writeSnapshot(
    snapshotData,
    generationToSave,
    auto = true
) {

    if (
        !isSuper()
    ) {

        const error =
            new Error(
                "Superadmin permission required."
            );


        error.code =
            "permission-denied";


        throw error;

    }


    await setDoc(
        formicDoc,
        {

            شیتونه:
                deep(
                    snapshotData
                ),

            تازه_کولو_وخت:
                serverTimestamp(),

            بدلون_ورکوونکی:
                currentUser?.uid ||
                "",

            بدلون_ورکوونکی_برېښنالیک:
                currentUser?.email ||
                ""

        },
        {
            merge:
                true
        }
    );


    savedGeneration =
        generationToSave;


    try {

        localStorage.setItem(
            LOCAL_BACKUP_KEY,
            JSON.stringify({

                شیتونه:
                    deep(
                        snapshotData
                    ),

                updatedAt:
                    Date.now(),

                synced:
                    true

            })
        );

    } catch (
        error
    ) {

        console.warn(
            "FORMIC BACKUP UPDATE:",
            error
        );

    }


    if (
        els.statusText &&
        auto &&
        isSuper()
    ) {

        els.statusText.textContent =
            "ټول بدلونونه په بریالیتوب Firebase سره همغږي شول.";

    }


    if (
        !auto
    ) {

        showMessage(
            "✅ فورمیک په بریالیتوب Firebase ته تلپاتې خوندي شو.",
            "success"
        );

    }

}


/* =====================================================
   MANUAL SAVE
===================================================== */

async function manualSave() {

    if (
        !isSuper()
    ) {

        showMessage(
            "یوازې Superadmin معلومات خوندي کولی شي.",
            "warning"
        );

        return;

    }


    clearTimeout(
        saveTimer
    );


    if (
        retryTimer
    ) {

        clearTimeout(
            retryTimer
        );


        retryTimer =
            null;

    }


    if (
        saveBusy
    ) {

        pendingSnapshot =
            deep(
                state.شیتونه
            );


        pendingSave =
            true;


        showMessage(
            "⏳ پخوانی Save روان دی؛ نوی بدلون هم د Save په کتار کې شامل شو.",
            "warning"
        );


        return;

    }


    saveBusy =
        true;


    const snapshotToSave =
        deep(
            state.شیتونه
        );


    const generationToSave =
        saveGeneration;


    pendingSave =
        false;


    saveLocalBackup();


    if (
        els.save
    ) {

        els.save.disabled =
            true;


        els.save.textContent =
            "⏳ خوندي کېږي...";

    }


    if (
        els.permanentSave
    ) {

        els.permanentSave.disabled =
            true;


        els.permanentSave.textContent =
            "⏳ خوندي کېږي...";


        els.permanentSave.classList.add(
            "خوندي-کېږي"
        );

    }


    try {

        await writeSnapshot(
            snapshotToSave,
            generationToSave,
            false
        );


        retryAttempt =
            0;


        saveFailedNoticeShown =
            false;


    } catch (
        error
    ) {

        pendingSnapshot =
            snapshotToSave;


        pendingSave =
            true;


        if (
            isRetryableError(
                error
            )
        ) {

            scheduleRetry(
                true
            );

        } else {

            showMessage(
                firebaseErrorText(
                    error
                ),
                "danger"
            );

        }

    } finally {

        saveBusy =
            false;


        if (
            els.save
        ) {

            els.save.disabled =
                !isSuper();


            els.save.textContent =
                "💾 خوندي کول";

        }


        if (
            els.permanentSave
        ) {

            els.permanentSave.disabled =
                !isSuper();


            els.permanentSave.textContent =
                "💾 تلپاتې خوندي کول";


            els.permanentSave.classList.remove(
                "خوندي-کېږي"
            );

        }


        if (
            saveGeneration >
            generationToSave
        ) {

            pendingSnapshot =
                deep(
                    state.شیتونه
                );


            pendingSave =
                true;


            saveLocalBackup();

        }


        if (
            pendingSave &&
            !retryTimer
        ) {

            clearTimeout(
                saveTimer
            );


            saveTimer =
                setTimeout(
                    () => {

                        processSaveQueue();

                    },
                    250
                );

        }

    }

}


/* =====================================================
   LOAD FORMIC
===================================================== */

async function loadFormic() {

    let remoteLoaded =
        false;


    try {

        const result =
            await getDoc(
                formicDoc
            );


        if (
            result.exists()
        ) {

            state =
                normalizeState(
                    result.data()
                );


            remoteLoaded =
                true;

        } else {

            state =
                normalizeState(
                    {}
                );

        }

    } catch (
        error
    ) {

        console.error(
            "FORMIC LOAD ERROR:",
            error
        );


        const local =
            loadLocalBackup();


        if (
            local?.شیتونه?.length
        ) {

            state =
                normalizeState(
                    local
                );

        } else {

            state =
                normalizeState(
                    {}
                );

        }


        if (
            !isRetryableError(
                error
            )
        ) {

            showMessage(
                firebaseErrorText(
                    error
                ),
                "danger"
            );

        }

    }


    if (
        !remoteLoaded &&
        isSuper()
    ) {

        pendingSnapshot =
            deep(
                state.شیتونه
            );


        pendingSave =
            true;


        saveLocalBackup();


        if (
            navigator.onLine
        ) {

            scheduleRetry(
                false
            );

        }

    }


    if (
        remoteLoaded &&
        isSuper()
    ) {

        saveLocalBackup();

    }


    currentSheetId =
        state.شیتونه[0]
            ?.پېژند ||
        "";


    selected =
        [];


    renderAll();

}


/* =====================================================
   RENDER SHEETS
===================================================== */

function renderSheets() {

    if (
        !els.sheets
    ) {

        return;

    }


    els.sheets.innerHTML =
        "";


    state.شیتونه.forEach(
        sh => {

            const button =
                document.createElement(
                    "button"
                );


            button.type =
                "button";


            button.className =
                "فورمیک-شیت";


            if (
                sh.پېژند ===
                currentSheetId
            ) {

                button.classList.add(
                    "فعال"
                );

            }


            button.textContent =
                sh.نوم;


            safeEvent(
                button,
                "click",
                () => {

                    currentSheetId =
                        sh.پېژند;


                    selected =
                        [];


                    renderAll();

                }
            );


            safeEvent(
                button,
                "dblclick",
                () => {

                    if (
                        !isSuper()
                    ) {

                        return;

                    }


                    const name =
                        window.prompt(
                            "د شیت نوی نوم:",
                            sh.نوم
                        );


                    if (
                        name ===
                        null
                    ) {

                        return;

                    }


                    const newName =
                        clean(
                            name
                        );


                    if (
                        !newName
                    ) {

                        return;

                    }


                    mutate(
                        () => {

                            sh.نوم =
                                newName;

                        }
                    );

                }
            );


            els.sheets.appendChild(
                button
            );

        }
    );

}


/* =====================================================
   CELL STYLE
===================================================== */

function renderCellStyle(
    wrapper,
    textarea,
    cell
) {

    wrapper.style.backgroundColor =
        cell.fillColor;


    wrapper.style.justifyContent =
        cell.vAlign ===
            "top"

            ? "flex-start"

            : cell.vAlign ===
                "bottom"

                ? "flex-end"

                : "center";


    textarea.style.fontFamily =
        cell.fontFamily;


    textarea.style.fontSize =
        `${cell.fontSize}px`;


    textarea.style.color =
        cell.fontColor;


    textarea.style.fontWeight =
        cell.bold
            ? "900"
            : "400";


    textarea.style.fontStyle =
        cell.italic
            ? "italic"
            : "normal";


    textarea.style.textDecoration =
        cell.underline
            ? "underline"
            : "none";


    textarea.style.textAlign =
        cell.hAlign;


    textarea.style.whiteSpace =
        cell.wrap
            ? "pre-wrap"
            : "nowrap";


    textarea.style.overflow =
        cell.wrap
            ? "auto"
            : "hidden";


    textarea.style.border =
        "0";


    wrapper.style.border =
        cell.border;

}


/* =====================================================
   TABLE
===================================================== */

function renderTable() {

    const sh =
        getSheet();


    if (
        !sh ||
        !els.table
    ) {

        return;

    }


    sh.rowHeights =
        Array.from(
            {
                length:
                    sh.کرښې
            },
            (
                _,
                index
            ) =>
                Math.max(
                    35,
                    Number(
                        sh.rowHeights?.[index]
                    ) || 55
                )
        );


    if (
        !Array.isArray(
            sh.merges
        )
    ) {

        sh.merges =
            [];

    }


    if (
        !sh.حجرې ||
        typeof sh.حجرې !==
        "object"
    ) {

        sh.حجرې =
            {};

    }


    els.table.innerHTML =
        "";


    const totalWidth =
        70 +
        sh.ستنې.reduce(
            (
                total,
                column
            ) =>
                total +
                Number(
                    column.پلنوالی
                ),
            0
        );


    els.table.style.width =
        `${totalWidth}px`;


    const colgroup =
        document.createElement(
            "colgroup"
        );


    const rowCol =
        document.createElement(
            "col"
        );


    rowCol.style.width =
        "70px";


    colgroup.appendChild(
        rowCol
    );


    sh.ستنې.forEach(
        column => {

            const col =
                document.createElement(
                    "col"
                );


            col.style.width =
                `${column.پلنوالی}px`;


            colgroup.appendChild(
                col
            );

        }
    );


    els.table.appendChild(
        colgroup
    );


    const thead =
        document.createElement(
            "thead"
        );


    const headerRow =
        document.createElement(
            "tr"
        );


    const numberHeader =
        document.createElement(
            "th"
        );


    numberHeader.className =
        "فورمیک-شمېره";


    numberHeader.textContent =
        "#";


    headerRow.appendChild(
        numberHeader
    );


    sh.ستنې.forEach(
        (
            column,
            columnIndex
        ) => {

            const th =
                document.createElement(
                    "th"
                );


            th.style.width =
                `${column.پلنوالی}px`;


            th.style.minWidth =
                `${column.پلنوالی}px`;


            const box =
                document.createElement(
                    "div"
                );


            box.className =
                "فورمیک-سر-خانه";


            const top =
                document.createElement(
                    "div"
                );


            top.className =
                "فورمیک-سر-تڼۍ";


            const nameInput =
                document.createElement(
                    "input"
                );


            nameInput.type =
                "text";


            nameInput.className =
                "فورمیک-ستون-نوم";


            nameInput.value =
                column.نوم;


            nameInput.disabled =
                !isSuper();


            safeEvent(
                nameInput,
                "change",
                () => {

                    if (
                        !isSuper()
                    ) {

                        return;

                    }


                    const value =
                        clean(
                            nameInput.value
                        );


                    if (
                        !value
                    ) {

                        nameInput.value =
                            column.نوم;

                        return;

                    }


                    mutate(
                        () => {

                            column.نوم =
                                value;

                        }
                    );

                }
            );


            const deleteButton =
                document.createElement(
                    "button"
                );


            deleteButton.type =
                "button";


            deleteButton.className =
                "فورمیک-ستون-حذف";


            deleteButton.textContent =
                "×";


            deleteButton.title =
                "ستون حذف کړه";


            deleteButton.disabled =
                !isSuper();


            safeEvent(
                deleteButton,
                "click",
                event => {

                    event.stopPropagation();


                    deleteColumn(
                        columnIndex
                    );

                }
            );


            top.append(
                nameInput,
                deleteButton
            );


            const filterWrap =
                document.createElement(
                    "div"
                );


            filterWrap.className =
                "فورمیک-فلټر-برخه";


            const filterButton =
                document.createElement(
                    "button"
                );


            filterButton.type =
                "button";


            filterButton.className =
                "فورمیک-فلټر-تڼۍ";


            filterButton.textContent =
                "🔽";


            filterButton.title =
                "فلټر خلاص/بند کړه";


            const filter =
                document.createElement(
                    "input"
                );


            filter.type =
                "search";


            filter.className =
                "فورمیک-فلټر";


            filter.placeholder =
                "لټون...";


            filter.hidden =
                true;


            safeEvent(
                filterButton,
                "click",
                () => {

                    filter.hidden =
                        !filter.hidden;


                    filterButton.classList.toggle(
                        "فعال",
                        !filter.hidden
                    );


                    if (
                        !filter.hidden
                    ) {

                        filter.focus();

                    } else {

                        filter.value =
                            "";

                        applyFilter(
                            columnIndex,
                            ""
                        );

                    }

                }
            );


            safeEvent(
                filter,
                "input",
                () =>
                    applyFilter(
                        columnIndex,
                        filter.value
                    )
            );


            filterWrap.append(
                filterButton,
                filter
            );


            box.append(
                top,
                filterWrap
            );


            const leftHandle =
                document.createElement(
                    "span"
                );


            leftHandle.className =
                "فورمیک-ستون-ریز-چپ";


            const rightHandle =
                document.createElement(
                    "span"
                );


            rightHandle.className =
                "فورمیک-ستون-ریز-راست";


            installColumnResize(
                leftHandle,
                columnIndex,
                "left"
            );


            installColumnResize(
                rightHandle,
                columnIndex,
                "right"
            );


            th.append(
                box,
                leftHandle,
                rightHandle
            );


            headerRow.appendChild(
                th
            );

        }
    );


    thead.appendChild(
        headerRow
    );


    els.table.appendChild(
        thead
    );


    const tbody =
        document.createElement(
            "tbody"
        );


    const occupied =
        new Set();


    for (
        let row = 0;
        row < sh.کرښې;
        row++
    ) {

        const tr =
            document.createElement(
                "tr"
            );


        const rowHeight =
            Math.max(
                35,
                Number(
                    sh.rowHeights[row]
                ) || 55
            );


        tr.style.height =
            `${rowHeight}px`;


        const rowHead =
            document.createElement(
                "td"
            );


        rowHead.className =
            "فورمیک-شمېره";


        rowHead.style.height =
            `${rowHeight}px`;


        const rowBox =
            document.createElement(
                "div"
            );


        rowBox.className =
            "فورمیک-کرښې-سر";


        const rowNumber =
            document.createElement(
                "span"
            );


        rowNumber.className =
            "فورمیک-کرښې-شمېره";


        rowNumber.textContent =
            toPashtoDigits(
                row + 1
            );


        const rowDelete =
            document.createElement(
                "button"
            );


        rowDelete.type =
            "button";


        rowDelete.className =
            "فورمیک-کرښې-حذف";


        rowDelete.textContent =
            "×";


        rowDelete.title =
            "کرښه حذف کړه";


        rowDelete.disabled =
            !isSuper();


        safeEvent(
            rowDelete,
            "click",
            event => {

                event.stopPropagation();


                deleteRow(
                    row
                );

            }
        );


        rowBox.append(
            rowNumber,
            rowDelete
        );


        const topResize =
            document.createElement(
                "span"
            );


        topResize.className =
            "فورمیک-کرښې-ریز-پورته";


        const bottomResize =
            document.createElement(
                "span"
            );


        bottomResize.className =
            "فورمیک-کرښې-ریز-لاندې";


        installRowResize(
            topResize,
            row,
            "top"
        );


        installRowResize(
            bottomResize,
            row,
            "bottom"
        );


        rowHead.append(
            rowBox,
            topResize,
            bottomResize
        );


        tr.appendChild(
            rowHead
        );


        for (
            let col = 0;
            col < sh.ستنې.length;
            col++
        ) {

            if (
                occupied.has(
                    `${row}:${col}`
                )
            ) {

                continue;

            }


            const merge =
                mergeAt(
                    sh,
                    row,
                    col
                );


            const start =
                merge

                    ? {

                        row:
                            merge.startRow,

                        col:
                            merge.startCol

                    }

                    : {

                        row,

                        col

                    };


            const rowSpan =
                merge
                    ? merge.rowSpan
                    : 1;


            const colSpan =
                merge
                    ? merge.colSpan
                    : 1;


            for (
                let r =
                    start.row;

                r <
                    start.row +
                    rowSpan;

                r++
            ) {

                for (
                    let c =
                        start.col;

                    c <
                        start.col +
                        colSpan;

                    c++
                ) {

                    occupied.add(
                        `${r}:${c}`
                    );

                }

            }


            const td =
                document.createElement(
                    "td"
                );


            td.rowSpan =
                rowSpan;


            td.colSpan =
                colSpan;


            const column =
                sh.ستنې[
                    start.col
                ];


            if (
                !column
            ) {

                continue;

            }


            td.style.width =
                `${column.پلنوالی}px`;


            td.style.minWidth =
                `${column.پلنوالی}px`;


            const wrapper =
                document.createElement(
                    "div"
                );


            wrapper.className =
                "فورمیک-خانه-پوښ";


            wrapper.dataset.row =
                String(
                    start.row
                );


            wrapper.dataset.col =
                String(
                    start.col
                );


            const key =
                cellKey(
                    start.row,
                    start.col
                );


            const cell =
                normalizeCell(
                    sh.حجرې[key]
                );


            sh.حجرې[key] =
                cell;


            const textarea =
                document.createElement(
                    "textarea"
                );


            textarea.className =
                "فورمیک-خانه";


            textarea.value =
                cell.متن;


            textarea.disabled =
                !isSuper();


            textarea.spellcheck =
                false;


            safeEvent(
                textarea,
                "pointerdown",
                event =>
                    selectCell(
                        start.row,
                        start.col,
                        event.shiftKey
                    )
            );


            safeEvent(
                textarea,
                "focus",
                () =>
                    selectCell(
                        start.row,
                        start.col,
                        false
                    )
            );


            safeEvent(
                textarea,
                "input",
                () => {

                    if (
                        !isSuper()
                    ) {

                        return;

                    }


                    sh.حجرې[key] =
                        {

                            ...normalizeCell(
                                sh.حجرې[key]
                            ),

                            متن:
                                textarea.value

                        };


                    markChanged();

                }
            );


            renderCellStyle(
                wrapper,
                textarea,
                cell
            );


            wrapper.appendChild(
                textarea
            );


            td.appendChild(
                wrapper
            );


            tr.appendChild(
                td
            );

        }


        tbody.appendChild(
            tr
        );

    }


    els.table.appendChild(
        tbody
    );


    updateSelectionUI();


    syncToolbar();

}


/* =====================================================
   RENDER ALL
===================================================== */

function renderAll() {

    if (
        !Array.isArray(
            state.شیتونه
        ) ||
        !state.شیتونه.length
    ) {

        state =
            normalizeState(
                {}
            );

    }


    if (
        !state.شیتونه.some(
            sheet =>
                sheet.پېژند ===
                currentSheetId
        )
    ) {

        currentSheetId =
            state.شیتونه[0]
                ?.پېژند ||
            "";

    }


    renderSheets();


    renderTable();


    updatePermissions();

}


/* =====================================================
   COLUMN RESIZE
===================================================== */

function installColumnResize(
    handle,
    index,
    side
) {

    safeEvent(
        handle,
        "pointerdown",
        event => {

            if (
                !isSuper()
            ) {

                return;

            }


            const sh =
                getSheet();


            const column =
                sh?.ستنې?.[index];


            if (
                !column
            ) {

                return;

            }


            event.preventDefault();


            event.stopPropagation();


            const previous =
                snapshot();


            const startX =
                event.clientX;


            const startWidth =
                Number(
                    column.پلنوالی
                ) || 170;


            document.body.style.userSelect =
                "none";


            const move =
                moveEvent => {

                    let delta =
                        moveEvent.clientX -
                        startX;


                    if (
                        side ===
                        "left"
                    ) {

                        delta =
                            -delta;

                    }


                    column.پلنوالی =
                        Math.max(
                            90,
                            Math.round(
                                startWidth +
                                delta
                            )
                        );


                    const nth =
                        index +
                        2;


                    els.table
                        ?.querySelectorAll(
                            `th:nth-child(${nth}),
                             td:nth-child(${nth})`
                        )
                        .forEach(
                            cell => {

                                cell.style.width =
                                    `${column.پلنوالی}px`;

                                cell.style.minWidth =
                                    `${column.پلنوالی}px`;

                            }
                        );

                };


            const end =
                () => {

                    document.body.style.userSelect =
                        "";


                    window.removeEventListener(
                        "pointermove",
                        move
                    );


                    window.removeEventListener(
                        "pointerup",
                        end
                    );


                    undoStack.push(
                        previous
                    );


                    if (
                        undoStack.length >
                        MAX_UNDO
                    ) {

                        undoStack.shift();

                    }


                    redoStack =
                        [];


                    markChanged();

                };


            window.addEventListener(
                "pointermove",
                move
            );


            window.addEventListener(
                "pointerup",
                end
            );

        }
    );

}


/* =====================================================
   ROW RESIZE
===================================================== */

function installRowResize(
    handle,
    row,
    side
) {

    safeEvent(
        handle,
        "pointerdown",
        event => {

            if (
                !isSuper()
            ) {

                return;

            }


            const sh =
                getSheet();


            if (
                !sh
            ) {

                return;

            }


            event.preventDefault();


            event.stopPropagation();


            const previous =
                snapshot();


            const startY =
                event.clientY;


            const startHeight =
                Number(
                    sh.rowHeights[row]
                ) || 55;


            document.body.style.userSelect =
                "none";


            const move =
                moveEvent => {

                    let delta =
                        moveEvent.clientY -
                        startY;


                    if (
                        side ===
                        "top"
                    ) {

                        delta =
                            -delta;

                    }


                    sh.rowHeights[row] =
                        Math.max(
                            35,
                            Math.round(
                                startHeight +
                                delta
                            )
                        );


                    const tr =
                        els.table?.querySelector(
                            `tbody tr:nth-child(${row + 1})`
                        );


                    if (
                        tr
                    ) {

                        tr.style.height =
                            `${sh.rowHeights[row]}px`;

                    }

                };


            const end =
                () => {

                    document.body.style.userSelect =
                        "";


                    window.removeEventListener(
                        "pointermove",
                        move
                    );


                    window.removeEventListener(
                        "pointerup",
                        end
                    );


                    undoStack.push(
                        previous
                    );


                    if (
                        undoStack.length >
                        MAX_UNDO
                    ) {

                        undoStack.shift();

                    }


                    redoStack =
                        [];


                    markChanged();

                };


            window.addEventListener(
                "pointermove",
                move
            );


            window.addEventListener(
                "pointerup",
                end
            );

        }
    );

}


/* =====================================================
   ADD SHEET
===================================================== */

function addSheet() {

    if (
        !isSuper()
    ) {

        return;

    }


    const number =
        state.شیتونه.length +
        1;


    const name =
        window.prompt(
            "د نوي شیت نوم:",
            `شیت ${number}`
        );


    if (
        name ===
        null
    ) {

        return;

    }


    const cleanName =
        clean(
            name
        );


    if (
        !cleanName
    ) {

        showMessage(
            "د شیت نوم خالي نه شي کېدای.",
            "warning"
        );

        return;

    }


    mutate(
        () => {

            const time =
                Date.now();


            const id =
                `شیت_${time}`;


            state.شیتونه.push({

                پېژند:
                    id,

                نوم:
                    cleanName,

                ستنې: [

                    {

                        پېژند:
                            `ستون_${time}_1`,

                        نوم:
                            "لومړۍ ستنه",

                        پلنوالی:
                            170

                    },

                    {

                        پېژند:
                            `ستون_${time}_2`,

                        نوم:
                            "دوهمه ستنه",

                        پلنوالی:
                            170

                    },

                    {

                        پېژند:
                            `ستون_${time}_3`,

                        نوم:
                            "معلومات",

                        پلنوالی:
                            220

                    }

                ],

                کرښې:
                    8,

                rowHeights:
                    Array(
                        8
                    ).fill(
                        55
                    ),

                حجرې:
                    {},

                merges:
                    []

            });


            currentSheetId =
                id;


            selected =
                [];

        }
    );


    showMessage(
        `«${cleanName}» شیت جوړ شو.`,
        "success"
    );

}


/* =====================================================
   ADD COLUMN
===================================================== */

function addColumn() {

    if (
        !isSuper()
    ) {

        return;

    }


    const sh =
        getSheet();


    if (
        !sh
    ) {

        return;

    }


    const name =
        window.prompt(
            "د نوي ستون نوم:",
            `ستون ${
                sh.ستنې.length +
                1
            }`
        );


    if (
        name ===
        null
    ) {

        return;

    }


    const cleanName =
        clean(
            name
        );


    if (
        !cleanName
    ) {

        showMessage(
            "د ستون نوم خالي نه شي کېدای.",
            "warning"
        );

        return;

    }


    mutate(
        () => {

            sh.ستنې.push({

                پېژند:
                    `ستون_${Date.now()}_${Math.random().toString(36).slice(2,8)}`,

                نوم:
                    cleanName,

                پلنوالی:
                    170

            });

        }
    );


    showMessage(
        `«${cleanName}» ستون اضافه شو.`,
        "success"
    );

}


/* =====================================================
   ADD ROW
===================================================== */

function addRow() {

    if (
        !isSuper()
    ) {

        return;

    }


    const sh =
        getSheet();


    if (
        !sh
    ) {

        return;

    }


    mutate(
        () => {

            sh.کرښې +=
                1;


            sh.rowHeights.push(
                55
            );

        }
    );


    showMessage(
        "نوې کرښه اضافه شوه.",
        "success"
    );

}


/* =====================================================
   DELETE SHEET
===================================================== */

function deleteSheet() {

    if (
        !isSuper()
    ) {

        return;

    }


    if (
        state.شیتونه.length <=
        1
    ) {

        showMessage(
            "لږ تر لږه یو شیت باید پاتې وي.",
            "warning"
        );

        return;

    }


    const sh =
        getSheet();


    if (
        !sh
    ) {

        return;

    }


    if (
        !window.confirm(
            `ایا غواړئ «${sh.نوم}» حذف کړئ؟`
        )
    ) {

        return;

    }


    mutate(
        () => {

            state.شیتونه =
                state.شیتونه.filter(
                    item =>
                        item.پېژند !==
                        sh.پېژند
                );


            currentSheetId =
                state.شیتونه[0]
                    ?.پېژند ||
                "";


            selected =
                [];

        }
    );


    showMessage(
        "شیت حذف شو.",
        "success"
    );

}


/* =====================================================
   DELETE ROW
===================================================== */

function deleteRow(
    row
) {

    if (
        !isSuper()
    ) {

        return;

    }


    const sh =
        getSheet();


    if (
        !sh
    ) {

        return;

    }


    if (
        sh.کرښې <=
        1
    ) {

        showMessage(
            "لږ تر لږه یوه کرښه باید پاتې وي.",
            "warning"
        );

        return;

    }


    if (
        !window.confirm(
            `ایا غواړئ کرښه ${
                row + 1
            } حذف کړئ؟`
        )
    ) {

        return;

    }


    mutate(
        () => {

            const newCells =
                {};


            Object.entries(
                sh.حجرې
            ).forEach(
                (
                    [
                        key,
                        value
                    ]
                ) => {

                    const [
                        rowText,
                        columnId
                    ] =
                        key.split(":");


                    const oldRow =
                        Number(
                            rowText
                        );


                    if (
                        oldRow ===
                        row
                    ) {

                        return;

                    }


                    const newRow =
                        oldRow >
                            row

                            ? oldRow -
                                1

                            : oldRow;


                    newCells[
                        cellKeyByColumnId(
                            newRow,
                            columnId
                        )
                    ] =
                        value;

                }
            );


            sh.حجرې =
                newCells;


            sh.rowHeights.splice(
                row,
                1
            );


            sh.کرښې -=
                1;


            sh.merges =
                [];


            selected =
                [];

        }
    );


    showMessage(
        "کرښه حذف شوه.",
        "success"
    );

}


/* =====================================================
   DELETE COLUMN
===================================================== */

function deleteColumn(
    index
) {

    if (
        !isSuper()
    ) {

        return;

    }


    const sh =
        getSheet();


    if (
        !sh
    ) {

        return;

    }


    if (
        sh.ستنې.length <=
        1
    ) {

        showMessage(
            "لږ تر لږه یوه ستنه باید پاتې وي.",
            "warning"
        );

        return;

    }


    const column =
        sh.ستنې[index];


    if (
        !column
    ) {

        return;

    }


    if (
        !window.confirm(
            `ایا غواړئ «${column.نوم}» حذف کړئ؟`
        )
    ) {

        return;

    }


    mutate(
        () => {

            const deletedId =
                column.پېژند;


            sh.ستنې.splice(
                index,
                1
            );


            const newCells =
                {};


            Object.entries(
                sh.حجرې
            ).forEach(
                (
                    [
                        key,
                        value
                    ]
                ) => {

                    const [
                        row,
                        columnId
                    ] =
                        key.split(":");


                    if (
                        columnId ===
                        deletedId
                    ) {

                        return;

                    }


                    newCells[
                        `${row}:${columnId}`
                    ] =
                        value;

                }
            );


            sh.حجرې =
                newCells;


            sh.merges =
                [];


            selected =
                [];

        }
    );


    showMessage(
        "ستون حذف شو.",
        "success"
    );

}


/* =====================================================
   INSERT ROW
===================================================== */

function insertRow(
    position
) {

    if (
        !isSuper() ||
        !selected.length
    ) {

        showMessage(
            "لومړی یوه خانه وټاکئ.",
            "warning"
        );

        return;

    }


    const sh =
        getSheet();


    if (
        !sh
    ) {

        return;

    }


    const reference =
        selected[0];


    const at =
        position ===
            "above"

            ? reference.row

            : reference.row +
                1;


    mutate(
        () => {

            const newCells =
                {};


            Object.entries(
                sh.حجرې
            ).forEach(
                (
                    [
                        key,
                        value
                    ]
                ) => {

                    const [
                        rowText,
                        columnId
                    ] =
                        key.split(":");


                    const row =
                        Number(
                            rowText
                        );


                    const newRow =
                        row >=
                            at

                            ? row +
                                1

                            : row;


                    newCells[
                        `${newRow}:${columnId}`
                    ] =
                        value;

                }
            );


            sh.حجرې =
                newCells;


            sh.rowHeights.splice(
                at,
                0,
                55
            );


            sh.کرښې +=
                1;


            sh.merges =
                [];


            selected = [

                {

                    row:
                        at,

                    col:
                        reference.col

                }

            ];

        }
    );


    showMessage(
        position ===
            "above"

            ? "پورته نوې کرښه اضافه شوه."

            : "لاندې نوې کرښه اضافه شوه.",

        "success"
    );

}


/* =====================================================
   INSERT COLUMN
===================================================== */

function insertColumn(
    position
) {

    if (
        !isSuper() ||
        !selected.length
    ) {

        showMessage(
            "لومړی یوه خانه وټاکئ.",
            "warning"
        );

        return;

    }


    const sh =
        getSheet();


    if (
        !sh
    ) {

        return;

    }


    const reference =
        selected[0];


    const at =
        position ===
            "left"

            ? reference.col

            : reference.col +
                1;


    mutate(
        () => {

            sh.ستنې.splice(
                at,
                0,
                {

                    پېژند:
                        `ستون_${Date.now()}_${Math.random().toString(36).slice(2,8)}`,

                    نوم:
                        "نوې ستنه",

                    پلنوالی:
                        170

                }
            );


            sh.merges =
                [];


            selected = [

                {

                    row:
                        reference.row,

                    col:
                        at

                }

            ];

        }
    );


    showMessage(
        position ===
            "left"

            ? "چپ نوی ستون اضافه شو."

            : "راست نوی ستون اضافه شو.",

        "success"
    );

}


/* =====================================================
   MERGE
===================================================== */

function mergeSelected() {

    if (
        !isSuper()
    ) {

        return;

    }


    const rect =
        selectedRect();


    if (
        !rect ||
        selected.length <
            2
    ) {

        showMessage(
            "لږ تر لږه دوه خانې وټاکئ.",
            "warning"
        );

        return;

    }


    if (
        selected.length !==
        rect.rows *
        rect.cols
    ) {

        showMessage(
            "د Merge انتخاب باید مستطیل وي.",
            "warning"
        );

        return;

    }


    const sh =
        getSheet();


    if (
        !sh
    ) {

        return;

    }


    const newMerge = {

        startRow:
            rect.startRow,

        startCol:
            rect.startCol,

        rowSpan:
            rect.rows,

        colSpan:
            rect.cols

    };


    const conflict =
        sh.merges.some(
            current =>

                !(
                    current.startRow +
                        current.rowSpan
                        <=
                        newMerge.startRow

                    ||

                    newMerge.startRow +
                        newMerge.rowSpan
                        <=
                        current.startRow

                    ||

                    current.startCol +
                        current.colSpan
                        <=
                        newMerge.startCol

                    ||

                    newMerge.startCol +
                        newMerge.colSpan
                        <=
                        current.startCol
                )
        );


    if (
        conflict
    ) {

        showMessage(
            "له موجود Merge سره تداخل لري.",
            "warning"
        );

        return;

    }


    mutate(
        () => {

            sh.merges.push(
                newMerge
            );


            selected = [

                {

                    row:
                        newMerge.startRow,

                    col:
                        newMerge.startCol

                }

            ];

        }
    );


    showMessage(
        "خانې یوځای شوې.",
        "success"
    );

}


/* =====================================================
   UNMERGE
===================================================== */

function unmergeSelected() {

    if (
        !isSuper() ||
        !selected.length
    ) {

        showMessage(
            "لومړی Merge شوې خانه وټاکئ.",
            "warning"
        );

        return;

    }


    const sh =
        getSheet();


    if (
        !sh
    ) {

        return;

    }


    const first =
        selected[0];


    const merge =
        mergeAt(
            sh,
            first.row,
            first.col
        );


    if (
        !merge
    ) {

        showMessage(
            "ټاکل شوې خانه Merge شوې نه ده.",
            "warning"
        );

        return;

    }


    mutate(
        () => {

            sh.merges =
                sh.merges.filter(
                    item =>

                        !(
                            item.startRow ===
                                merge.startRow

                            &&

                            item.startCol ===
                                merge.startCol
                        )
                );

        }
    );


    showMessage(
        "Merge لرې شو.",
        "success"
    );

}


/* =====================================================
   COPY / CUT
===================================================== */

function copySelection(
    cut = false
) {

    if (
        !selected.length
    ) {

        showMessage(
            "لومړی خانې وټاکئ.",
            "warning"
        );

        return;

    }


    if (
        cut &&
        !isSuper()
    ) {

        showMessage(
            "یوازې Superadmin Cut کولی شي.",
            "warning"
        );

        return;

    }


    const sh =
        getSheet();


    if (
        !sh
    ) {

        return;

    }


    const rect =
        selectedRect();


    const data =
        [];


    for (
        let row =
            rect.startRow;
        row <=
        rect.endRow;
        row++
    ) {

        const rowData =
            [];


        for (
            let col =
                rect.startCol;
            col <=
            rect.endCol;
            col++
        ) {

            const start =
                mergeStart(
                    sh,
                    row,
                    col
                );


            rowData.push(
                deep(
                    normalizeCell(
                        sh.حجرې[
                            cellKey(
                                start.row,
                                start.col
                            )
                        ]
                    )
                )
            );

        }


        data.push(
            rowData
        );

    }


    clipboard = {

        data,

        cut

    };


    if (
        cut
    ) {

        mutate(
            () => {

                for (
                    let row =
                        rect.startRow;

                    row <=
                        rect.endRow;

                    row++
                ) {

                    for (
                        let col =
                            rect.startCol;

                        col <=
                            rect.endCol;

                        col++
                    ) {

                        const start =
                            mergeStart(
                                sh,
                                row,
                                col
                            );


                        const key =
                            cellKey(
                                start.row,
                                start.col
                            );


                        sh.حجرې[key] =
                            {

                                ...normalizeCell(
                                    sh.حجرې[key]
                                ),

                                متن:
                                    ""

                            };

                    }

                }

            }
        );

    }


    showMessage(
        cut
            ? "خانې Cut شوې."
            : "خانې Copy شوې.",
        "success"
    );

}


/* =====================================================
   PASTE
===================================================== */

function pasteSelection() {

    if (
        !clipboard?.data?.length
    ) {

        showMessage(
            "د Paste لپاره لومړی Copy یا Cut وکړئ.",
            "warning"
        );

        return;

    }


    if (
        !isSuper()
    ) {

        showMessage(
            "یوازې Superadmin Paste کولی شي.",
            "warning"
        );

        return;

    }


    if (
        !selected.length
    ) {

        showMessage(
            "لومړی د Paste ځای وټاکئ.",
            "warning"
        );

        return;

    }


    const sh =
        getSheet();


    if (
        !sh
    ) {

        return;

    }


    const start =
        selected[0];


    mutate(
        () => {

            clipboard.data.forEach(
                (
                    rowData,
                    rowOffset
                ) => {

                    rowData.forEach(
                        (
                            cell,
                            colOffset
                        ) => {

                            const row =
                                start.row +
                                rowOffset;


                            const col =
                                start.col +
                                colOffset;


                            if (
                                row < 0 ||
                                col < 0 ||
                                row >=
                                    sh.کرښې ||
                                col >=
                                    sh.ستنې.length
                            ) {

                                return;

                            }


                            sh.حجرې[
                                cellKey(
                                    row,
                                    col
                                )
                            ] =
                                deep(
                                    cell
                                );

                        }
                    );

                }
            );

        }
    );


    showMessage(
        "معلومات Paste شول.",
        "success"
    );

}


/* =====================================================
   FORMAT
===================================================== */

function applyStyle(
    changes
) {

    if (
        !isSuper()
    ) {

        showMessage(
            "یوازې Superadmin کولی شي بڼه بدله کړي.",
            "warning"
        );

        return;

    }


    if (
        !selected.length
    ) {

        showMessage(
            "لومړی یوه یا څو خانې وټاکئ.",
            "warning"
        );

        return;

    }


    const sh =
        getSheet();


    if (
        !sh
    ) {

        return;

    }


    mutate(
        () => {

            selected.forEach(
                position => {

                    const start =
                        mergeStart(
                            sh,
                            position.row,
                            position.col
                        );


                    const key =
                        cellKey(
                            start.row,
                            start.col
                        );


                    sh.حجرې[key] =
                        {

                            ...normalizeCell(
                                sh.حجرې[key]
                            ),

                            ...changes

                        };

                }
            );

        }
    );

}


function toggleStyle(
    property
) {

    if (
        !selected.length
    ) {

        showMessage(
            "لومړی یوه خانه وټاکئ.",
            "warning"
        );

        return;

    }


    const sh =
        getSheet();


    if (
        !sh
    ) {

        return;

    }


    const first =
        mergeStart(
            sh,
            selected[0].row,
            selected[0].col
        );


    const cell =
        normalizeCell(
            sh.حجرې[
                cellKey(
                    first.row,
                    first.col
                )
            ]
        );


    applyStyle(
        {

            [property]:
                !cell[property]

        }
    );

}


/* =====================================================
   CLEAR CONTENT
===================================================== */

function clearContents() {

    if (
        !isSuper() ||
        !selected.length
    ) {

        return;

    }


    const sh =
        getSheet();


    if (
        !sh
    ) {

        return;

    }


    mutate(
        () => {

            selected.forEach(
                position => {

                    const start =
                        mergeStart(
                            sh,
                            position.row,
                            position.col
                        );


                    const key =
                        cellKey(
                            start.row,
                            start.col
                        );


                    sh.حجرې[key] =
                        {

                            ...normalizeCell(
                                sh.حجرې[key]
                            ),

                            متن:
                                ""

                        };

                }
            );

        }
    );


    showMessage(
        "د خانونو متن پاک شو.",
        "success"
    );

}


/* =====================================================
   CLEAR FORMAT
===================================================== */

function clearFormat() {

    if (
        !isSuper() ||
        !selected.length
    ) {

        return;

    }


    const sh =
        getSheet();


    if (
        !sh
    ) {

        return;

    }


    mutate(
        () => {

            selected.forEach(
                position => {

                    const start =
                        mergeStart(
                            sh,
                            position.row,
                            position.col
                        );


                    const key =
                        cellKey(
                            start.row,
                            start.col
                        );


                    const text =
                        sh.حجرې[key]
                            ?.متن ??
                        "";


                    sh.حجرې[key] =
                        {

                            ...defaultCell(),

                            متن:
                                text

                        };

                }
            );

        }
    );


    showMessage(
        "د خانونو بڼه پاکه شوه.",
        "success"
    );

}


/* =====================================================
   NUMBER FORMAT
===================================================== */

function applyNumberFormat(
    format
) {

    applyStyle(
        {
            numberFormat:
                format
        }
    );

}


/* =====================================================
   AUTO SUM
===================================================== */

function autoSum() {

    if (
        !isSuper()
    ) {

        return;

    }


    if (
        selected.length <
        2
    ) {

        showMessage(
            "د ټولولو لپاره لږ تر لږه دوه عددي خانې وټاکئ.",
            "warning"
        );

        return;

    }


    const sh =
        getSheet();


    if (
        !sh
    ) {

        return;

    }


    let total =
        0;


    selected.forEach(
        position => {

            const start =
                mergeStart(
                    sh,
                    position.row,
                    position.col
                );


            const value =
                String(
                    sh.حجرې[
                        cellKey(
                            start.row,
                            start.col
                        )
                    ]?.متن ??
                    ""
                )
                .replaceAll(
                    ",",
                    ""
                );


            const number =
                Number(
                    value
                );


            if (
                Number.isFinite(
                    number
                )
            ) {

                total +=
                    number;

            }

        }
    );


    const first =
        selected[0];


    mutate(
        () => {

            const key =
                cellKey(
                    first.row,
                    first.col
                );


            sh.حجرې[key] =
                {

                    ...normalizeCell(
                        sh.حجرې[key]
                    ),

                    متن:
                        String(
                            total
                        ),

                    numberFormat:
                        "number"

                };

        }
    );


    showMessage(
        `ټولټال: ${total}`,
        "success"
    );

}


/* =====================================================
   FILTER
===================================================== */

function applyFilter(
    columnIndex,
    value
) {

    const body =
        els.table?.querySelector(
            "tbody"
        );


    if (
        !body
    ) {

        return;

    }


    const query =
        clean(
            value
        )
        .toLowerCase();


    Array.from(
        body.rows
    ).forEach(
        row => {

            let text =
                "";


            row.querySelectorAll(
                ".فورمیک-خانه-پوښ"
            )
            .forEach(
                wrapper => {

                    if (
                        Number(
                            wrapper.dataset.col
                        ) ===
                        columnIndex
                    ) {

                        text +=
                            wrapper
                                .querySelector(
                                    "textarea"
                                )
                                ?.value ||
                            "";

                    }

                }
            );


            row.style.display =
                !query ||
                text
                    .toLowerCase()
                    .includes(
                        query
                    )
                    ? ""
                    : "none";

        }
    );

}


/* =====================================================
   SEARCH
===================================================== */

function findText() {

    const query =
        window.prompt(
            "په فورمیک کې څه لټوئ؟",
            ""
        );


    if (
        query ===
        null
    ) {

        return;

    }


    const needle =
        clean(
            query
        )
        .toLowerCase();


    if (
        !needle
    ) {

        return;

    }


    const sh =
        getSheet();


    if (
        !sh
    ) {

        return;

    }


    let found =
        null;


    searchLoop:

    for (
        let row = 0;
        row < sh.کرښې;
        row++
    ) {

        for (
            let col = 0;
            col < sh.ستنې.length;
            col++
        ) {

            const start =
                mergeStart(
                    sh,
                    row,
                    col
                );


            const text =
                String(
                    sh.حجرې[
                        cellKey(
                            start.row,
                            start.col
                        )
                    ]?.متن ??
                    ""
                )
                .toLowerCase();


            if (
                text.includes(
                    needle
                )
            ) {

                found = {

                    row:
                        start.row,

                    col:
                        start.col

                };


                break searchLoop;

            }

        }

    }


    if (
        !found
    ) {

        showMessage(
            "غوښتل شوي معلومات پیدا نه شول.",
            "warning"
        );

        return;

    }


    selected =
        [
            found
        ];


    updateSelectionUI();


    syncToolbar();


    const target =
        els.table?.querySelector(
            `.فورمیک-خانه-پوښ[data-row="${found.row}"][data-col="${found.col}"] textarea`
        );


    target?.focus();


    showMessage(
        "غوښتل شوي معلومات پیدا شول.",
        "success"
    );

}


/* =====================================================
   FORMAT PAINTER
===================================================== */

function formatPainter() {

    if (
        !isSuper()
    ) {

        return;

    }


    if (
        selected.length !==
        1
    ) {

        showMessage(
            "Format Painter لپاره یوه خانه وټاکئ.",
            "warning"
        );

        return;

    }


    const target =
        window.prompt(
            "د هدف خانه داسې ولیکئ: 2,3",
            ""
        );


    if (
        target ===
        null
    ) {

        return;

    }


    const parts =
        target
            .split(",")
            .map(
                value =>
                    Number(
                        value.trim()
                    )
            );


    if (
        parts.length !==
            2 ||

        !Number.isInteger(
            parts[0]
        ) ||

        !Number.isInteger(
            parts[1]
        )
    ) {

        showMessage(
            "د هدف خانه بڼه غلطه ده.",
            "danger"
        );

        return;

    }


    const targetRow =
        parts[0] -
        1;


    const targetCol =
        parts[1] -
        1;


    const sh =
        getSheet();


    if (
        !sh
    ) {

        return;

    }


    if (
        targetRow < 0 ||
        targetCol < 0 ||
        targetRow >=
            sh.کرښې ||
        targetCol >=
            sh.ستنې.length
    ) {

        showMessage(
            "د هدف خانه له جدول څخه بهر ده.",
            "danger"
        );

        return;

    }


    const source =
        selected[0];


    const sourceCell =
        normalizeCell(
            sh.حجرې[
                cellKey(
                    source.row,
                    source.col
                )
            ]
        );


    mutate(
        () => {

            const targetKey =
                cellKey(
                    targetRow,
                    targetCol
                );


            const targetCell =
                normalizeCell(
                    sh.حجرې[
                        targetKey
                    ]
                );


            sh.حجرې[targetKey] =
                {

                    ...targetCell,

                    fontFamily:
                        sourceCell.fontFamily,

                    fontSize:
                        sourceCell.fontSize,

                    fontColor:
                        sourceCell.fontColor,

                    fillColor:
                        sourceCell.fillColor,

                    hAlign:
                        sourceCell.hAlign,

                    vAlign:
                        sourceCell.vAlign,

                    bold:
                        sourceCell.bold,

                    italic:
                        sourceCell.italic,

                    underline:
                        sourceCell.underline,

                    wrap:
                        sourceCell.wrap,

                    border:
                        sourceCell.border

                };


            selected = [

                {

                    row:
                        targetRow,

                    col:
                        targetCol

                }

            ];

        }
    );


    showMessage(
        "Formatting انتقال شو.",
        "success"
    );

}


/* =====================================================
   PERMISSIONS
===================================================== */

function updatePermissions() {

    const disabled =
        !isSuper();


    [

        els.newSheet,
        els.newCol,
        els.newRow,
        els.save,
        els.permanentSave,
        els.deleteSheet,
        els.copy,
        els.cut,
        els.paste,
        els.clear,
        els.bold,
        els.italic,
        els.underline,
        els.wrap,
        els.allBorders,
        els.noBorders,
        els.outerBorder,
        els.number,
        els.percent,
        els.thousands,
        els.sum,
        els.painter,
        els.clearFormat,
        els.merge,
        els.unmerge,
        els.rowUp,
        els.rowDown,
        els.colLeft,
        els.colRight,
        els.font,
        els.size,
        els.fontColor,
        els.fillColor,
        els.hAlign,
        els.vAlign

    ].forEach(
        element => {

            if (
                element
            ) {

                element.disabled =
                    disabled;

            }

        }
    );


    if (
        els.status
    ) {

        els.status.textContent =
            isSuper()
                ? "د Superadmin حالت"
                : "د کتنې حالت";

    }


    if (
        els.statusText
    ) {

        if (
            !isSuper()
        ) {

            els.statusText.textContent =
                "یوازې کتنه فعاله ده.";

        } else if (
            navigator.onLine ===
            false
        ) {

            els.statusText.textContent =
                "انټرنېټ لنډمهاله نشته؛ Formic محلي بدلونونه ساتي.";

        } else if (
            pendingSave
        ) {

            els.statusText.textContent =
                "بدلونونه د Firebase سره د همغږۍ لپاره چمتو دي.";

        } else {

            els.statusText.textContent =
                "ټول Formic امکانات فعال دي او بدلونونه Firebase ته تلپاتې خوندي کېږي.";

        }

    }


    if (
        els.count
    ) {

        els.count.textContent =
            `${toPashtoDigits(
                state.شیتونه.length
            )} شیتونه`;

    }

}


/* =====================================================
   TOOLBAR EVENTS
===================================================== */

safeEvent(
    els.font,
    "change",
    () =>
        applyStyle(
            {
                fontFamily:
                    els.font.value
            }
        )
);


safeEvent(
    els.size,
    "change",
    () =>
        applyStyle(
            {
                fontSize:
                    Number(
                        els.size.value
                    ) || 14
            }
        )
);


safeEvent(
    els.fontColor,
    "input",
    () =>
        applyStyle(
            {
                fontColor:
                    els.fontColor.value
            }
        )
);


safeEvent(
    els.fillColor,
    "input",
    () =>
        applyStyle(
            {
                fillColor:
                    els.fillColor.value
            }
        )
);


safeEvent(
    els.hAlign,
    "change",
    () =>
        applyStyle(
            {
                hAlign:
                    els.hAlign.value
            }
        )
);


safeEvent(
    els.vAlign,
    "change",
    () =>
        applyStyle(
            {
                vAlign:
                    els.vAlign.value
            }
        )
);


safeEvent(
    els.bold,
    "click",
    () =>
        toggleStyle(
            "bold"
        )
);


safeEvent(
    els.italic,
    "click",
    () =>
        toggleStyle(
            "italic"
        )
);


safeEvent(
    els.underline,
    "click",
    () =>
        toggleStyle(
            "underline"
        )
);


safeEvent(
    els.wrap,
    "click",
    () =>
        toggleStyle(
            "wrap"
        )
);


safeEvent(
    els.allBorders,
    "click",
    () =>
        applyStyle(
            {
                border:
                    "1px solid var(--border-color)"
            }
        )
);


safeEvent(
    els.noBorders,
    "click",
    () =>
        applyStyle(
            {
                border:
                    "0"
            }
        )
);


safeEvent(
    els.outerBorder,
    "click",
    () =>
        applyStyle(
            {
                border:
                    "2px solid var(--border-color)"
            }
        )
);


safeEvent(
    els.number,
    "click",
    () =>
        applyNumberFormat(
            "number"
        )
);


safeEvent(
    els.percent,
    "click",
    () =>
        applyNumberFormat(
            "percent"
        )
);


safeEvent(
    els.thousands,
    "click",
    () =>
        applyNumberFormat(
            "thousands"
        )
);


safeEvent(
    els.sum,
    "click",
    autoSum
);


safeEvent(
    els.copy,
    "click",
    () =>
        copySelection(
            false
        )
);


safeEvent(
    els.cut,
    "click",
    () =>
        copySelection(
            true
        )
);


safeEvent(
    els.paste,
    "click",
    pasteSelection
);


safeEvent(
    els.clear,
    "click",
    clearContents
);


safeEvent(
    els.clearFormat,
    "click",
    clearFormat
);


safeEvent(
    els.painter,
    "click",
    formatPainter
);


safeEvent(
    els.find,
    "click",
    findText
);


safeEvent(
    els.merge,
    "click",
    mergeSelected
);


safeEvent(
    els.unmerge,
    "click",
    unmergeSelected
);


safeEvent(
    els.rowUp,
    "click",
    () =>
        insertRow(
            "above"
        )
);


safeEvent(
    els.rowDown,
    "click",
    () =>
        insertRow(
            "below"
        )
);


safeEvent(
    els.colLeft,
    "click",
    () =>
        insertColumn(
            "left"
        )
);


safeEvent(
    els.colRight,
    "click",
    () =>
        insertColumn(
            "right"
        )
);


/* =====================================================
   MAIN BUTTONS
===================================================== */

safeEvent(
    els.newSheet,
    "click",
    addSheet
);


safeEvent(
    els.newCol,
    "click",
    addColumn
);


safeEvent(
    els.newRow,
    "click",
    addRow
);


safeEvent(
    els.deleteSheet,
    "click",
    deleteSheet
);


safeEvent(
    els.save,
    "click",
    manualSave
);


safeEvent(
    els.permanentSave,
    "click",
    manualSave
);


/* =====================================================
   HEADER NAVIGATION
===================================================== */

safeEvent(
    $("dashboardBtn"),
    "click",
    () =>
        location.href =
            "./dashboard.html"
);


safeEvent(
    $("refreshBtn"),
    "click",
    () =>
        location.reload()
);


safeEvent(
    $("logoutBtn"),
    "click",
    async () => {

        pageLeaving =
            true;


        try {

            const result =
                await logoutUser();


            if (
                result?.success
            ) {

                location.href =
                    "./index.html";

                return;

            }


            pageLeaving =
                false;


            showMessage(
                result?.message ||
                "له سیستم څخه وتل ناکام شول.",
                "danger"
            );

        } catch (
            error
        ) {

            pageLeaving =
                false;


            console.error(
                "LOGOUT ERROR:",
                error
            );


            showMessage(
                "له سیستم څخه وتل ناکام شول.",
                "danger"
            );

        }

    }
);


/* =====================================================
   SIDEBAR
===================================================== */

const navigation = {

    dashboardMenuBtn:
        "./dashboard.html",

    registerMenuBtn:
        "./register.html",

    searchMenuBtn:
        "./search.html",

    formicMenuBtn:
        "./formic.html",

    reportsMenuBtn:
        "./reports.html",

    adminMenuBtn:
        "./admin.html",

    settingsMenuBtn:
        "./settings.html"

};


Object.entries(
    navigation
).forEach(
    (
        [
            id,
            url
        ]
    ) => {

        safeEvent(
            $(id),
            "click",
            () => {

                location.href =
                    url;

            }
        );

    }
);


/* =====================================================
   KEYBOARD
===================================================== */

safeEvent(
    document,
    "keydown",
    event => {

        const ctrl =
            event.ctrlKey ||
            event.metaKey;


        if (
            !ctrl
        ) {

            return;

        }


        const key =
            event.key.toLowerCase();


        if (
            key ===
            "z"
        ) {

            event.preventDefault();

            undo();

        } else if (
            key ===
            "y"
        ) {

            event.preventDefault();

            redo();

        } else if (
            key ===
            "c"
        ) {

            event.preventDefault();

            copySelection(
                false
            );

        } else if (
            key ===
            "x"
        ) {

            event.preventDefault();

            copySelection(
                true
            );

        } else if (
            key ===
            "v"
        ) {

            event.preventDefault();

            pasteSelection();

        }

    }
);


/* =====================================================
   UNDO
===================================================== */

function undo() {

    if (
        !isSuper()
    ) {

        return;

    }


    if (
        !undoStack.length
    ) {

        showMessage(
            "د Undo لپاره پخوانی بدلون نشته.",
            "warning"
        );

        return;

    }


    redoStack.push(
        snapshot()
    );


    state =
        normalizeState(
            undoStack.pop()
        );


    currentSheetId =
        state.شیتونه[0]
            ?.پېژند ||
        "";


    selected =
        [];


    renderAll();


    markChanged();

}


/* =====================================================
   REDO
===================================================== */

function redo() {

    if (
        !isSuper()
    ) {

        return;

    }


    if (
        !redoStack.length
    ) {

        showMessage(
            "د Redo لپاره بدلون نشته.",
            "warning"
        );

        return;

    }


    undoStack.push(
        snapshot()
    );


    state =
        normalizeState(
            redoStack.pop()
        );


    currentSheetId =
        state.شیتونه[0]
            ?.پېژند ||
        "";


    selected =
        [];


    renderAll();


    markChanged();

}


/* =====================================================
   GLOBAL ERROR
===================================================== */

window.addEventListener(
    "error",
    event => {

        console.error(
            "FORMIC GLOBAL ERROR:",
            event.error ||
            event.message
        );


        if (
            isAbortError(
                event.error
            )
        ) {

            return;

        }


        showMessage(
            "❌ په Formic کې ناڅاپي تېروتنه رامنځته شوه.",
            "danger"
        );

    }
);


window.addEventListener(
    "unhandledrejection",
    event => {

        console.error(
            "FORMIC UNHANDLED PROMISE:",
            event.reason
        );


        if (
            isRetryableError(
                event.reason
            )
        ) {

            if (
                pendingSnapshot
            ) {

                pendingSave =
                    true;


                scheduleRetry(
                    false
                );

            }


            return;

        }


        showMessage(
            firebaseErrorText(
                event.reason
            ),
            "danger"
        );

    }
);


/* =====================================================
   PAGE LEAVE
===================================================== */

window.addEventListener(
    "beforeunload",
    () => {

        pageLeaving =
            true;

    }
);


/* =====================================================
   AUTH
===================================================== */

listenAuth(
    async session => {

        try {

            if (
                !session
            ) {

                location.href =
                    "./index.html";

                return;

            }


            currentUser =
                session.user ||
                session;


            currentRole =
                clean(
                    session.role ||
                    session.user?.role ||
                    currentUser?.role ||
                    ""
                )
                .toLowerCase();


            if (
                !currentRole &&
                currentUser?.uid
            ) {

                try {

                    const adminSnap =
                        await getDoc(
                            doc(
                                db,
                                "admins",
                                currentUser.uid
                            )
                        );


                    if (
                        adminSnap.exists()
                    ) {

                        currentRole =
                            clean(
                                adminSnap.data()?.role ||
                                ""
                            )
                            .toLowerCase();

                    }

                } catch (
                    error
                ) {

                    console.warn(
                        "ADMIN ROLE LOAD:",
                        error
                    );

                }

            }


            try {

                await initializeSettings();

            } catch (
                error
            ) {

                console.warn(
                    "SETTINGS INIT:",
                    error
                );

            }


            await loadFormic();

        } catch (
            error
        ) {

            console.error(
                "FORMIC AUTH START:",
                error
            );


            state =
                normalizeState(
                    {}
                );


            currentSheetId =
                state.شیتونه[0]
                    ?.پېژند ||
                "";


            selected =
                [];


            renderAll();


            showMessage(
                firebaseErrorText(
                    error
                ),
                "danger"
            );

        }

    }
);