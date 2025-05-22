import React, { useState, useEffect } from "react";
import axios from "axios";

interface KhaltiProps {
  amount: number;
  onSuccess: (ticketId: string) => void;
  onError: (error: string) => void;
  style?: React.CSSProperties;
  disabled?: boolean;
  ticketId: string;
}

const Khalti: React.FC<KhaltiProps> = ({ 
  amount, 
  onSuccess, 
  onError, 
  style, 
  disabled,
  ticketId
}) => {
  const [isLoading, setIsLoading] = useState(false);

  // Check for payment verification when component mounts
  useEffect(() => {
    const verifyPayment = async (pidx: string) => {
  try {
    const verificationResponse = await axios.post(
      "http://localhost:5000/payment/verify",
      { pidx },
      {
        headers: {
          "Content-Type": "application/json"
        }
      }
    );

    if (verificationResponse.data.success) {
      // Update ticket status to PAID
      try {
        const statusResponse = await axios.patch(
          `http://localhost:5000/tickets/${ticketId}/status`,
          { paymentStatus: "PAID" },
          {
            headers: {
              "Content-Type": "application/json"
            }
          }
        );
        
        localStorage.removeItem('currentPayment');
        onSuccess(ticketId);
      } catch (updateError) {
        console.error("Failed to update ticket status:", updateError);
        onError("Payment verified but failed to update ticket status");
      }
    } else {
      onError(verificationResponse.data.message || "Payment verification failed");
    }
  } catch (error) {
    console.error("Payment verification error:", error);
    let errorMessage = "Payment verification failed. Please check your payment status.";
    
    if (axios.isAxiosError(error)) {
      errorMessage = error.response?.data?.message || error.message;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    onError(errorMessage);
  }
};
  }, [ticketId, onSuccess]);

  const initiatePayment = async () => {
  if (disabled) return;
  
  setIsLoading(true);
  
  try {
    const response = await axios.post(
      "http://localhost:5000/payment/initiate",
      {
        amount: amount,
        return_url: `${window.location.origin}/(tabs)/lists`,
        ticketId: ticketId
      },
      {
        headers: {
          "Content-Type": "application/json"
        }
      }
    );

    if (response.data.payment_url) {
      const paymentInfo = {
        amount: amount,
        timestamp: new Date().toISOString(),
        ticketId: ticketId,
        pidx: response.data.pidx
      };
      localStorage.setItem('currentPayment', JSON.stringify(paymentInfo));
      
      window.location.href = response.data.payment_url;
    }
  } catch (error) {
    console.error("Payment error:", error);
    let errorMessage = "Payment initiation failed. Please try again.";
    
    if (axios.isAxiosError(error)) {
      errorMessage = error.response?.data?.message || error.message;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    onError(errorMessage);
  } finally {
    setIsLoading(false);
  }
  };

  return (
    <div style={{ display: "flex", justifyContent: "center", ...style }}>
      <button
        style={{
          backgroundColor: "#5C2D91",
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