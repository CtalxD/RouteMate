import React from "react";
import myKey from "./khaltiKey";
import axios from "axios";

interface Payload {
  token: string;
  amount: number;
  idx?: string;
  mobile?: string;
  product_identity?: string;
  product_name?: string;
  product_url?: string;
}

const KhaltiCheckout: React.FC = () => {
  const config = {
    publicKey: "6acdbced40ca42c59ef6fc69f7a3a6a8",
    productIdentity: "bus_ticket_123",
    productName: "Bus Ticket Booking",
    productUrl: "http://localhost:8081",
    eventHandler: {
      onSuccess(payload: Payload) {
        console.log("Payment successful:", payload);
        const data = {
          token: payload.token,
          amount: payload.amount,
        };

        axios
          .get(
            `https://meslaforum.herokuapp.com/khalti/${data.token}/${data.amount}/${myKey.secretKey}`
          )
          .then((response) => {
            console.log("Verification response:", response.data);
            alert("Payment successful! Thank you for your booking.");
          })
          .catch((error) => {
            console.error("Verification failed:", error);
            alert("Payment verification failed. Please contact support.");
          });
      },
      onError(error: Error) {
        console.error("Payment error:", error);
        alert("Payment failed. Please try again.");
      },
      onClose() {
        console.log("Payment widget closed");
      },
    },
    paymentPreference: ["KHALTI", "MOBILE_BANKING", "CONNECT_IPS"],
  };

  return (
    <div style={{ display: "flex", justifyContent: "center" }}>
      <button 
        style={{
          backgroundColor: "purple",
          color: "white",
          padding: "10px 20px",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer"
        }}
      >
        Pay via Khalti
      </button>
    </div>
  );
};

export default KhaltiCheckout;