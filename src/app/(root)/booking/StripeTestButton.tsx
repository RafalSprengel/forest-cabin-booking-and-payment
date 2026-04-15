"use client";

import { createCheckoutSession } from "@/actions/stripe";

export default function StripeTestButton() {
  const handleTestPayment = async () => {
    try {
      await createCheckoutSession("TEST-123", 500);
    } catch (error) {
      console.error("Payment failed:", error);
      alert("Error starting payment");
    }
  };

  return (
    <button 
      onClick={handleTestPayment}
      style={{
        padding: "12px 24px",
        backgroundColor: "#635bff",
        color: "white",
        border: "none",
        borderRadius: "4px",
        cursor: "pointer",
        fontSize: "16px",
        fontWeight: "bold"
      }}
    >
      Testuj płatność (500 PLN)
    </button>
  );
}