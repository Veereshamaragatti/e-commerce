# Full-Stack E-Commerce Demo

This project is a complete, full-stack e-commerce application built to demonstrate a modern web development workflow. It features a dynamic product gallery, a detailed product view, and a secure payment flow integrated with the Razorpay payment gateway.

The backend is architected using a modular, route-based system, and it connects to a cloud-based Supabase (PostgreSQL) database for persistent data storage of products and orders.

## ✨ Features

*   **Dynamic Product Gallery:** Fetches and displays product data from a cloud database.
*   **Detailed Product View:** Users can click on any product to see more details.
*   **Secure Payment Flow:** Integration with Razorpay, ensuring no sensitive payment information ever touches the server.
*   **Persistent Data:** Uses Supabase (PostgreSQL) to store product information and log all transactions.
*   **Modular Backend:** Organized Node.js/Express backend with separated routes for scalability and maintenance.
*   **Responsive Design:** A clean, 3-column grid layout that adapts to mobile and tablet screens.

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
    participant "React Frontend<br>(Client)" as Frontend
    participant "Node.js Backend<br>(Server)" as Backend
    participant "Supabase DB<br>(PostgreSQL)" as DB
    participant "Razorpay Servers" as Razorpay

    %% --- Initial Product Load ---
    User->>Frontend: Loads the page
    Frontend->>Backend: GET /api/products
    Backend->>DB: SELECT * FROM products;
    DB-->>Backend: Returns product list
    Backend-->>Frontend: Sends product list as JSON
    Frontend->>User: Renders product gallery

    %% --- User Initiates Payment ---
    User->>Frontend: Clicks "Pay Now" on a product
    Frontend->>Backend: POST /api/payments/create-order (with productId)
    Note over Backend: Fetches price from DB using productId
    Backend->>Razorpay: Create Order Request (with API Keys)
    Razorpay-->>Backend: Returns official `order_id`
    Note over Backend: Logs a 'pending' order to the Supabase DB
    Backend-->>Frontend: Sends back the `order_id`
    
    %% --- Razorpay Modal and Payment ---
    Frontend->>User: Opens Razorpay Modal with `order_id`
    User->>Razorpay: Enters payment details directly
    Razorpay-->>Frontend: Calls `handler` function with payment `response`

    %% --- Final Verification Step ---
    Frontend->>Backend: POST /api/payments/verify-payment (with signature & IDs)
    Note over Backend: Verifies signature with SECRET KEY
    Note over Backend: If signature matches, payment is authentic
    Backend->>DB: UPDATE orders SET status = 'succeeded', etc.
    DB-->>Backend: Confirmation of update
    Backend-->>Frontend: Sends success confirmation ({success: true})
    Frontend->>User: Displays "Payment Succeeded!" message