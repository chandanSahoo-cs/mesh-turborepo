"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

const FloatingShape = ({
  delay = 0,
  duration = 4,
  size = 40,
  color = "#5170ff",
  shape = "square",
  initialX = 0,
  initialY = 0,
}: {
  delay?: number;
  duration?: number;
  size?: number;
  color?: string;
  shape?: "square" | "circle" | "triangle";
  initialX?: number;
  initialY?: number;
}) => {
  const shapeStyles = {
    square: "rounded-xl",
    circle: "rounded-full",
    triangle: "rounded-lg",
  };

  return (
    <motion.div
      className={`absolute border-4 border-black shadow-[4px_4px_0px_0px_#000000] ${shapeStyles[shape]}`}
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        left: initialX,
        top: initialY,
      }}
      animate={{
        y: [0, -30, 0],
        x: [0, 20, -10, 0],
        rotate: [0, 180, 360],
      }}
      transition={{
        duration: duration,
        repeat: Number.POSITIVE_INFINITY,
        delay: delay,
        ease: "easeInOut",
      }}
    />
  );
};

export const BackgroundAnimations = () => {
  const [windowSize, setWindowSize] = useState({ width: 800, height: 600 });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    // Set once on mount
    handleResize();

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Top left area */}
      <FloatingShape
        delay={0}
        duration={6}
        size={60}
        color="#5170ff"
        shape="square"
        initialX={50}
        initialY={80}
      />
      <FloatingShape
        delay={1}
        duration={8}
        size={40}
        color="#7ed957"
        shape="circle"
        initialX={120}
        initialY={150}
      />

      {/* Top right area */}
      <FloatingShape
        delay={2}
        duration={7}
        size={50}
        color="#7ed957"
        shape="triangle"
        initialX={windowSize?.width - 150 || 800}
        initialY={100}
      />
      <FloatingShape
        delay={0.5}
        duration={9}
        size={35}
        color="#5170ff"
        shape="circle"
        initialX={windowSize?.width - 80 || 900}
        initialY={200}
      />

      {/* Bottom left area */}
      <FloatingShape
        delay={3}
        duration={5}
        size={45}
        color="#5170ff"
        shape="square"
        initialX={80}
        initialY={windowSize?.height - 200 || 600}
      />
      <FloatingShape
        delay={1.5}
        duration={6}
        size={55}
        color="#7ed957"
        shape="triangle"
        initialX={30}
        initialY={windowSize?.height - 120 || 700}
      />

      {/* Bottom right area */}
      <FloatingShape
        delay={2.5}
        duration={8}
        size={40}
        color="#7ed957"
        shape="circle"
        initialX={windowSize?.width - 120 || 850}
        initialY={windowSize?.height - 180 || 650}
      />
      <FloatingShape
        delay={4}
        duration={7}
        size={50}
        color="#5170ff"
        shape="square"
        initialX={windowSize?.width - 200 || 750}
        initialY={windowSize?.height - 100 || 750}
      />

      {/* Center floating elements */}
      <FloatingShape
        delay={1.8}
        duration={10}
        size={25}
        color="#5170ff"
        shape="circle"
        initialX={windowSize?.width / 2 - 200 || 400}
        initialY={windowSize?.height / 2 - 100 || 300}
      />
      <FloatingShape
        delay={3.2}
        duration={9}
        size={30}
        color="#7ed957"
        shape="triangle"
        initialX={windowSize?.width / 2 + 150 || 600}
        initialY={windowSize?.height / 2 + 80 || 400}
      />
    </div>
  );
};
