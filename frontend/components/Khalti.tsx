import React, { useState } from "react";
import axios from "axios";

interface KhaltiProps {
  payment: number;
}

const Khalti: React.FC<KhaltiProps> = ({ payment }) => {
  const [isLoading, setIsLoading] = useState(false);

  const initiatePayment = async () => {
    setIsLoading(true);
    
    try {
      const response = await axios.post(
        "http://localhost:5000/payment/initiate",
        {
          amount: payment,
          return_url: `${window.location.origin}/lists`,
        },
        {
          headers: {
            Authorization: "6acdbced40ca42c59ef6fc69f7a3a6a8",
            "Content-Type": "application/json"
          }
        }
      );

      if (response.data.payment_url) {
        window.location.href = response.data.payment_url; // Redirect to Khalti payment page
      }
    } catch (error) {
      console.error("Payment error:", error);
      alert("Payment initiation failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", justifyContent: "center" }}>
      <button
        style={{
          backgroundColor: "purple",
          padding: "15px 40px",
          color: "white",
          cursor: "pointer",
          fontWeight: "bold",
          border: "none",
          borderRadius: "5px",
          opacity: isLoading ? 0.7 : 1,
        }}
        onClick={initiatePayment}
        disabled={isLoading}
      >
        {isLoading ? "Processing..." : "Pay Now Via Khalti"}
      </button>
    </div>
  );
};

export default Khalti;
