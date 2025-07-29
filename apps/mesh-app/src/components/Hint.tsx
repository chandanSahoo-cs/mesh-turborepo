"use client"

import type React from "react"

import { TooltipContent, Tooltip, TooltipProvider, TooltipTrigger } from "./ui/tooltip"

interface HintProps {
  label: string
  children: React.ReactNode
  side?: "top" | "right" | "bottom" | "left"
  align?: "start" | "center" | "end"
}

export const Hint = ({ label, children, side, align }: HintProps) => {
  return (
    <TooltipProvider>
      <Tooltip delayDuration={50}>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent
          side={side}
          align={align}
          className="bg-black text-white border-2 border-white font-mono font-bold text-xs uppercase tracking-wide rounded-lg shadow-[2px_2px_0px_0px_#ffffff] max-w-xs"
        >
          <p>{label}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
