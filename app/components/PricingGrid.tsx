"use client";

import CheckoutButton from "./CheckoutButton";

export default function PricingGrid({
  userId,
}: {
  userId: string | undefined;
}) {
  const plans = [
    {
      name: "100 Coins",
      price: "$1",
      id: process.env.NEXT_PUBLIC_PRICE_100_COINS,
      desc: "Quick top-up for 100 generations",
      featured: false,
    },
    {
      name: "500 Coins",
      price: "$5",
      id: process.env.NEXT_PUBLIC_PRICE_500_COINS,
      desc: "Most popular credit pack",
      featured: false,
    },
    {
      name: "Elite (Gold)",
      price: "$29/mo",
      id: process.env.NEXT_PUBLIC_PRICE_ELITE_GOLD,
      desc: "Unlimited everything & Gold Mic status",
      featured: true,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-6 p-8 md:grid-cols-3">
      {plans.map((plan) => (
        <div
          key={plan.id ?? plan.name}
          className={`rounded-2xl border p-6 ${
            plan.featured
              ? "border-yellow-500 bg-yellow-500/10"
              : "border-white/10 bg-white/5"
          }`}
        >
          <h3 className="text-xl font-bold text-white">{plan.name}</h3>
          <p className="my-2 text-3xl font-black text-white">{plan.price}</p>
          <p className="mb-6 text-sm text-gray-400">{plan.desc}</p>
          {plan.id && (
            <CheckoutButton
              priceId={plan.id}
              userId={userId}
              label="Buy Now"
              className="w-full rounded-xl bg-white py-3 font-bold text-black transition hover:bg-gray-200"
            />
          )}
        </div>
      ))}
    </div>
  );
}
