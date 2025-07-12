import { Hint } from "@/components/Hint";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PlusIcon } from "lucide-react";
import { FaCaretDown } from "react-icons/fa";

import { useToggle } from "react-use";

interface ServerSectionProps {
  children: React.ReactNode;
  label: string;
  hint: string;
  onNew?: () => void;
}

export const ServerSection = ({
  children,
  label,
  hint,
  onNew,
}: ServerSectionProps) => {
  const [on, toggle] = useToggle(true);

  return (
    <div className="flex flex-col mt-3 px-2">
      <div className="flex items-center px-1 group">
        <Button
          onClick={toggle}
          variant="transparent"
          className="text-sm text-[#f9edffcc] shrink-0 size-6">
          <FaCaretDown
            className={cn("size-4 transition-transform", !on && "-rotate-90")}
          />
        </Button>
        <Button
          variant="transparent"
          size="sm"
          className="group h-[28px] px-1.5 items-center justify-start text-sm text-[#F9EDFFCC] overflow-hidden">
          <span className="truncate">{label}</span>
        </Button>
        {onNew && (
          <Hint label={hint} side="top" align="center">
            <Button
              onClick={onNew}
              variant="transparent"
              size="iconSm"
              className="ml-auto size-6 p-0.5 shrink-0 text-sm text-[#F9EDFFCC] opacity-0 transition-opacity group-hover:opacity-100">
              <PlusIcon className="size-5" />
            </Button>
          </Hint>
        )}
      </div>
      {on && children}
    </div>
  );
};
