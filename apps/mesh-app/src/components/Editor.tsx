"use client";

import { cn } from "@/lib/utils";
import { useMyPresence, useOthers } from "@liveblocks/react";
import { motion } from "framer-motion";
import { ImageIcon, SmileIcon, XIcon } from "lucide-react";
import Image from "next/image";
import type { Delta, Op } from "quill";
import Quill from "quill";
import "quill/dist/quill.snow.css";
import type { RefObject } from "react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { MdSend } from "react-icons/md";
import { PiTextAa } from "react-icons/pi";
import { EmojiPopover } from "./EmojiPopover";
import { Hint } from "./Hint";
import { Button } from "./ui/button";

type EditorValue = {
  image: File | null;
  body: string;
};

interface EditorProps {
  onSubmit: ({ image, body }: EditorValue) => void;
  onCancel?: () => void;
  placeholder?: string;
  defaultValue?: Delta | Op[];
  disabled?: boolean;
  innerRef?: RefObject<Quill | null>;
  variant?: "create" | "update";
}

const Editor = ({
  onSubmit,
  onCancel,
  placeholder,
  defaultValue,
  disabled,
  innerRef,
  variant = "create",
}: EditorProps) => {
  const others = useOthers();
  const isTyping = others.filter((user) => user.presence.isTyping === true);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_, updateMyPresence] = useMyPresence();

  const [text, setText] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [isToolbarVisible, setIsToolbarVisible] = useState(true);

  const containerRef = useRef<HTMLDivElement>(null);
  const submitRef = useRef(onSubmit);
  const placeholderRef = useRef(placeholder);
  const quillRef = useRef<Quill | null>(null);
  const defaultValueRef = useRef(defaultValue);
  const disabledRef = useRef(disabled);
  const imageElementRef = useRef<HTMLInputElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useLayoutEffect(() => {
    submitRef.current = onSubmit;
    placeholderRef.current = placeholder;
    defaultValueRef.current = defaultValue;
    disabledRef.current = disabled;
  });

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const editorContainer = container.appendChild(
      container.ownerDocument.createElement("div")
    );

    const options = {
      theme: "snow",
      placeholder: placeholderRef.current,
      modules: {
        toolbar: [
          ["bold", "italic", "strike"],
          ["link"],
          [{ list: "ordered" }, { list: "bullet" }],
        ],
        keyboard: {
          bindings: {
            enter: {
              key: "Enter",
              handler: () => {
                const text = quillRef.current?.getText();
                const addedImage = imageElementRef.current?.files?.[0] || null;

                const isEmpty =
                  !addedImage &&
                  (text?.replace(/<(.|\n)*?>/g, "").trim().length === 0 ||
                    false);

                if (isEmpty) return;

                const body = JSON.stringify(quillRef.current?.getContents());
                submitRef.current?.({ body, image: addedImage });
                return;
              },
            },
            shift_enter: {
              key: "Enter",
              shiftKey: true,
              handler: () => {
                quillRef.current?.insertText(
                  quillRef.current?.getSelection()?.index || 0,
                  "\n"
                );
              },
            },
          },
        },
      },
    };

    const quill = new Quill(editorContainer, options);
    quillRef.current = quill;
    quillRef.current.focus();

    if (innerRef) {
      innerRef.current = quill;
    }

    if (defaultValueRef.current) quill.setContents(defaultValueRef.current);
    setText(quill.getText());

    quill.on("text-change", () => {
      const currentText = quill.getText();
      setText(currentText);

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      updateMyPresence({ isTyping: currentText.trim().length > 0 });
      timeoutRef.current = setTimeout(() => {
        updateMyPresence({ isTyping: false });
      }, 1000);
    });

    return () => {
      quill.off("text-change");
      if (container) {
        container.innerHTML = "";
      }

      if (quillRef.current) {
        quillRef.current = null;
      }
      if (innerRef?.current) {
        innerRef.current = null;
      }
    };
  }, [innerRef, updateMyPresence]);

  const toggleToolbar = () => {
    setIsToolbarVisible((current) => !current);
    const toolbarElement = containerRef.current?.querySelector(".ql-toolbar");

    if (toolbarElement) {
      toolbarElement.classList.toggle("hidden");
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onEmojiSelect = (emojiValue: string) => {
    const quill = quillRef.current;
    quill?.insertText(quill?.getSelection()?.index || 0, emojiValue);
  };

  const isEmpty = !image && text.replace(/<(.|\n)*?>/g, "").trim().length === 0;

  // Typing indicator logic
  const renderTypingIndicator = () => {
    if (isTyping.length === 0) return null;

    let typingText = "";
    if (isTyping.length === 1) {
      typingText = `${isTyping[0].info?.name || "Someone"} is typing...`;
    } else if (isTyping.length === 2) {
      typingText = `${isTyping[0].info?.name || "Someone"} and ${isTyping[1].info?.name || "someone"} are typing...`;
    } else {
      typingText = "Several users are typing...";
    }

    return (
      <motion.div
        className="px-4 pt-2  bg-white border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_#000000]"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ duration: 0.2 }}>
        <div className="flex items-center gap-2">
          <motion.div
            className="flex gap-1"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}>
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 bg-[#5170ff] rounded-full"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{
                  duration: 1,
                  repeat: Number.POSITIVE_INFINITY,
                  delay: i * 0.2,
                }}
              />
            ))}
          </motion.div>
          <span className="text-xs font-mono font-bold text-gray-600 uppercase tracking-wide">
            {typingText}
          </span>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="flex flex-col">
      <input
        type="file"
        accept="image/*"
        ref={imageElementRef}
        onChange={(event) => setImage(event.target.files![0])}
        className="hidden"
      />

      {/* Typing Indicator - Above Editor */}
      {renderTypingIndicator()}

      <div
        className={cn(
          "flex flex-col border-4 border-black rounded-xl overflow-hidden focus-within:border-[#5170ff] focus-within:shadow-[6px_6px_0px_0px_#5170ff] transition-all duration-200 bg-white shadow-[4px_4px_0px_0px_#000000]",
          disabled && "opacity-50"
        )}>
        <div ref={containerRef} className="h-full ql-custom" />
        {!!image && (
          <div className="p-3">
            <div className="relative size-16 flex items-center justify-center group/image">
              <Hint label="Remove image">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    setImage(null);
                    imageElementRef.current!.value = "";
                  }}
                  className="hidden group-hover/image:flex rounded-full bg-red-500 hover:bg-red-600 absolute -top-2 -right-2 text-white size-6 z-[4] border-2 border-black items-center justify-center shadow-[2px_2px_0px_0px_#000000] transition-all">
                  <XIcon className="size-3" />
                </motion.button>
              </Hint>
              <Image
                src={URL.createObjectURL(image) || "/placeholder.svg"}
                alt="Uploaded"
                fill
                className="rounded-xl overflow-hidden border-2 border-black object-cover shadow-[2px_2px_0px_0px_#000000]"
              />
            </div>
          </div>
        )}
        <div className="flex px-3 pb-3 z-[5] gap-2">
          <Hint
            label={isToolbarVisible ? "Hide formatting" : "Show formatting"}>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                disabled={disabled}
                size="iconSm"
                onClick={toggleToolbar}
                className={cn(
                  "size-8 p-2 border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_#000000] hover:shadow-[4px_4px_0px_0px_#000000] transition-all font-mono font-bold",
                  isToolbarVisible
                    ? "bg-white text-black hover:bg-gray-50"
                    : "bg-[#5170ff] text-white hover:bg-[#4060ef]"
                )}>
                <PiTextAa className="size-4" />
              </Button>
            </motion.div>
          </Hint>

          <EmojiPopover onEmojiSelect={onEmojiSelect}>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                disabled={disabled}
                size="iconSm"
                className="size-8 p-2 bg-white text-black border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_#000000] hover:shadow-[4px_4px_0px_0px_#000000] hover:bg-gray-50 transition-all">
                <SmileIcon className="size-4" />
              </Button>
            </motion.div>
          </EmojiPopover>

          {variant === "create" && (
            <Hint label="Add image">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}>
                <Button
                  disabled={disabled}
                  size="iconSm"
                  onClick={() => imageElementRef.current?.click()}
                  className="size-8 p-2 bg-white text-black border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_#000000] hover:shadow-[4px_4px_0px_0px_#000000] hover:bg-gray-50 transition-all">
                  <ImageIcon className="size-4" />
                </Button>
              </motion.div>
            </Hint>
          )}

          {variant === "update" && (
            <div className="ml-auto flex items-center gap-x-2">
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}>
                <Button
                  onClick={onCancel}
                  disabled={disabled || isEmpty}
                  className="bg-white text-black font-mono font-bold py-2 px-4 border-2 border-black uppercase tracking-wide shadow-[2px_2px_0px_0px_#000000] hover:shadow-[4px_4px_0px_0px_#000000] rounded-lg transition-all hover:bg-gray-50">
                  Cancel
                </Button>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}>
                <Button
                  onClick={() => {
                    onSubmit({
                      body: JSON.stringify(quillRef.current?.getContents()),
                      image,
                    });
                  }}
                  disabled={disabled || isEmpty}
                  className="bg-[#7ed957] text-black font-mono font-bold py-2 px-4 border-2 border-black uppercase tracking-wide shadow-[2px_2px_0px_0px_#000000] hover:shadow-[4px_4px_0px_0px_#000000] rounded-lg transition-all hover:bg-[#6ec947]">
                  Save
                </Button>
              </motion.div>
            </div>
          )}

          {variant === "create" && (
            <Hint label="Send message">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="ml-auto">
                <Button
                  disabled={disabled || isEmpty}
                  onClick={() => {
                    onSubmit({
                      body: JSON.stringify(quillRef.current?.getContents()),
                      image,
                    });
                  }}
                  size="iconSm"
                  className={cn(
                    "size-8 p-2 border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_#000000] transition-all font-mono font-bold",
                    isEmpty
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-[#7ed957] text-black hover:bg-[#6ec947] hover:shadow-[4px_4px_0px_0px_#000000]"
                  )}>
                  <MdSend className="size-4" />
                </Button>
              </motion.div>
            </Hint>
          )}
        </div>
      </div>

      {variant === "create" && (
        <motion.div
          className={cn(
            "px-2 pt-2 text-xs font-mono text-gray-600 flex justify-end transition-opacity duration-200",
            isEmpty ? "opacity-0" : "opacity-100"
          )}
          animate={{ opacity: isEmpty ? 0 : 1 }}>
          <p className={cn("uppercase tracking-wide", isEmpty && "hidden")}>
            <strong>Shift + Enter</strong> to add a new line
          </p>
        </motion.div>
      )}
    </div>
  );
};

export default Editor;
