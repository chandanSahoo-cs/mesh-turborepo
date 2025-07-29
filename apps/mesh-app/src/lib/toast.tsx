import {
  CircleAlertIcon,
  CircleCheckBigIcon,
  CircleXIcon,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";

const baseToastStyles =
  "border-4 border-black font-mono font-black uppercase tracking-wide rounded-xl";

const ToastIcon = ({ Icon }: { Icon: LucideIcon }) => {
  return <Icon className="size-4 text-black" />;
};

export const successToast = (message: string) => {
  toast.success(message, {
    icon: <ToastIcon Icon={CircleCheckBigIcon} />,
    className: `${baseToastStyles} bg-[#7ed957] text-black  transition-all duration-200`,
    style: {
      gap: "12px",
      padding: "16px",
      display: "flex",
      alignItems: "center",
    },
    duration: 4000,
  });
};

export const warningToast = (message: string) => {
  toast.warning(message, {
    icon: <ToastIcon Icon={CircleAlertIcon} />,
    className: `${baseToastStyles} bg-yellow-400 text-black  transition-all duration-200`,
    style: {
      gap: "12px",
      padding: "16px",
      display: "flex",
      alignItems: "center",
    },
    duration: 4000,
  });
};

export const errorToast = (message: string) => {
  toast.error(message, {
    icon: <ToastIcon Icon={CircleXIcon} />,
    className: `${baseToastStyles} bg-red-400 text-black  transition-all duration-200`,
    style: {
      gap: "12px",
      padding: "16px",
      display: "flex",
      alignItems: "center",
    },
    duration: 5000,
  });
};

// Additional specialized toast variants for your Discord-like app
export const infoToast = (message: string) => {
  toast.info(message, {
    icon: <ToastIcon Icon={CircleAlertIcon} />,
    className: `${baseToastStyles} bg-[#5170ff] text-black transition-all duration-200`,
    style: {
      gap: "12px",
      padding: "16px",
      display: "flex",
      alignItems: "center",
    },
    duration: 4000,
  });
};

// Chat-specific toast variants
export const messageToast = (message: string) => {
  toast(message, {
    icon: <ToastIcon Icon={CircleCheckBigIcon} />,
    className: `${baseToastStyles} bg-[#fffce9] text-black border-[#5170ff]  transition-all duration-200`,
    style: {
      gap: "12px",
      padding: "16px",
      display: "flex",
      alignItems: "center",
    },
    duration: 3000,
  });
};

export const loadingToast = (message: string) => {
  return toast.loading(message, {
    className: `${baseToastStyles} bg-white text-black  transition-all duration-200`,
    style: {
      gap: "12px",
      padding: "16px",
      display: "flex",
      alignItems: "center",
    },
  });
};
