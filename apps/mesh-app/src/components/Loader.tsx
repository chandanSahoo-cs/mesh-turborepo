"use client"

import { motion } from "framer-motion"

interface LoaderProps {
  message?: string
}

export function Loader({ message = "Loading..." }: LoaderProps) {
  return (
    <motion.div
      className="fixed inset-0 bg-[#fffce9] flex items-center justify-center z-100"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex flex-col items-center justify-center gap-4">
        {/* Pulsing blocks */}
        <div className="flex gap-4">
          {[0, 1, 2].map((index) => (
            <motion.div
              key={index}
              className="w-12 h-12 border-4 border-black bg-white rounded-xl shadow-[4px_4px_0px_0px_#000000]"
              animate={{
                scale: [1, 1.2, 1],
                backgroundColor: ["#ffffff", "#5170ff", "#7ed957", "#ffffff"],
              }}
              transition={{
                duration: 1.5,
                repeat: Number.POSITIVE_INFINITY,
                delay: index * 0.2,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>
        {message && (
          <motion.p
            className="text-sm font-mono text-gray-700 tracking-wide uppercase"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{
              duration: 1.5,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          >
            {message}
          </motion.p>
        )}
      </div>
    </motion.div>
  )
}

