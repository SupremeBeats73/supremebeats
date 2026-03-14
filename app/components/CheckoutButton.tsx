"use client";

import { useState } from "react";
import { createCheckoutSession } from "../actions/stripe";

interface Props {
  priceId: string;
  userId: string | undefined;
  label: string;
  className?: string;
}

export default function CheckoutButton({
  priceId,
  userId,
  label,
  className,
}: Props) {
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    if (!userId) {
      alert("Please log in to make a purchase.");
      return;
    }

    setLoading(true);
    try {
      const { url } = await createCheckoutSession(priceId, userId);
      if (url) window.location.href = url;
    } catch (err) {
      console.error(err);
      alert("Payment failed to initialize.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCheckout}
      disabled={loading}
      className={`${className ?? ""} disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      {loading ? "Processing…" : label}
    </button>
  );
}
