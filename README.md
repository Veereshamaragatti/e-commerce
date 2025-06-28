# Full-Stack E-Commerce Demo

This project is a complete, full-stack e-commerce application built to demonstrate a modern web development workflow. It features a dynamic product gallery, a detailed product view, and a secure payment flow integrated with the Razorpay payment gateway.

The backend is architected using a modular, route-based system, and it connects to a cloud-based Supabase (PostgreSQL) database for persistent data storage of products and orders.


## 🛠️ Tech Stack

*   **Frontend:** React, TypeScript, CSS
*   **Backend:** Node.js, Express, TypeScript
*   **Database:** Supabase (PostgreSQL)
*   **Payment Provider:** Razorpay (in Test Mode)

## 📊 System Design & Architecture

This diagram illustrates the architecture and the sequence of interactions between the different components of the system during a successful payment.

```mermaid
sequenceDiagram
    participant User
    participant React Frontend <br> (Client)
    participant Node.js Backend <br> (Server)
    participant Supabase DB <br> (PostgreSQL)
    participant Razorpay Servers

    %% --- Initial Product Load ---
    User->>React Frontend: Loads the page
    React Frontend->>Node.js Backend: GET /api/products
    Node.js Backend->>Supabase DB: SELECT * FROM products;
    Supabase DB-->>Node.js Backend: Returns product list
    Node.js Backend-->>React Frontend: Sends product list as JSON
    React Frontend->>User: Renders product gallery

    %% --- User Initiates Payment ---
    User->>React Frontend: Clicks "Pay Now" on a product
    React Frontend->>Node.js Backend: POST /api/payments/create-order (with productId)
    Note over Node.js Backend: Fetches price from DB using productId
    Node.js Backend->>Razorpay Servers: Create Order Request (with API Keys)
    Razorpay Servers-->>Node.js Backend: Returns official `order_id`
    Note over Node.js Backend: Logs a 'pending' order to the Supabase DB
    Node.js Backend-->>React Frontend: Sends back the `order_id`
    
    %% --- Razorpay Modal and Payment ---
    React Frontend->>User: Opens Razorpay Modal with `order_id`
    User->>Razorpay Servers: Enters payment details directly
    Razorpay Servers-->>React Frontend: Calls `handler` function with payment `response`

    %% --- Final Verification Step ---
    React Frontend->>Node.js Backend: POST /api/payments/verify-payment (with signature & IDs)
    Note over Node.js Backend: Verifies signature with SECRET KEY
    Note over Node.js Backend: If signature matches, payment is authentic
    Node.js Backend->>Supabase DB: UPDATE orders SET status = 'succeeded', etc.
    Supabase DB-->>Node.js Backend: Confirmation of update
    Node.js Backend-->>React Frontend: Sends success confirmation ({success: true})
    React Frontend->>User: Displays "Payment Succeeded!" message