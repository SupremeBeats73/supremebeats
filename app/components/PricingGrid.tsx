"use client";

import CheckoutButton from "./CheckoutButton";
import Image from "next/image";

export default function PricingGrid({
  userId,
}: {
  userId: string | undefined;
}) {
  const plans = [
    {
      name: "100 Supreme Coins",
      price: "$5",
      id: process.env.NEXT_PUBLIC_PRICE_100_COINS,
      desc: "One-time top-up of 100 AI generation credits. Credits do not expire.",
      image:
        "https://files.stripe.com/links/MDB8YWNjdF8xVEFjdFoySFVZR0JaamNGfGZsX2xpdmVfblcwekdsa0o0ODVYWnhsT1lHcVRHZTJj00XP3nSMb4",
      featured: false,
    },
    {
      name: "500 Supreme Coins",
      price: "$15",
      id: process.env.NEXT_PUBLIC_PRICE_500_COINS,
      desc: "One-time top-up of 500 AI generation credits. Best value for single packs.",
      image:
        "https://files.stripe.com/links/MDB8YWNjdF8xVEFjdFoySFVZR0JaamNGfGZsX2xpdmVfbDkzWlk1Q3p0QUVMTW81c1BNNW9xYWl100n3Z2BiV0",
      featured: false,
    },
    {
      name: "1000 Supreme Coins",
      price: "$25",
      id: process.env.NEXT_PUBLIC_PRICE_1000_COINS,
      desc: "1000 AI generation credits. These credits do not expire and work for all tools.",
      image:
        "https://files.stripe.com/links/MDB8YWNjdF8xVEFjdFoySFVZR0JaamNGfGZsX2xpdmVfWVhnMVhCbWh6c1JyczZobUF0MjB3YXpl00XJqnsAJ4",
      featured: false,
    },
    {
      name: "Professional",
      price: "$19/mo",
      id: process.env.NEXT_PUBLIC_PRICE_PROFESSIONAL,
      desc: "500 monthly credits + Silver Mic reputation badge and SEO tools.",
      image:
        "https://files.stripe.com/links/MDB8YWNjdF8xVEFjdFoySFVZR0JaamNGfGZsX2xpdmVfMUI2YUl1NWVOYnNmNmttZGxENkRlb3hK00Hgy43ezw",
      featured: false,
    },
    {
      name: "Elite (Gold Mic)",
      price: "$49/mo",
      id: process.env.NEXT_PUBLIC_PRICE_ELITE_GOLD,
      desc: "Unlimited AI generation, high-fidelity stems, and identity-verified Gold Mic status.",
      image:
        "https://files.stripe.com/links/MDB8YWNjdF8xVEFjdFoySFVZR0JaamNGfGZsX2xpdmVfTldIeHhncmJIa0tmYWVOcnNsejF1WmNI00nomDA0AI",
      featured: true,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 lg:grid-cols-5">
      {plans.map((plan) => (
        <div
          key={plan.id ?? plan.name}
          className={`relative flex flex-col items-center rounded-3xl border p-6 transition-all hover:scale-[1.02] ${
            plan.featured
              ? "z-10 border-yellow-500 bg-gradient-to-b from-yellow-500/20 to-black shadow-[0_0_30px_-10px_rgba(234,179,8,0.3)] lg:scale-105"
              : "border-white/10 bg-white/5 hover:border-white/20"
          }`}
        >
          {plan.featured && (
            <span className="absolute -top-3 rounded-full bg-yellow-500 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-black shadow-lg">
              Most Elite
            </span>
          )}

          <div className="relative mb-4 h-24 w-24">
            <Image
              src={plan.image}
              alt={plan.name}
              fill
              className="object-contain"
              unoptimized
            />
          </div>

          <h3 className="flex h-12 items-center text-center text-lg font-bold leading-tight text-white">
            {plan.name}
          </h3>
          <p className="mb-3 mt-1 text-2xl font-black text-white">{plan.price}</p>
          <p className="mb-6 flex-grow text-center text-xs leading-relaxed text-gray-400">
            {plan.desc}
          </p>

          {plan.id && (
            <CheckoutButton
              priceId={plan.id}
              userId={userId}
              label={
                plan.featured
                  ? "Go Gold Mic"
                  : plan.id.includes("coin")
                    ? "Buy Coins"
                    : "Upgrade"
              }
              className={`w-full rounded-xl py-3 text-sm font-black transition-all ${
                plan.featured
                  ? "bg-yellow-500 text-black hover:bg-yellow-400"
                  : "bg-white text-black hover:bg-gray-200"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}
