"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProductGalleryProps {
  images: string[];
  productName?: string;
}

export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
  const [isHovering, setIsHovering] = useState(false);
  const [failedImages, setFailedImages] = useState<Set<number>>(new Set());

  const displayImages = images.length > 0 ? images : [];
  const hasImages = displayImages.length > 0;

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      setMousePos({ x, y });
    },
    []
  );

  const handleImageError = (index: number) => {
    setFailedImages((prev) => new Set(prev).add(index));
  };

  const isImageFailed = (index: number) => failedImages.has(index);
  const canNavigate = displayImages.length > 1;

  const goPrev = () => {
    if (!canNavigate) return;
    setActiveIndex((prev) => (prev === 0 ? displayImages.length - 1 : prev - 1));
  };

  const goNext = () => {
    if (!canNavigate) return;
    setActiveIndex((prev) => (prev === displayImages.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="space-y-4 w-full max-w-none">
      {/* Main image area */}
      <div
        ref={containerRef}
        className="relative group rounded-2xl overflow-hidden shadow-medium bg-white"
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <div className="relative aspect-square max-h-[520px] lg:max-h-[600px] overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeIndex}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className={cn(
                "absolute inset-0",
                hasImages && !isImageFailed(activeIndex) && isHovering && "cursor-zoom-in"
              )}
              style={
                hasImages && !isImageFailed(activeIndex) && isHovering
                  ? {
                      transform: `scale(1.5) translate(${(mousePos.x - 0.5) * -20}%, ${(mousePos.y - 0.5) * -20}%)`,
                      transformOrigin: `${mousePos.x * 100}% ${mousePos.y * 100}%`,
                    }
                  : undefined
              }
            >
              {hasImages && !isImageFailed(activeIndex) ? (
                <Image
                  src={displayImages[activeIndex]}
                  alt={productName || "Termék"}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="absolute inset-0 w-full h-full object-contain p-4"
                  onError={() => handleImageError(activeIndex)}
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary-pale/30 to-secondary/20 flex items-center justify-center">
                  <span className="text-6xl text-primary/30">
                    {(productName || "B").charAt(0)}
                  </span>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {hasImages && (
          <div className="absolute bottom-3 right-3 badge bg-neutral-dark/80 text-white backdrop-blur-sm">
            {activeIndex + 1}/{displayImages.length}
          </div>
        )}
        {canNavigate && (
          <>
            <button
              type="button"
              onClick={goPrev}
              className="absolute left-3 top-1/2 -translate-y-1/2 z-20 inline-flex size-10 items-center justify-center rounded-full border border-white/70 bg-white/90 text-neutral-dark shadow-sm backdrop-blur transition hover:bg-white"
              aria-label="Előző termékkép"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              type="button"
              onClick={goNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-20 inline-flex size-10 items-center justify-center rounded-full border border-white/70 bg-white/90 text-neutral-dark shadow-sm backdrop-blur transition hover:bg-white"
              aria-label="Következő termékkép"
            >
              <ChevronRight className="size-5" />
            </button>
          </>
        )}
      </div>

      {/* Thumbnail row */}
      {displayImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {displayImages.slice(0, 6).map((img, idx) => (
            <motion.button
              key={idx}
              type="button"
              onClick={() => setActiveIndex(idx)}
              className={cn(
                "flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden border-2 transition-all duration-200 bg-white relative",
                activeIndex === idx
                  ? "border-primary shadow-soft ring-2 ring-primary/30"
                  : "border-transparent hover:border-neutral-medium/30"
              )}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {!isImageFailed(idx) ? (
                <Image
                  src={img}
                  alt={`${productName || "Termék"} - ${idx + 1}`}
                  fill
                  sizes="80px"
                  className="w-full h-full object-contain p-1"
                  onError={() => handleImageError(idx)}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/10 to-primary-pale/30 flex items-center justify-center">
                  <span className="text-xs text-primary/40">{idx + 1}</span>
                </div>
              )}
            </motion.button>
          ))}
        </div>
      )}

      {/* Mobile dots */}
      {displayImages.length > 1 && (
        <div className="flex gap-2 justify-center md:hidden">
          {displayImages.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setActiveIndex(idx)}
              className={cn(
                "w-2 h-2 rounded-full transition-all duration-200",
                activeIndex === idx
                  ? "bg-primary w-6"
                  : "bg-neutral-medium/40 hover:bg-neutral-medium/60"
              )}
              aria-label={`Kép ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
