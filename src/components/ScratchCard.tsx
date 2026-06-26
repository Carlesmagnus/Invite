import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles } from "lucide-react";

interface ScratchCardProps {
  dateStr: string;
  timeStr: string;
  venueName: string;
  venueAddress: string;
}

export default function ScratchCard({
  dateStr,
  timeStr,
  venueName,
  venueAddress,
}: ScratchCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isScratched, setIsScratched] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [scratchPercent, setScratchPercent] = useState(0);

  // Initialize Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas dimensions to match container
    const resizeCanvas = () => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        // High-DPI canvas resolution
        const dpr = window.devicePixelRatio || 1;
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        canvas.style.width = `${rect.width}px`;
        canvas.style.height = `${rect.height}px`;
        ctx.scale(dpr, dpr);

        drawScratchOverlay(ctx, rect.width, rect.height);
      }
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    return () => window.removeEventListener("resize", resizeCanvas);
  }, []);

  const drawScratchOverlay = (
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number
  ) => {
    // Elegant luxury Gold-Rose-Gold gradient overlay
    const gradient = ctx.createLinearGradient(0, 0, w, h);
    gradient.addColorStop(0, "#D4AF37"); // brand-gold
    gradient.addColorStop(0.3, "#FCFAF5"); // brand-bg
    gradient.addColorStop(0.7, "#E5B1A1"); // brand-peach
    gradient.addColorStop(1, "#B76E79"); // brand-accent (rose)

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);

    // Decorative geometric double frame border in gold
    ctx.strokeStyle = "rgba(212, 175, 55, 0.4)";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(8, 8, w - 16, h - 16);
    
    ctx.strokeStyle = "rgba(183, 110, 121, 0.2)";
    ctx.lineWidth = 1;
    ctx.strokeRect(12, 12, w - 24, h - 24);

    // Add some luxury text
    ctx.font = 'normal bold 14px "Playfair Display", "Georgia", serif';
    ctx.fillStyle = "#4A3728"; // brand-text
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("SCRATCH WITH FINGER", w / 2, h / 2 - 12);
    
    ctx.font = 'italic 11px "Inter", "sans-serif"';
    ctx.fillStyle = "#B76E79"; // brand-accent
    ctx.fillText("✨ To Reveal Date & Venue ✨", w / 2, h / 2 + 12);
  };

  const getCoordinates = (e: MouseEvent | TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    
    // Check if Touch Event
    if ("touches" in e) {
      if (e.touches.length === 0) return { x: 0, y: 0 };
      const touch = e.touches[0];
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };
    } else {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (isScratched) return;
    setIsDrawing(true);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { x, y } = getCoordinates(e.nativeEvent);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.globalCompositeOperation = "destination-out";
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.lineWidth = 32; // thick scratch-brush for mobile fingers
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || isScratched) return;
    e.preventDefault();

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { x, y } = getCoordinates(e.nativeEvent);
    ctx.lineTo(x, y);
    ctx.stroke();

    // Debounce state checks for performance
    if (Math.random() < 0.1) {
      checkScratchPercentage();
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    checkScratchPercentage();
  };

  const checkScratchPercentage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.width;
    const height = canvas.height;
    
    try {
      const imgData = ctx.getImageData(0, 0, width, height);
      const pixels = imgData.data;
      let transparentPixels = 0;

      // Sample pixels to save CPU on mobile (every 8th pixel)
      for (let i = 0; i < pixels.length; i += 32) {
        // Pixel alpha value is index + 3
        if (pixels[i + 3] === 0) {
          transparentPixels++;
        }
      }

      const totalSampled = pixels.length / 32;
      const percent = (transparentPixels / totalSampled) * 100;
      setScratchPercent(percent);

      if (percent > 45) {
        setIsScratched(true);
      }
    } catch (e) {
      console.error("Error reading canvas data:", e);
    }
  };

  return (
    <div className="relative w-full max-w-sm mx-auto my-6 px-4">
      <h3 className="text-center font-serif text-sm tracking-widest text-brand-gold uppercase mb-3">
        Special Revelation
      </h3>
      
      <div
        ref={containerRef}
        id="scratch-card-container"
        className="relative h-44 w-full bg-brand-cream border border-brand-gold/30 rounded-xl shadow-md overflow-hidden flex flex-col justify-center items-center p-6 text-center"
      >
        {/* Underneath Revealed Content */}
        <div className="w-full flex flex-col justify-center items-center gap-1.5 z-0 select-none">
          <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest text-brand-accent font-semibold bg-brand-bg px-2.5 py-1 rounded border border-brand-peach/25">
            <Sparkles className="w-3.5 h-3.5 text-brand-gold animate-pulse" /> Save the Date
          </span>
          <p className="font-serif text-lg font-bold text-brand-text leading-tight">
            {dateStr}
          </p>
          <p className="font-sans text-xs font-semibold text-brand-gold tracking-wider">
            ⏰ {timeStr}
          </p>
          <div className="w-full h-[1px] bg-brand-gold/10 my-1" />
          <p className="font-serif text-xs font-bold text-brand-text">
            {venueName}
          </p>
          <p className="font-sans text-[10px] text-brand-text/80 max-w-[280px] leading-snug">
            {venueAddress}
          </p>
        </div>

        {/* Scratchable Canvas Overlay */}
        <AnimatePresence>
          {!isScratched && (
            <motion.canvas
              ref={canvasRef}
              id="scratch-canvas"
              className="absolute inset-0 z-20 cursor-pointer touch-none"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Helper text */}
      <div className="text-center mt-2.5">
        {!isScratched ? (
          <span className="text-[11px] font-sans text-brand-text/60 italic">
            Rub above with your finger ({Math.round(scratchPercent)}% cleared)
          </span>
        ) : (
          <motion.span
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs font-sans text-brand-accent font-semibold inline-flex items-center gap-1"
          >
            ✓ Successfully revealed! See you there! 🌸
          </motion.span>
        )}
      </div>
    </div>
  );
}
