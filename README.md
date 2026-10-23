# UseBy – Food Expiry & Waste Tracker

UseBy is a web application that helps users track food items, monitor expiry dates, and reduce food waste. It is built using HTML, CSS, JavaScript, Node.js, and Express.js.

## Features
- Add, edit, delete, and mark food items as consumed.
- Track expiry dates and identify items that need to be used first.
- Search and filter food items.
- Server-side validation for food names, quantities, and dates.
- Display appropriate success and error messages.
- Responsive interface for different screen sizes.

## Technologies Used
- **Frontend:** HTML, CSS, JavaScript
- **Backend:** Node.js, Express.js
- **Storage:** Browser Local Storage

## Run Locally
1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the server:
   ```bash
   npm start
   ```
3. Open `http://localhost:3000` in your browser.

## Server-Side Validation
The `/validate-food` POST route validates user input and returns appropriate success or error responses.

## Purpose
Developed as part of **Practical No. 04 – Server-Side Development using Node.js** to demonstrate routing, request/response handling, and server-side input validation.
