// ==========================================
// Hafz Admin Online System
// users.js
// User Management Interface
// ==========================================

import {
    auth
} from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";

import {
    ADMIN_ROLES,
    getCurrentAdmin,
    getAdmins,
    createAdminProfile,
    updateAdminProfile,
    updateAdminRole,
    setAdminStatus,
    deleteAdminProfile
} from "./admin.js";


// ==========================================
// DOM
// ==========================================

const messageBox =
    document.getElementById("messageBox");

const accessDenied =
    document.getElementById("accessDenied");

const addUserPanel =
    document.getElementById("addUserPanel");

const editUserPanel =
    document.getElementById("editUserPanel");

const usersPanel =
    document.getElementById("usersPanel");

const currentAdminBox =
    document.getElementById("currentAdminBox");

const userUid =
    document.getElementById("userUid");

const userEmail =
    document.getElementById("userEmail");

const userName =
    document.getElementById("userName");

const userRole =
    document.getElementById("userRole");

const createUserBtn =
    document.getElementById("createUserBtn");

const clearCreateBtn =
    document.getElementById("clearCreateBtn");

const editUid =
    document.getElementById("editUid");

const editName =
    document.getElementById("editName");

const editEmail =
    document.getElementById("editEmail");

const editRole =
    document.getElementById("editRole");

const editActive =
    document.getElementById("editActive");

const saveEditBtn =
    document.getElementById("saveEditBtn");

const cancelEditBtn =
    document.getElementById("cancelEditBtn");

const usersSearch =
    document.getElementById("usersSearch");

const refreshUsersBtn =
    document.getElementById("refreshUsersBtn");

const usersLoading =
    document.getElementById("usersLoading");

const usersEmpty =
    document.getElementById("usersEmpty");

const usersTableBody =
    document.getElementById("usersTableBody");


// ==========================================
// State
// ==========================================

let currentAdmin = null;

let allAdmins = [];

let authReady = false;

let initialized = false;


// ==========================================
// Utility
// ==========================================

function cleanText(value) {

    return String(
        value ?? ""
    ).trim();
}


// ==========================================
// Escape HTML
// ==========================================

function escapeHtml(value) {

    return String(
        value ?? ""
    )
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


// ==========================================
// Show Message
// ==========================================

function showMessage(
    message,
    type = "info"
) {

    messageBox.textContent =
        message || "";

    messageBox.className =
        `message show ${type}`;

    window.clearTimeout(
        showMessage.timer
    );

    showMessage.timer =
        window.setTimeout(() => {

            messageBox.className =
                "message";

            messageBox.textContent =
                "";

        }, 6000);
}


// ==========================================
// Set Loading
// ==========================================

function setLoading(isLoading) {

    if (isLoading) {

        usersLoading.classList.remove(
            "hidden"
        );

        refreshUsersBtn.disabled =
            true;

    } else {

        usersLoading.classList.add(
            "hidden"
        );

        refreshUsersBtn.disabled =
            false;
    }
}


// ==========================================
// Get Role Label
// ==========================================

function roleLabel(role) {

    role =
        cleanText(role).toLowerCase();

    if (
        role ===
        ADMIN_ROLES.SUPERADMIN
    ) {
        return "Super Admin";
    }

    if (
        role ===
        ADMIN_ROLES.ADMIN
    ) {
        return "Admin";
    }

    return "User";
}


// ==========================================
// Role CSS
// ==========================================

function roleClass(role) {

    role =
        cleanText(role).toLowerCase();

    if (
        role ===
        ADMIN_ROLES.SUPERADMIN
    ) {
        return "role role-superadmin";
    }

    if (
        role ===
        ADMIN_ROLES.ADMIN
    ) {
        return "role role-admin";
    }

    return "role role-user";
}


// ==========================================
// Status Label
// ==========================================

function statusLabel(active) {

    return active === false
        ? "غیر فعال"
        : "فعال";
}


// ==========================================
// Render Current Admin
// ==========================================

function renderCurrentAdmin() {

    if (!currentAdmin) {

        currentAdminBox.textContent =
            "معلومات موجودې نه دي";

        return;
    }

    const name =
        cleanText(
            currentAdmin.name
        ) ||
        cleanText(
            currentAdmin.email
        ) ||
        "Super Admin";

    const email =
        cleanText(
            currentAdmin.email
        );

    currentAdminBox.innerHTML =
        `
        <strong>
            ${escapeHtml(name)}
        </strong>
        <br>
        <span>
            ${escapeHtml(email)}
        </span>
        <br>
        <span>
            Role:
            ${escapeHtml(
                roleLabel(
                    currentAdmin.role
                )
            )}
        </span>
        `;
}


// ==========================================
// Clear Create Form
// ==========================================

function clearCreateForm() {

    userUid.value = "";

    userEmail.value = "";

    userName.value = "";

    userRole.value =
        ADMIN_ROLES.USER;
}


// ==========================================
// Open Edit Form
// ==========================================

function openEditForm(admin) {

    if (!admin) {
        return;
    }

    editUid.value =
        cleanText(
            admin.id ||
            admin.uid
        );

    editName.value =
        cleanText(
            admin.name
        );

    editEmail.value =
        cleanText(
            admin.email
        );

    editRole.value =
        cleanText(
            admin.role
        ).toLowerCase() ||
        ADMIN_ROLES.USER;

    editActive.value =
        admin.active === false
            ? "false"
            : "true";

    editUserPanel.classList.remove(
        "hidden"
    );

    editUserPanel.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}


// ==========================================
// Close Edit Form
// ==========================================

function closeEditForm() {

    editUserPanel.classList.add(
        "hidden"
    );

    editUid.value = "";

    editName.value = "";

    editEmail.value = "";

    editRole.value =
        ADMIN_ROLES.USER;

    editActive.value =
        "true";
}


// ==========================================
// Filter Users
// ==========================================

function getFilteredAdmins() {

    const search =
        cleanText(
            usersSearch.value
        ).toLowerCase();

    if (!search) {
        return [...allAdmins];
    }

    return allAdmins.filter(
        (admin) => {

            const values = [

                admin.id,

                admin.uid,

                admin.name,

                admin.email,

                admin.role,

                admin.active === false
                    ? "غیر فعال"
                    : "فعال"

            ];

            return values.some(
                value =>
                    cleanText(
                        value
                    )
                    .toLowerCase()
                    .includes(search)
            );
        }
    );
}


// ==========================================
// Render Users
// ==========================================

function renderUsers() {

    const admins =
        getFilteredAdmins();

    usersTableBody.innerHTML =
        "";

    usersEmpty.classList.toggle(
        "hidden",
        admins.length !== 0
    );

    if (!admins.length) {
        return;
    }

    admins.forEach(
        (admin, index) => {

            const uid =
                cleanText(
                    admin.id ||
                    admin.uid
                );

            const name =
                cleanText(
                    admin.name
                ) ||
                "—";

            const email =
                cleanText(
                    admin.email
                ) ||
                "—";

            const role =
                cleanText(
                    admin.role
                ).toLowerCase();

            const active =
                admin.active !== false;

            const row =
                document.createElement(
                    "tr"
                );

            const isCurrent =
                uid ===
                cleanText(
                    auth.currentUser?.uid
                );

            row.innerHTML =
                `
                <td>
                    ${index + 1}
                </td>

                <td>
                    ${escapeHtml(name)}

                    ${
                        isCurrent
                            ? `
                                <br>
                                <small>
                                    (تاسو)
                                </small>
                              `
                            : ""
                    }
                </td>

                <td class="email-text">
                    ${escapeHtml(email)}
                </td>

                <td>
                    <span
                        class="${roleClass(role)}"
                    >
                        ${escapeHtml(
                            roleLabel(role)
                        )}
                    </span>
                </td>

                <td>
                    <span
                        class="status ${
                            active
                                ? "status-active"
                                : "status-inactive"
                        }"
                    >
                        ${escapeHtml(
                            statusLabel(
                                admin.active
                            )
                        )}
                    </span>
                </td>

                <td class="uid-text">
                    ${escapeHtml(uid)}
                </td>

                <td>

                    <div class="row-actions">

                        <button
                            type="button"
                            class="btn-primary"
                            data-action="edit"
                            data-uid="${escapeHtml(uid)}"
                        >
                            ✏️ Edit
                        </button>

                        <button
                            type="button"
                            class="${
                                active
                                    ? "btn-warning"
                                    : "btn-success"
                            }"
                            data-action="status"
                            data-uid="${escapeHtml(uid)}"
                            data-active="${
                                active
                                    ? "false"
                                    : "true"
                            }"
                            ${
                                isCurrent
                                    ? "disabled"
                                    : ""
                            }
                        >
                            ${
                                active
                                    ? "⛔ غیر فعال"
                                    : "✅ فعال"
                            }
                        </button>

                        <button
                            type="button"
                            class="btn-danger"
                            data-action="delete"
                            data-uid="${escapeHtml(uid)}"
                            ${
                                isCurrent
                                    ? "disabled"
                                    : ""
                            }
                        >
                            🗑️ حذف
                        </button>

                    </div>

                </td>
                `;

            usersTableBody.appendChild(
                row
            );
        }
    );
}


// ==========================================
// Load Users
// ==========================================

async function loadUsers() {

    if (!currentAdmin) {

        showMessage(
            "Super Admin معلومات موجودې نه دي.",
            "error"
        );

        return;
    }

    setLoading(true);

    try {

        const result =
            await getAdmins();

        if (
            !result ||
            result.success !== true
        ) {

            allAdmins = [];

            renderUsers();

            showMessage(
                result?.message ||
                "د کاروونکو معلومات ترلاسه نه شول.",
                "error"
            );

            return;
        }

        allAdmins =
            Array.isArray(
                result.admins
            )
                ? result.admins
                : [];

        renderUsers();

    } catch (error) {

        console.error(
            "Users Load Error:",
            error
        );

        allAdmins = [];

        renderUsers();

        showMessage(
            error.message ||
            "د کاروونکو معلومات ترلاسه نه شول.",
            "error"
        );

    } finally {

        setLoading(false);
    }
}


// ==========================================
// Create User Profile
// ==========================================

async function handleCreateUser() {

    const uid =
        cleanText(
            userUid.value
        );

    const email =
        cleanText(
            userEmail.value
        ).toLowerCase();

    const name =
        cleanText(
            userName.value
        );

    const role =
        cleanText(
            userRole.value
        ).toLowerCase();


    if (!uid) {

        showMessage(
            "Firebase UID ضروري دی.",
            "error"
        );

        userUid.focus();

        return;
    }


    if (!email) {

        showMessage(
            "ایمیل ضروري دی.",
            "error"
        );

        userEmail.focus();

        return;
    }


    const emailPattern =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (
        !emailPattern.test(email)
    ) {

        showMessage(
            "ایمیل سم نه دی.",
            "error"
        );

        userEmail.focus();

        return;
    }


    if (
        !Object.values(
            ADMIN_ROLES
        ).includes(role)
    ) {

        showMessage(
            "Role ناسم دی.",
            "error"
        );

        return;
    }


    createUserBtn.disabled =
        true;


    try {

        const result =
            await createAdminProfile({

                uid,

                email,

                name,

                role

            });


        if (
            !result ||
            result.success !== true
        ) {

            showMessage(
                result?.message ||
                "کاروونکی ثبت نه شو.",
                "error"
            );

            return;
        }


        showMessage(
            result.message ||
            "کاروونکی په بریالیتوب ثبت شو.",
            "success"
        );


        clearCreateForm();

        await loadUsers();

    } catch (error) {

        console.error(
            "Create User Error:",
            error
        );

        showMessage(
            error.message ||
            "کاروونکی ثبت نه شو.",
            "error"
        );

    } finally {

        createUserBtn.disabled =
            false;
    }
}


// ==========================================
// Save User Edit
// ==========================================

async function handleSaveEdit() {

    const uid =
        cleanText(
            editUid.value
        );

    const name =
        cleanText(
            editName.value
        );

    const email =
        cleanText(
            editEmail.value
        ).toLowerCase();

    const role =
        cleanText(
            editRole.value
        ).toLowerCase();

    const active =
        editActive.value ===
        "true";


    if (!uid) {

        showMessage(
            "د کاروونکي UID موجود نه دی.",
            "error"
        );

        return;
    }


    if (!email) {

        showMessage(
            "ایمیل ضروري دی.",
            "error"
        );

        return;
    }


    const emailPattern =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (
        !emailPattern.test(email)
    ) {

        showMessage(
            "ایمیل سم نه دی.",
            "error"
        );

        return;
    }


    if (
        !Object.values(
            ADMIN_ROLES
        ).includes(role)
    ) {

        showMessage(
            "Role ناسم دی.",
            "error"
        );

        return;
    }


    saveEditBtn.disabled =
        true;


    try {

        /*
         * لومړی عمومي معلومات Update
         */

        const profileResult =
            await updateAdminProfile(
                uid,
                {
                    name,
                    email
                }
            );


        if (
            !profileResult ||
            profileResult.success !== true
        ) {

            showMessage(
                profileResult?.message ||
                "معلومات Update نه شول.",
                "error"
            );

            return;
        }


        /*
         * Role Update
         */

        const roleResult =
            await updateAdminRole(
                uid,
                role
            );


        if (
            !roleResult ||
            roleResult.success !== true
        ) {

            showMessage(
                roleResult?.message ||
                "Role Update نه شو.",
                "error"
            );

            return;
        }


        /*
         * Active Status Update
         */

        const statusResult =
            await setAdminStatus(
                uid,
                active
            );


        if (
            !statusResult ||
            statusResult.success !== true
        ) {

            showMessage(
                statusResult?.message ||
                "د کاروونکي حالت Update نه شو.",
                "error"
            );

            return;
        }


        showMessage(
            "د کاروونکي ټول معلومات په بریالیتوب Update شول.",
            "success"
        );


        closeEditForm();

        await loadUsers();

    } catch (error) {

        console.error(
            "Save User Edit Error:",
            error
        );

        showMessage(
            error.message ||
            "د کاروونکي معلومات Update نه شول.",
            "error"
        );

    } finally {

        saveEditBtn.disabled =
            false;
    }
}


// ==========================================
// Change Status
// ==========================================

async function handleStatusChange(
    uid,
    active
) {

    if (!uid) {
        return;
    }


    if (
        uid ===
        cleanText(
            auth.currentUser?.uid
        )
    ) {

        showMessage(
            "خپل Super Admin حساب غیر فعالولی نه شئ.",
            "error"
        );

        return;
    }


    const message =
        active
            ? "ایا غواړئ دا کاروونکی فعال کړئ؟"
            : "ایا غواړئ دا کاروونکی غیر فعال کړئ؟";


    if (!window.confirm(message)) {
        return;
    }


    try {

        const result =
            await setAdminStatus(
                uid,
                active
            );


        if (
            !result ||
            result.success !== true
        ) {

            showMessage(
                result?.message ||
                "د کاروونکي حالت بدل نه شو.",
                "error"
            );

            return;
        }


        showMessage(
            result.message ||
            "د کاروونکي حالت بدل شو.",
            "success"
        );


        await loadUsers();

    } catch (error) {

        console.error(
            "Status Change Error:",
            error
        );

        showMessage(
            error.message ||
            "د کاروونکي حالت بدل نه شو.",
            "error"
        );
    }
}


// ==========================================
// Delete User Profile
// ==========================================

async function handleDeleteUser(
    uid
) {

    if (!uid) {
        return;
    }


    if (
        uid ===
        cleanText(
            auth.currentUser?.uid
        )
    ) {

        showMessage(
            "خپل Super Admin حساب نه شئ حذف کولی.",
            "error"
        );

        return;
    }


    const target =
        allAdmins.find(
            admin =>
                cleanText(
                    admin.id ||
                    admin.uid
                ) === uid
        );


    const email =
        cleanText(
            target?.email
        );


    const confirmation =
        email
            ? `ایا ډاډه یاست چې د ${email} کاروونکي Admin Profile حذف کړئ؟`
            : "ایا ډاډه یاست چې د دې کاروونکي Admin Profile حذف کړئ؟";


    if (
        !window.confirm(
            confirmation
        )
    ) {
        return;
    }


    try {

        const result =
            await deleteAdminProfile(
                uid
            );


        if (
            !result ||
            result.success !== true
        ) {

            showMessage(
                result?.message ||
                "کاروونکی حذف نه شو.",
                "error"
            );

            return;
        }


        showMessage(
            result.message ||
            "کاروونکی حذف شو.",
            "success"
        );


        await loadUsers();

    } catch (error) {

        console.error(
            "Delete User Error:",
            error
        );

        showMessage(
            error.message ||
            "کاروونکی حذف نه شو.",
            "error"
        );
    }
}


// ==========================================
// Table Actions
// ==========================================

usersTableBody.addEventListener(
    "click",
    async (event) => {

        const button =
            event.target.closest(
                "button[data-action]"
            );

        if (!button) {
            return;
        }

        const action =
            button.dataset.action;

        const uid =
            cleanText(
                button.dataset.uid
            );


        if (action === "edit") {

            const admin =
                allAdmins.find(
                    item =>
                        cleanText(
                            item.id ||
                            item.uid
                        ) === uid
                );

            if (admin) {
                openEditForm(admin);
            }

            return;
        }


        if (action === "status") {

            const active =
                button.dataset.active ===
                "true";

            await handleStatusChange(
                uid,
                active
            );

            return;
        }


        if (action === "delete") {

            await handleDeleteUser(
                uid
            );

        }

    }
);


// ==========================================
// Search
// ==========================================

usersSearch.addEventListener(
    "input",
    () => {

        renderUsers();

    }
);


// ==========================================
// Refresh
// ==========================================

refreshUsersBtn.addEventListener(
    "click",
    async () => {

        await loadUsers();

    }
);


// ==========================================
// Create Button
// ==========================================

createUserBtn.addEventListener(
    "click",
    async () => {

        await handleCreateUser();

    }
);


// ==========================================
// Clear Button
// ==========================================

clearCreateBtn.addEventListener(
    "click",
    () => {

        clearCreateForm();

    }
);


// ==========================================
// Save Edit Button
// ==========================================

saveEditBtn.addEventListener(
    "click",
    async () => {

        await handleSaveEdit();

    }
);


// ==========================================
// Cancel Edit
// ==========================================

cancelEditBtn.addEventListener(
    "click",
    () => {

        closeEditForm();

    }
);


// ==========================================
// Initialize Page
// ==========================================

async function initializeUsersPage() {

    if (initialized) {
        return;
    }

    initialized = true;


    /*
     * د Firebase Auth حالت باید لومړی
     * بشپړ معلوم شي.
     */

    currentAdmin =
        await getCurrentAdmin();


    if (!currentAdmin) {

        accessDenied.classList.remove(
            "hidden"
        );

        currentAdminBox.textContent =
            "د لاسرسي اجازه نشته.";

        return;
    }


    /*
     * یوازې Super Admin
     */

    if (
        cleanText(
            currentAdmin.role
        ).toLowerCase() !==
        ADMIN_ROLES.SUPERADMIN
    ) {

        accessDenied.classList.remove(
            "hidden"
        );

        currentAdminBox.innerHTML =
            `
            <strong>
                ${escapeHtml(
                    currentAdmin.email ||
                    ""
                )}
            </strong>
            <br>
            Role:
            ${escapeHtml(
                roleLabel(
                    currentAdmin.role
                )
            )}
            `;

        return;
    }


    /*
     * Access granted
     */

    renderCurrentAdmin();


    accessDenied.classList.add(
        "hidden"
    );

    addUserPanel.classList.remove(
        "hidden"
    );

    usersPanel.classList.remove(
        "hidden"
    );


    await loadUsers();
}


// ==========================================
// Firebase Authentication State
// ==========================================

onAuthStateChanged(
    auth,
    async (user) => {

        authReady = true;

        if (!user) {

            currentAdmin = null;

            accessDenied.classList.remove(
                "hidden"
            );

            addUserPanel.classList.add(
                "hidden"
            );

            editUserPanel.classList.add(
                "hidden"
            );

            usersPanel.classList.add(
                "hidden"
            );

            currentAdminBox.textContent =
                "Login شوی کاروونکی موجود نه دی.";

            showMessage(
                "د کاروونکو مدیریت لپاره لومړی Login وکړئ.",
                "error"
            );

            return;
        }


        /*
         * د Auth حالت له معلومېدو وروسته
         * د Admin Profile لوستل کېږي.
         */

        currentAdmin = null;

        initialized = false;

        await initializeUsersPage();

    }
);


// ==========================================
// Initial State
// ==========================================

if (!auth.currentUser) {

    currentAdminBox.textContent =
        "⏳ د Login حالت معلومېږي...";

}|| 