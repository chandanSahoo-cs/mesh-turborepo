"use client";

import { format } from "date-fns";
import { motion } from "framer-motion";
import { HashIcon } from "lucide-react";

interface ChannelHeroProps {
  name: string;
  creationTime: number;
}

export const ChannelHero = ({ name, creationTime }: ChannelHeroProps) => {
  return (
    <motion.div
      className="mt-[80px] mx-6 mb-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}>
      <motion.div
        className="bg-white border-4 border-black rounded-2xl p-6 shadow-[6px_6px_0px_0px_#000000]"
        whileHover={{ scale: 1.01 }}
        transition={{ duration: 0.2 }}>
        <div className="flex items-center gap-3 mb-4">
          <motion.div
            className="bg-[#5170ff] border-4 border-black rounded-xl p-3 shadow-[4px_4px_0px_0px_#000000]"
            animate={{
              rotate: [0, 5, -5, 0],
            }}
            transition={{
              duration: 3,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}>
            <HashIcon className="size-8 text-white" />
          </motion.div>
          <h1 className="text-3xl font-mono font-black text-black uppercase tracking-wide">
            {name}
          </h1>
        </div>
        <div className="bg-[#fffce9] border-2 border-black rounded-xl p-4 shadow-[2px_2px_0px_0px_#000000]">
          <p className="font-mono font-bold text-black text-sm uppercase tracking-wide leading-relaxed">
            This channel was created on{" "}
            <span className="text-[#5170ff]">
              {format(creationTime, "MMMM do, yyyy")}
            </span>
            . This is the very beginning of the{" "}
            <span className="text-[#7ed957]">{name} channel</span>.
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
};
