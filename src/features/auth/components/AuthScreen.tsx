"use client";

import { BackgroundAnimations } from "@/components/BackgroundAnimations";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import type { SignInFlow } from "../types";
import { SignInCard } from "./SignInCard";
import { SignUpCard } from "./SignUpCard";

export const AuthScreen = () => {
  const [authState, setAuthState] = useState<SignInFlow>("signIn");

  return (
    <div className="h-full flex items-center justify-center bg-[#fffce9] p-4 relative">
      <BackgroundAnimations />

      <div className="md:h-auto md:w-[420px] w-full relative z-10">
        <AnimatePresence mode="wait">
          {authState === "signIn" ? (
            <motion.div
              key="signin"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}>
              <SignInCard setAuthState={setAuthState} />
            </motion.div>
          ) : (
            <motion.div
              key="signup"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}>
              <SignUpCard setAuthState={setAuthState} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
