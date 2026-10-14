import { Suspense } from "react";
import { OrderTracker } from "@/components/OrderTracker";

export const metadata = { title: "Your order", robots: { index: false } };

export default function OrderPage() {
  return (
    <Suspense fallback={<div className="mx-auto mt-10 h-96 w-full max-w-2xl animate-pulse rounded-2xl bg-lilac" aria-busy="true" />}>
      <OrderTracker />
    </Suspense>
  );
}
