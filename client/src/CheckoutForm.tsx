import React, { useState, useEffect } from 'react';
import './CheckoutForm.css';

declare global {
  interface Window { Razorpay: any; }
}

interface Product {
    id: number;
    name: string;
    description: string;
    image_url: string;
    price_in_cents: number;
}

const CheckoutForm: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [succeeded, setSucceeded] = useState<boolean>(false);

  useEffect(() => {
    fetch('http://localhost:4242/api/products')
      .then(res => {
        if (!res.ok) {
          throw new Error(`Network response was not ok, status: ${res.status}`);
        }
        return res.json();
      })
      .then(data => setProducts(data))
      .catch((err) => {
        console.error("Fetch error:", err);
        setError("Could not fetch products from the server.");
      });
  }, []);

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
    setError(null);
    setSucceeded(false);
  };

  const handleBackToList = () => {
    setSelectedProduct(null);
  };

  const displayRazorpay = async (productId: number) => {
    setLoading(true);
    setError(null);
    setSucceeded(false);
    
    const res = await fetch('http://localhost:4242/api/payments/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId }),
    });

    if (!res.ok) {
        const err = await res.json();
        setError(err.error || 'Failed to create order.');
        setLoading(false);
        return;
    }
    
    const order = await res.json();
    
    const options = {
      key: process.env.REACT_APP_RAZORPAY_KEY_ID,
      amount: order.amount,
      currency: order.currency,
      name: 'My Awesome Store',
      description: `Payment for ${selectedProduct?.name}`,
      order_id: order.id,
      handler: async function (response: any) {
        const verificationRes = await fetch('http://localhost:4242/api/payments/verify-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(response),
        });
        const verificationData = await verificationRes.json();
        if (verificationData.success) {
            setSucceeded(true);
        } else {
            setError(verificationData.message || "Payment verification failed.");
        }
        setLoading(false);
      },
      modal: { 
        ondismiss: async () => {
          setLoading(false);
          setError("Payment was cancelled by user.");
          try {
            const cancelRes = await fetch('http://localhost:4242/api/payments/cancel-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ razorpay_order_id: order.id }),
            });
            const cancelData = await cancelRes.json();
            if (!cancelData.success) {
              console.error("Failed to update cancelled order:", cancelData.message);
            } else {
              console.log("Order cancelled successfully:", cancelData.message);
            }
          } catch (error) {
            console.error("Error updating cancelled order:", error);
          }
        }
      },
    };
    
    const paymentObject = new window.Razorpay(options);
    paymentObject.open();
  };

  const renderProductList = () => (
    <div className="product-grid">
      {products.length > 0 ? products.map(product => (
        <div key={product.id} className="product-card" onClick={() => handleProductSelect(product)}>
          <img src={product.image_url} alt={product.name} className="product-image" />
          <h3>{product.name}</h3>
          <p className="product-price">₹{product.price_in_cents / 100}</p>
        </div>
      )) : (
        !error && <p>Loading products...</p>
      )}
    </div>
  );

  const renderProductDetail = () => {
    if (!selectedProduct) return null;
    return (
      <div className="product-detail">
        <button onClick={handleBackToList} className="back-button">← Back to All Products</button>
        <img src={selectedProduct.image_url} alt={selectedProduct.name} className="product-detail-image" />
        <h2>{selectedProduct.name}</h2>
        <p className="product-detail-description">{selectedProduct.description}</p>
        <p className="product-detail-price">Price: ₹{selectedProduct.price_in_cents / 100}</p>
        {succeeded ? (
          <p className="success-message">Payment Succeeded! Thank you for your purchase.</p>
        ) : (
          <button onClick={() => displayRazorpay(selectedProduct.id)} disabled={loading} className="pay-button">
            {loading ? 'Processing…' : `Pay Now`}
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="container">
      <h1>Our Store</h1>
      {error && <div className="error-message">{error}</div>}
      {selectedProduct ? renderProductDetail() : renderProductList()}
    </div>
  );
};

export default CheckoutForm;