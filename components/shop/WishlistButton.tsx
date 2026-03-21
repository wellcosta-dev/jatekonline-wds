"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWishlistStore } from "@/store/wishlistStore";

interface WishlistButtonProps {
  productId: string;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "p-2 size-9",
  md: "p-2.5 size-11",
  lg: "p-3 size-12",
};

const iconSizes = {
  sm: "size-4",
  md: "size-5",
  lg: "size-6",
};

export function WishlistButton({ productId, size = "md" }: WishlistButtonProps) {
  const items = useWishlistStore((s) => s.items);
  const toggleItem = useWishlistStore((s) => s.toggleItem);
  const isWishlisted = useMemo(() => items.includes(productId), [items, productId]);

  const [popKey, setPopKey] = useState(0);
  const handleToggle = () => {
    toggleItem(productId);
    const nextWishlist = useWishlistStore.getState().items;
    // Persist immediately for authenticated users; ignore errors for guests.
    fetch("/api/account/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "wishlist", wishlist: nextWishlist }),
    }).catch(() => undefined);
    setPopKey((k) => k + 1);
  };

  const tooltipText = isWishlisted ? "Eltávolítás" : "Kívánságlistára";

  return (
    <div className="relative group">
      <motion.button
        key={popKey}
        type="button"
        onClick={handleToggle}
        className={cn(
          "rounded-full border-2 border-neutral-medium/20 bg-white text-neutral-medium",
          "hover:border-secondary/50 hover:text-secondary transition-colors",
          "focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:ring-offset-2",
          sizeClasses[size]
        )}
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 15 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label={tooltipText}
      >
        <Heart
          className={cn(
            iconSizes[size],
            "transition-colors",
            isWishlisted && "fill-secondary text-secondary"
          )}
        />
      </motion.button>

      {/* Tooltip */}
      <div
        className={cn(
          "absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5",
          "bg-neutral-dark text-white text-xs font-medium rounded-lg",
          "opacity-0 group-hover:opacity-100 transition-opacity duration-200",
          "pointer-events-none whitespace-nowrap"
        )}
      >
        {tooltipText}
      </div>
    </div>
  );
}
