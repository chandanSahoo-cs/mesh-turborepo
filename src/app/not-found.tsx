"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { ArrowLeft, AlertTriangle, Home } from "lucide-react"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#fffce9] flex items-center justify-center p-4">
      <motion.div
        className="max-w-md w-full text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* 404 Display */}
        <motion.div
          className="relative mb-8"
          animate={{
            rotate: [0, 1, -1, 0],
          }}
          transition={{
            duration: 4,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
        >
          <div className="bg-white border-8 border-black p-8 mx-auto w-fit shadow-[8px_8px_0px_0px_#000000] rounded-3xl">
            <motion.div
              className="flex items-center justify-center gap-2 mb-4"
              animate={{
                color: ["#000000", "#5170ff", "#7ed957", "#000000"],
              }}
              transition={{
                duration: 3,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
              }}
            >
              <AlertTriangle size={32} strokeWidth={3} />
            </motion.div>
            <h1 className="text-6xl font-mono font-black text-black tracking-tighter">404</h1>
          </div>
        </motion.div>

        {/* Error Message */}
        <motion.div
          className="bg-white border-4 border-black p-6 mb-6 shadow-[6px_6px_0px_0px_#000000] rounded-2xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-xl font-mono font-bold text-black mb-2 uppercase tracking-wide">Page Not Found</h2>
          <p className="text-gray-700 font-mono text-sm leading-relaxed">
            Oops! The page you're looking for seems to have wandered off into the digital void.
          </p>
        </motion.div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-4">
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Link
              href="/"
              className="flex items-center justify-center gap-2 bg-[#5170ff] text-white font-mono font-bold py-3 px-6 border-4 border-black uppercase tracking-wide transition-all hover:bg-[#4060ef] shadow-[4px_4px_0px_0px_#000000] hover:shadow-[6px_6px_0px_0px_#000000] rounded-xl"
            >
              <Home size={18} strokeWidth={3} />
              Go Home
            </Link>
          </motion.div>

          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Link
              href="/about"
              className="flex items-center justify-center gap-2 bg-[#7ed957] text-black font-mono font-bold py-3 px-6 border-4 border-black uppercase tracking-wide transition-all hover:bg-[#6ec947] shadow-[4px_4px_0px_0px_#000000] hover:shadow-[6px_6px_0px_0px_#000000] rounded-xl"
            >
              <ArrowLeft size={18} strokeWidth={3} />
              Go Back
            </Link>
          </motion.div>
        </div>

        {/* Decorative Elements */}
        <div className="flex justify-center gap-3 mt-8">
          {[0, 1, 2].map((index) => (
            <motion.div
              key={index}
              className="w-4 h-4 border-3 border-black shadow-[2px_2px_0px_0px_#000000] rounded-lg"
              animate={{
                backgroundColor: ["#000000", "#5170ff", "#7ed957", "#000000"],
              }}
              transition={{
                duration: 2.5,
                repeat: Number.POSITIVE_INFINITY,
                delay: index * 0.4,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>

        {/* Additional floating element */}
        <motion.div
          className="absolute top-10 right-10 w-8 h-8 bg-[#5170ff] border-3 border-black rounded-xl"
          animate={{
            y: [0, -10, 0],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 4,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
        />

        <motion.div
          className="absolute bottom-10 left-10 w-6 h-6 bg-[#7ed957] border-3 border-black rounded-lg"
          animate={{
            y: [0, 10, 0],
            rotate: [0, -180, -360],
          }}
          transition={{
            duration: 3,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
        />
      </motion.div>
    </div>
  )
}
