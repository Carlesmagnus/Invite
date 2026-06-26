import { useEffect, useState } from "react";
import { motion } from "motion/react";

interface Petal {
  id: number;
  x: number;
  size: number;
  delay: number;
  duration: number;
  rotate: number;
  color: string;
}

export default function FallingPetals() {
  const [petals, setPetals] = useState<Petal[]>([]);

  useEffect(() => {
    // Generate 25 petals with random properties
    const newPetals = Array.from({ length: 25 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100, // percentage of screen width
      size: Math.random() * 12 + 8, // 8px to 20px
      delay: Math.random() * 8, // staggered start
      duration: Math.random() * 8 + 6, // 6s to 14s fall time
      rotate: Math.random() * 360,
      color: i % 2 === 0 ? "#B76E79" : "#E5B1A1", // brand-accent (rose) & brand-peach
    }));
    setPetals(newPetals);
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
      {petals.map((petal) => (
        <motion.div
          key={petal.id}
          className="absolute rounded-full"
          style={{
            left: `${petal.x}%`,
            width: petal.size,
            height: petal.size * 0.75, // petal shape
            backgroundColor: petal.color,
            opacity: Math.random() * 0.4 + 0.15,
            transformOrigin: "center",
          }}
          initial={{ y: -50, x: `${petal.x}%`, rotate: petal.rotate }}
          animate={{
            y: "110vh",
            x: [
              `${petal.x}%`,
              `${petal.x + (Math.random() * 15 - 7.5)}%`,
              `${petal.x + (Math.random() * 20 - 10)}%`,
              `${petal.x}%`
            ],
            rotate: petal.rotate + 720,
          }}
          transition={{
            duration: petal.duration,
            repeat: Infinity,
            delay: petal.delay,
            ease: "linear",
          }}
        />
      ))}
    </div>
  );
}
