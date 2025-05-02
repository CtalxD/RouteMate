import React, { useState } from "react";
import axios from "axios";

interface KhaltiProps {
  payment: number;
  onSuccess: () => void;
  onError: (error: string) => void;
  style?: React.CSSProperties;
  disabled?: boolean;
}

const Khalti: React.FC<KhaltiProps> = ({ 
  payment, 
  onSuccess, 
  onError, 
  style, 
  disabled 
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const initiatePayment = async () => {
    if (disabled) return;
    
    setIsLoading(true);
    
    try {
      const response = await axios.post(
        "http://localhost:5000/payment/initiate",
        {
          amount: payment,
          return_url: `${window.location.origin}/(tabs)/lists`,
        },
        {
          headers: {
            Authorization: "6acdbced40ca42c59ef6fc69f7a3a6a8",
            "Content-Type": "application/json"
          }
        }
      );

      if (response.data.payment_url) {
        // Call onSuccess before redirecting
        onSuccess();
        window.location.href = response.data.payment_url; // Redirect to Khalti payment page
      }
    } catch (error) {
      console.error("Payment error:", error);
      onError("Payment initiation failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", justifyContent: "center", ...style }}>
      <button
        style={{
          backgroundColor: "purple",
          padding: "15px 40px",
          color: "white",
          cursor: disabled ? "not-allowed" : "pointer",
          fontWeight: "bold",
          border: "none",
          borderRadius: "5px",
          opacity: isLoading || disabled ? 0.7 : 1,
        }}
        onClick={initiatePayment}
        disabled={isLoading || disabled}
      >
        {isLoading ? "Processing..." : "Pay Now Via Khalti"}
      </button>
    </div>
  );
};

export default Khalti;