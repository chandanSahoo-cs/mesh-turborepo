import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";

import React, { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";

interface EmojiPopoverProps {
  children: React.ReactNode;
  hint?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onEmojiSelect: (emoji: any) => void;
}

export const EmojiPopover = ({
  children,
  hint = "Emoji",
  onEmojiSelect,
}: EmojiPopoverProps) => {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [tooltipOpen, setTooltipOpen] = useState(false);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onSelect = (emoji: any) => {
    onEmojiSelect(emoji);
    setPopoverOpen(false);

    setTimeout(() => {
      setTooltipOpen(false);
    }, 500);
  };
  return (
    <TooltipProvider>
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <Tooltip
          open={tooltipOpen}
          onOpenChange={setTooltipOpen}
          delayDuration={50}>
          <PopoverTrigger asChild>
            <TooltipTrigger asChild>{children}</TooltipTrigger>
          </PopoverTrigger>
          <TooltipContent className="bg-black text-white border-2 border-white font-mono font-bold text-xs uppercase tracking-wide rounded-lg shadow-[2px_2px_0px_0px_#ffffff]">
            <p className="font-medium text-xs">{hint}</p>
          </TooltipContent>
        </Tooltip>
        <PopoverContent className="p-0 w-full border-none shadow-none">
          <Picker
            data={data}
            onEmojiSelect={onSelect}
            theme="light"
          />
        </PopoverContent>
      </Popover>
    </TooltipProvider>
  );
};
