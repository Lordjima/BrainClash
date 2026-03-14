import React, { useEffect, useMemo } from 'react';
import { motion } from 'motion/react';

export default function SpaceBackground() {
  // Generate random stars
  const stars = useMemo(() => {
    return Array.from({ length: 150 }).map((_, i) => ({
      id: i,
      size: Math.random() * 2 + 1,
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      delay: Math.random() * 5,
      duration: Math.random() * 3 + 2,
    }));
  }, []);

  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden bg-[#020205]">
      {/* Deep Space Gradients (Nebulae) */}
      <motion.div 
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
          x: [0, 50, 0],
          y: [0, 30, 0],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "linear"
        }}
        className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-primary-900/20 blur-[120px]"
      />
      <motion.div 
        animate={{
          scale: [1.2, 1, 1.2],
          opacity: [0.2, 0.4, 0.2],
          x: [0, -40, 0],
          y: [0, -20, 0],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear"
        }}
        className="absolute bottom-[-10%] right-[-10%] w-[70%] h-[70%] rounded-full bg-primary-900/20 blur-[150px]"
      />
      <motion.div 
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.1, 0.3, 0.1],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "linear"
        }}
        className="absolute top-[20%] right-[10%] w-[40%] h-[40%] rounded-full bg-accent-900/10 blur-[100px]"
      />

      {/* Stars */}
      {stars.map((star) => (
        <motion.div
          key={star.id}
          initial={{ opacity: 0.2, scale: 1 }}
          animate={{ 
            opacity: [0.2, 1, 0.2],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: star.duration,
            repeat: Infinity,
            delay: star.delay,
            ease: "easeInOut"
          }}
          className="absolute rounded-full bg-white shadow-[0_0_5px_rgba(255,255,255,0.8)]"
          style={{
            width: star.size,
            height: star.size,
            top: star.top,
            left: star.left,
          }}
        />
      ))}

      {/* Shooting Stars */}
      <div className="absolute inset-0 pointer-events-none">
        <ShootingStar delay={2} />
        <ShootingStar delay={8} />
        <ShootingStar delay={15} />
      </div>

      {/* Subtle Grid Overlay */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.05] pointer-events-none mix-blend-overlay" />
      
      {/* Distant Galaxy Clusters */}
      <div className="absolute top-[40%] left-[20%] w-[30%] h-[30%] rounded-full bg-indigo-900/10 blur-[100px] animate-pulse" />
      <div className="absolute bottom-[30%] left-[60%] w-[25%] h-[25%] rounded-full bg-emerald-900/5 blur-[80px] animate-pulse" />
    </div>
  );
}

function ShootingStar({ delay }: { delay: number }) {
  return (
    <motion.div
      initial={{ x: "-10%", y: "20%", opacity: 0, scale: 0 }}
      animate={{
        x: ["0%", "150%"],
        y: ["20%", "80%"],
        opacity: [0, 1, 0],
        scale: [0, 1, 0],
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        repeatDelay: 10 + Math.random() * 10,
        delay: delay,
        ease: "easeIn"
      }}
      className="absolute w-[100px] h-[1px] bg-gradient-to-r from-transparent via-white to-transparent rotate-[-35deg]"
    />
  );
}
