const foodForm = document.getElementById("foodForm");
const foodList = document.getElementById("foodList");
const useFirstList = document.getElementById("useFirstList");
const formMessage = document.getElementById("formMessage");
const toastContainer = document.getElementById("toastContainer");
const submitBtn = document.getElementById("submitBtn");
const submitBtnText = document.getElementById("submitBtnText");
const cancelEditBtn = document.getElementById("cancelEditBtn");
const STORAGE_KEY = "usebyFoodItems";

const fields = ["name", "quantity", "purchaseDate", "expiryDate"];
const fieldErrors = {
    name: "Enter a food item name.",
    quantity: "Enter a quantity greater than zero.",
    purchaseDate: "Select a valid purchase date.",
    expiryDate: "Select a valid expiry date."
};

let currentFilter = "all";
let editingId = null;
let isSubmitting = false;

function getItems() {
    try {
        const items = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
        return Array.isArray(items) ? items : [];
    } catch {
        return [];
    }
}

function saveItems(items) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
        return true;
    } catch {
        showToast("Storage unavailable", "Your browser could not save the changes.", "error");
        return false;
    }
}

function showToast(title, message, type = "success") {
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.setAttribute("role", type === "error" ? "alert" : "status");

    const symbol = document.createElement("span");
    symbol.className = "toast-symbol";
    symbol.textContent = type === "success" ? "✓" : type === "error" ? "!" : "i";

    const content = document.createElement("div");
    content.className = "toast-content";

    const heading = document.createElement("strong");
    heading.textContent = title;

    const description = document.createElement("p");
    description.textContent = message;

    const close = document.createElement("button");
    close.type = "button";
    close.className = "toast-close";
    close.setAttribute("aria-label", "Dismiss notification");
    close.textContent = "×";

    content.append(heading, description);
    toast.append(symbol, content, close);
    toastContainer.appendChild(toast);

    let timer;

    const removeToast = () => {
        if (!toast.isConnected) return;
        clearTimeout(timer);
        toast.classList.add("toast-out");
        setTimeout(() => toast.remove(), 300);
    };

    close.addEventListener("click", removeToast);
    timer = setTimeout(removeToast, 4500);

    while (toastContainer.children.length > 4) {
        toastContainer.firstElementChild.remove();
    }
}

function showFormMessage(message, type) {
    formMessage.textContent = message;
    formMessage.className = `form-message ${type}`;
}

function clearFormMessage() {
    formMessage.textContent = "";
    formMessage.className = "form-message";
}

function clearFieldError(field) {
    const input = document.getElementById(field);
    const error = document.getElementById(`${field}Error`);

    input.classList.remove("invalid");
    input.removeAttribute("aria-invalid");
    error.textContent = "";
}

function setFieldError(field, message) {
    const input = document.getElementById(field);
    const error = document.getElementById(`${field}Error`);

    input.classList.add("invalid");
    input.setAttribute("aria-invalid", "true");
    error.textContent = message;
}

function clearValidation() {
    fields.forEach(clearFieldError);
    clearFormMessage();
}

function isValidDate(value) {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return false;
    }

    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));

    return date.getUTCFullYear() === year &&
        date.getUTCMonth() === month - 1 &&
        date.getUTCDate() === day;
}

function getLocalToday() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function validateForm(data) {
    clearValidation();
    let valid = true;

    if (!data.name || !data.name.trim()) {
        setFieldError("name", fieldErrors.name);
        valid = false;
    } else if (!/^[A-Za-z]/.test(data.name.trim())) {
        setFieldError("name", "Food name must start with a letter.");
        valid = false;
    } else if (data.name.trim().length > 80) {
        setFieldError("name", "Keep the item name within 80 characters.");
        valid = false;
    }

    const quantity = Number(data.quantity);

    if (
        !data.quantity ||
        !Number.isFinite(quantity) ||
        quantity <= 0 ||
        quantity > 1000000
    ) {
        setFieldError("quantity", "Enter a quantity greater than 0 and no more than 1,000,000.");
        valid = false;
    }

    const validPurchaseDate = isValidDate(data.purchaseDate);
    const validExpiryDate = isValidDate(data.expiryDate);

    if (!validPurchaseDate) {
        setFieldError("purchaseDate", fieldErrors.purchaseDate);
        valid = false;
    } else if (data.purchaseDate > getLocalToday()) {
        setFieldError("purchaseDate", "Purchase date cannot be in the future.");
        valid = false;
    }

    if (!validExpiryDate) {
        setFieldError("expiryDate", fieldErrors.expiryDate);
        valid = false;
    } else if (
        validPurchaseDate &&
        data.expiryDate < data.purchaseDate
    ) {
        setFieldError("expiryDate", "Expiry date cannot be earlier than purchase date.");
        valid = false;
    }

    if (!valid) {
        showFormMessage("Please correct the highlighted fields and try again.", "error");
        const firstInvalid = document.querySelector(".form-group input.invalid");
        if (firstInvalid) firstInvalid.focus();
        return false;
    }

    return true;
}

function getStatus(item) {
    if (item.consumed) return "consumed";

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const expiry = new Date(`${item.expiryDate}T00:00:00`);
    const daysLeft = Math.round((expiry - today) / 86400000);

    if (daysLeft < 0) return "expired";
    if (daysLeft <= 3) return "soon";
    return "fresh";
}

function getDaysText(expiryDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const expiry = new Date(`${expiryDate}T00:00:00`);
    const days = Math.round((expiry - today) / 86400000);

    if (days < 0) return `Expired ${Math.abs(days)} ${Math.abs(days) === 1 ? "day" : "days"} ago`;
    if (days === 0) return "Expires today";
    if (days === 1) return "Expires tomorrow";

    return `Expires in ${days} days`;
}

function formatDate(date) {
    return new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric"
    });
}

function updateDashboard(items) {
    const active = items.filter(item => !item.consumed);

    document.getElementById("totalItems").textContent = active.length;
    document.getElementById("expiringItems").textContent =
        active.filter(item => getStatus(item) === "soon").length;
    document.getElementById("expiredItems").textContent =
        active.filter(item => getStatus(item) === "expired").length;
    document.getElementById("itemCount").textContent =
        `${items.length} ${items.length === 1 ? "item" : "items"}`;
}

function makeStatusBadge(status) {
    const badge = document.createElement("span");
    badge.className = `status ${status}`;

    const labels = {
        fresh: "Fresh",
        soon: "Expiring soon",
        expired: "Expired",
        consumed: "Consumed"
    };

    badge.textContent = labels[status];
    return badge;
}

function makeEmptyState(title, description) {
    const empty = document.createElement("div");
    empty.className = "empty-state";

    const symbol = document.createElement("span");
    symbol.className = "empty-illustration";
    symbol.textContent = "♡";

    const heading = document.createElement("h3");
    heading.textContent = title;

    const text = document.createElement("p");
    text.textContent = description;

    empty.append(symbol, heading, text);
    return empty;
}

function renderUseFirst(items) {
    useFirstList.replaceChildren();

    const priorityItems = items
        .filter(item => !item.consumed && ["soon", "expired"].includes(getStatus(item)))
        .sort((a, b) => a.expiryDate.localeCompare(b.expiryDate))
        .slice(0, 5);

    if (priorityItems.length === 0) {
        const message = document.createElement("p");
        message.className = "inline-empty";
        message.textContent = "Your pantry is looking good. No urgent items right now.";
        useFirstList.appendChild(message);
        return;
    }

    priorityItems.forEach(item => {
        const card = document.createElement("article");
        card.className = "priority-card";

        const main = document.createElement("div");
        main.className = "priority-main";

        const name = document.createElement("h3");
        name.textContent = item.name;

        const detail = document.createElement("p");
        detail.textContent = getDaysText(item.expiryDate);

        main.append(name, detail);
        card.append(main, makeStatusBadge(getStatus(item)));
        useFirstList.appendChild(card);
    });
}

function makeActionButton(label, className, action) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `small-btn ${className || ""}`.trim();
    button.textContent = label;
    button.addEventListener("click", action);
    return button;
}

function renderItems() {
    const items = getItems().sort((a, b) =>
        a.expiryDate.localeCompare(b.expiryDate)
    );

    updateDashboard(items);
    renderUseFirst(items);

    const searchTerm = document.getElementById("searchInput").value.trim().toLowerCase();

    const filtered = items.filter(item => {
        const matchesFilter = currentFilter === "all" || getStatus(item) === currentFilter;
        const matchesSearch = item.name.toLowerCase().includes(searchTerm);
        return matchesFilter && matchesSearch;
    });

    foodList.replaceChildren();

    if (filtered.length === 0) {
        const hasItems = items.length > 0;
        foodList.appendChild(makeEmptyState(
            hasItems ? "No matching items" : "Your pantry is waiting!",
            hasItems
                ? "Try a different search term or select another filter."
                : "Add your first food item to start tracking its freshness."
        ));
        return;
    }

    filtered.forEach(item => {
        const status = getStatus(item);
        const card = document.createElement("article");
        card.className = "food-card";

        const main = document.createElement("div");
        main.className = "food-card-main";

        const name = document.createElement("h3");
        name.textContent = item.name;

        const details = document.createElement("p");
        details.textContent =
            `Quantity: ${item.quantity} · Purchased: ${formatDate(item.purchaseDate)} · ${getDaysText(item.expiryDate)}`;

        const expiryDetail = document.createElement("p");
        expiryDetail.textContent = `Expiry date: ${formatDate(item.expiryDate)}`;

        main.append(name, details, expiryDetail);

        const side = document.createElement("div");
        side.className = "food-card-side";
        side.appendChild(makeStatusBadge(status));

        const actions = document.createElement("div");
        actions.className = "food-actions";

        if (!item.consumed) {
            actions.appendChild(makeActionButton("Mark consumed", "", () => markConsumed(item.id)));
            actions.appendChild(makeActionButton("Edit", "", () => editItem(item.id)));
        }

        actions.appendChild(makeActionButton("Delete", "delete-btn", () => deleteItem(item.id)));

        side.appendChild(actions);
        card.append(main, side);
        foodList.appendChild(card);
    });
}

foodForm.addEventListener("submit", async event => {
    event.preventDefault();

    if (isSubmitting) return;

    const data = Object.fromEntries(new FormData(foodForm).entries());

    if (!validateForm(data)) return;

    isSubmitting = true;
    submitBtn.disabled = true;
    submitBtnText.textContent = editingId ? "Saving changes..." : "Adding item...";

    try {
        const response = await fetch("/validate-food", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });

        let result;

        try {
            result = await response.json();
        } catch {
            throw new Error("The server returned an unexpected response.");
        }

        if (!response.ok || !result.success) {
            const errors = result.errors || [result.message || "Please check your details."];
            showFormMessage(errors.join(" "), "error");

            errors.forEach(message => {
                const lower = message.toLowerCase();

                if (
                    lower.includes("food item name") ||
                    lower.includes("food name") ||
                    lower.includes("item name")
                ) {
                    setFieldError("name", message);
                } else if (lower.includes("quantity")) {
                    setFieldError("quantity", message);
                } else if (lower.includes("purchase date")) {
                    setFieldError("purchaseDate", message);
                } else if (lower.includes("expiry date")) {
                    setFieldError("expiryDate", message);
                }
            });

            showToast("Please check your details", errors.join(" "), "error");
            return;
        }

        const items = getItems();
        const previousItem = editingId
            ? items.find(item => item.id === editingId)
            : null;

        const foodItem = {
            id: editingId || `${Date.now()}-${Math.random().toString(16).slice(2)}`,
            name: data.name.trim(),
            quantity: Number(data.quantity),
            purchaseDate: data.purchaseDate,
            expiryDate: data.expiryDate,
            consumed: previousItem ? previousItem.consumed : false
        };

        if (editingId) {
            const index = items.findIndex(item => item.id === editingId);

            if (index === -1) {
                showFormMessage("This item could not be found. Please refresh and try again.", "error");
                return;
            }

            items[index] = foodItem;
        } else {
            items.push(foodItem);
        }

        if (!saveItems(items)) return;

        const wasEditing = Boolean(editingId);

        foodForm.reset();
        resetEditMode();
        clearValidation();
        renderItems();

        showToast(
            wasEditing ? "Changes saved!" : "Item added successfully!",
            wasEditing
                ? `${foodItem.name} has been updated in your pantry.`
                : `${foodItem.name} has been added to your pantry.`,
            "success"
        );
    } catch (error) {
        const message = error.message === "Failed to fetch"
            ? "Unable to reach the server. Make sure UseBy is running and try again."
            : error.message;

        showFormMessage(message, "error");
        showToast("Something went wrong", message, "error");
    } finally {
        isSubmitting = false;
        submitBtn.disabled = false;
        submitBtnText.textContent = editingId ? "Save changes" : "Add to my pantry";
    }
});

function markConsumed(id) {
    const items = getItems();
    const item = items.find(entry => entry.id === id);

    if (!item || item.consumed) return;
    if (!confirm(`Mark "${item.name}" as consumed?`)) return;

    const updated = items.map(entry =>
        entry.id === id ? { ...entry, consumed: true } : entry
    );

    if (!saveItems(updated)) return;

    renderItems();
    showToast("Marked as consumed", `${item.name} has been marked as consumed.`, "success");
}

function editItem(id) {
    const item = getItems().find(entry => entry.id === id);
    if (!item) return;

    fields.forEach(clearFieldError);
    clearFormMessage();

    document.getElementById("name").value = item.name;
    document.getElementById("quantity").value = item.quantity;
    document.getElementById("purchaseDate").value = item.purchaseDate;
    document.getElementById("expiryDate").value = item.expiryDate;

    editingId = id;
    document.getElementById("formTitle").textContent = "Edit food item";
    submitBtnText.textContent = "Save changes";
    cancelEditBtn.classList.remove("hidden");

    document.getElementById("addItemSection").scrollIntoView({
        behavior: "smooth",
        block: "start"
    });

    document.getElementById("name").focus({ preventScroll: true });
}

function resetEditMode() {
    editingId = null;
    document.getElementById("formTitle").textContent = "Add a food item";
    submitBtnText.textContent = "Add to my pantry";
    cancelEditBtn.classList.add("hidden");
}

cancelEditBtn.addEventListener("click", () => {
    foodForm.reset();
    resetEditMode();
    clearValidation();
    showToast("Edit cancelled", "Your existing item has not been changed.", "info");
});

function deleteItem(id) {
    const items = getItems();
    const item = items.find(entry => entry.id === id);

    if (!item) return;

    if (!confirm(`Are you sure you want to delete "${item.name}"? This cannot be undone.`)) {
        return;
    }

    const updated = items.filter(entry => entry.id !== id);

    if (!saveItems(updated)) return;

    if (editingId === id) {
        foodForm.reset();
        resetEditMode();
        clearValidation();
    }

    renderItems();
    showToast("Item deleted", `${item.name} has been removed from your pantry.`, "success");
}

document.querySelectorAll(".filter-btn").forEach(button => {
    button.addEventListener("click", () => {
        currentFilter = button.dataset.filter;

        document.querySelectorAll(".filter-btn").forEach(btn => {
            const active = btn === button;
            btn.classList.toggle("active", active);
            btn.setAttribute("aria-pressed", String(active));
        });

        renderItems();
    });
});

document.getElementById("searchInput").addEventListener("input", renderItems);

fields.forEach(field => {
    const input = document.getElementById(field);

    input.addEventListener("input", () => {
        clearFieldError(field);
        clearFormMessage();
    });

    input.addEventListener("change", () => {
        clearFieldError(field);
        clearFormMessage();
    });
});

renderItems();