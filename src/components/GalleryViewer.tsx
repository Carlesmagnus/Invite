import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronLeft, ChevronRight, Maximize2, ZoomIn, ZoomOut, RotateCcw, X } from "lucide-react";

interface GalleryViewerProps {
  images: string[];
}

export default function GalleryViewer({ images }: GalleryViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [zoomScale, setZoomScale] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });

  const nextImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % images.length);
    resetZoom();
  };

  const prevImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    resetZoom();
  };

  const resetZoom = () => {
    setZoomScale(1);
    setPanOffset({ x: 0, y: 0 });
  };

  const handleZoomIn = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setZoomScale((prev) => Math.min(prev + 0.5, 3));
  };

  const handleZoomOut = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setZoomScale((prev) => Math.max(prev - 0.5, 1));
    if (zoomScale <= 1.5) {
      setPanOffset({ x: 0, y: 0 });
    }
  };

  // Dynamic drag constraints when zoomed in
  const getDragConstraints = () => {
    if (zoomScale <= 1) return { top: 0, bottom: 0, left: 0, right: 0 };
    const maxDragX = (zoomScale - 1) * 150;
    const maxDragY = (zoomScale - 1) * 200;
    return {
      top: -maxDragY,
      bottom: maxDragY,
      left: -maxDragX,
      right: maxDragX,
    };
  };

  return (
    <div className="w-full max-w-sm mx-auto my-6 px-4">
      <h3 className="text-center font-serif text-sm tracking-widest text-[#B89450] uppercase mb-4">
        Capturing Our Love
      </h3>

      {/* Main Slide Carousel container */}
      <div className="relative aspect-[4/5] bg-slate-50 border border-[#F3E5AB]/60 rounded-2xl overflow-hidden shadow-lg group">
        <motion.div
          id="gallery-carousel-track"
          className="w-full h-full cursor-grab active:cursor-grabbing relative"
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.6}
          onDragEnd={(_, info) => {
            if (info.offset.x < -60) {
              nextImage();
            } else if (info.offset.x > 60) {
              prevImage();
            }
          }}
        >
          {/* Animated Image */}
          <AnimatePresence mode="wait">
            <motion.img
              key={currentIndex}
              src={images[currentIndex]}
              alt={`Wedding Couple ${currentIndex + 1}`}
              className="w-full h-full object-cover select-none pointer-events-none"
              referrerPolicy="no-referrer"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.4 }}
            />
          </AnimatePresence>
        </motion.div>

        {/* Carousel Indicators/Dots */}
        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5 z-10">
          {images.map((_, idx) => (
            <button
              key={idx}
              id={`gallery-dot-${idx}`}
              onClick={() => {
                setCurrentIndex(idx);
                resetZoom();
              }}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                currentIndex === idx ? "w-5 bg-[#B89450]" : "w-1.5 bg-white/60"
              }`}
            />
          ))}
        </div>

        {/* Left / Right Arrow navigation overlay */}
        <button
          id="gallery-prev-arrow"
          onClick={prevImage}
          className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/75 backdrop-blur-sm flex items-center justify-center text-slate-700 shadow border border-slate-100 z-10 cursor-pointer hover:bg-white active:scale-95 transition-transform"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <button
          id="gallery-next-arrow"
          onClick={nextImage}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/75 backdrop-blur-sm flex items-center justify-center text-slate-700 shadow border border-slate-100 z-10 cursor-pointer hover:bg-white active:scale-95 transition-transform"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Maximize Lightbox overlay button */}
        <button
          id="gallery-maximize-btn"
          onClick={() => setIsOpen(true)}
          className="absolute right-3 top-3 w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white cursor-pointer hover:bg-black/60 transition-colors z-10"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      <div className="text-center mt-2.5 text-[11px] font-sans text-slate-400 italic">
        Swipe left or right to browse photos
      </div>

      {/* FULL SCREEN LIGHTBOX MODAL */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 z-50 flex flex-col justify-between p-4"
          >
            {/* Top Bar with actions */}
            <div className="flex justify-between items-center text-white z-10 pt-4">
              <span className="font-sans text-xs tracking-wider opacity-85">
                Photo {currentIndex + 1} of {images.length}
              </span>
              
              <div className="flex gap-2.5">
                <button
                  id="lightbox-zoom-out"
                  onClick={handleZoomOut}
                  className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/25 cursor-pointer"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <button
                  id="lightbox-zoom-in"
                  onClick={handleZoomIn}
                  className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/25 cursor-pointer"
                  title="Zoom In"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                {zoomScale > 1 && (
                  <button
                    id="lightbox-zoom-reset"
                    onClick={resetZoom}
                    className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/25 cursor-pointer"
                    title="Reset Zoom"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                )}
                <button
                  id="lightbox-close"
                  onClick={() => {
                    setIsOpen(false);
                    resetZoom();
                  }}
                  className="w-8 h-8 rounded-full bg-rose-500/80 flex items-center justify-center text-white hover:bg-rose-600 cursor-pointer"
                  title="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Main Interactive Zoomable Canvas image container */}
            <div className="flex-1 w-full flex items-center justify-center relative overflow-hidden select-none">
              <motion.div
                id="lightbox-drag-wrapper"
                className="w-full max-h-[80vh] flex items-center justify-center cursor-move"
                drag={zoomScale > 1}
                dragConstraints={getDragConstraints()}
                dragElastic={0.1}
                onDragEnd={() => {}}
                style={{
                  x: panOffset.x,
                  y: panOffset.y,
                }}
                onUpdate={(latest) => {
                  if (zoomScale > 1) {
                    setPanOffset({ x: Number(latest.x) || 0, y: Number(latest.y) || 0 });
                  }
                }}
              >
                <motion.img
                  src={images[currentIndex]}
                  alt={`Full View ${currentIndex + 1}`}
                  className="max-w-full max-h-[80vh] object-contain rounded-lg"
                  animate={{ scale: zoomScale }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  referrerPolicy="no-referrer"
                />
              </motion.div>

              {/* Slide Navigation Buttons Inside Modal */}
              <button
                id="lightbox-prev"
                onClick={prevImage}
                className="absolute left-2.5 w-10 h-10 rounded-full bg-black/40 flex items-center justify-center text-white cursor-pointer hover:bg-black/60 active:scale-90"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>

              <button
                id="lightbox-next"
                onClick={nextImage}
                className="absolute right-2.5 w-10 h-10 rounded-full bg-black/40 flex items-center justify-center text-white cursor-pointer hover:bg-black/60 active:scale-90"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>

            {/* Lightbox Footer caption */}
            <div className="text-center text-white/60 text-xs py-4 font-sans tracking-wide">
              {zoomScale > 1 ? (
                <span>Drag photo to navigate • Scale: {zoomScale.toFixed(1)}x</span>
              ) : (
                <span>Swipe left/right to browse • Use buttons to zoom & pan</span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
