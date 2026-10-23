const express = require("express");
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

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

app.post("/validate-food", (req, res) => {
    const { name, quantity, purchaseDate, expiryDate } = req.body;
    const errors = [];

    if (typeof name !== "string" || !name.trim()) {
        errors.push("Food item name is required.");
    } else if (!/^[A-Za-z]/.test(name.trim())) {
        errors.push("Food name must start with a letter.");
    } else if (name.trim().length > 80) {
        errors.push("Food item name must not exceed 80 characters.");
    }

    const numericQuantity = Number(quantity);

    if (
        quantity === undefined ||
        quantity === null ||
        String(quantity).trim() === "" ||
        !Number.isFinite(numericQuantity) ||
        numericQuantity <= 0 ||
        numericQuantity > 1000000
    ) {
        errors.push("Quantity must be greater than 0 and no more than 1,000,000.");
    }

    const validPurchaseDate = isValidDate(purchaseDate);
    const validExpiryDate = isValidDate(expiryDate);

    if (!validPurchaseDate) {
        errors.push("Please enter a valid purchase date.");
    } else if (purchaseDate > getLocalToday()) {
        errors.push("Purchase date cannot be in the future.");
    }

    if (!validExpiryDate) {
        errors.push("Please enter a valid expiry date.");
    }

    if (
        validPurchaseDate &&
        validExpiryDate &&
        expiryDate < purchaseDate
    ) {
        errors.push("Expiry date cannot be earlier than purchase date.");
    }

    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            message: "Please correct the following errors.",
            errors
        });
    }

    return res.status(200).json({
        success: true,
        message: "Food item validated successfully."
    });
});


app.listen(PORT, "0.0.0.0", () => {
    console.log(`UseBy server running on port ${PORT}`);
});