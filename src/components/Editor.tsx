import { cn } from "@/lib/utils";
import { ImageIcon, SmileIcon } from "lucide-react";
import Quill, { Delta, Op, type QuillOptions } from "quill";
import "quill/dist/quill.snow.css";
import { RefObject, useEffect, useLayoutEffect, useRef, useState } from "react";
import { MdSend } from "react-icons/md";
import { PiTextAa } from "react-icons/pi";
import { Hint } from "./Hint";
import { Button } from "./ui/button";

type EditorValue = {
  image: File | null;
  body: string;
};

interface EditorProps {
  onSubmit?: ({ image, body }: EditorValue) => void;
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
  const [text, setText] = useState("");
  const [isToolbarVisible, setIsToolbarVisible] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  const submitRef = useRef(onSubmit);
  const placeholderRef = useRef(placeholder);
  const cancelRef = useRef(onCancel);
  const quillRef = useRef<Quill | null>(null);
  const defaultValueRef = useRef(defaultValue);
  const disabledRef = useRef(disabled);

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

    const options: QuillOptions = {
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
                return;
              },
            },
            shift_enter: {
              key: "Enter",
              shiftKey: true,
              handler: () => {
                quill.insertText(quill.getSelection()?.index || 0, "\n");
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

    quill.on(Quill.events.TEXT_CHANGE, () => {
      setText(quill.getText());
    });

    return () => {
      quill.off(Quill.events.TEXT_CHANGE);
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
  }, [innerRef]);

  const toggleToolbar = () => {
    setIsToolbarVisible((current) => !current);
    const toolbarElement = containerRef.current?.querySelector(".ql-toolbar");

    if (toolbarElement) {
      toolbarElement.classList.toggle("hidden");
    }
  };

  const isEmpty = text.replace(/<(.|\n)*?>/g, "").trim().length === 0;

  return (
    <div className="flex flex-col">
      <div className="flex flex-col border border-slate-200 rounded-md overflow-hidden focus-within:border-slate-300 focus-within:shadow-sm transition bg-white">
        <div ref={containerRef} className="h-full ql-custom" />
        <div className="flex px-2 pb-2 z-[5]">
          <Hint
            label={isToolbarVisible ? "Hide formatting" : "Show formatting"}>
            <Button
              disabled={disabled}
              size="iconSm"
              variant="ghost"
              onClick={toggleToolbar}
              className={cn(
                !isToolbarVisible ? "bg-accent" : "bg-transparent"
              )}>
              <PiTextAa className="size-4" />
            </Button>
          </Hint>
          <Hint label="Emojis">
            <Button
              disabled={disabled}
              size="iconSm"
              variant="ghost"
              onClick={() => {}}>
              <SmileIcon className="size-4" />
            </Button>
          </Hint>
          {variant == "create" && (
            <Hint label="Add image">
              <Button
                disabled={disabled}
                size="iconSm"
                variant="ghost"
                onClick={() => {}}>
                <ImageIcon className="size-4" />
              </Button>
            </Hint>
          )}

          {variant === "update" && (
            <div className="ml-auto flex items-center gap-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {}}
                disabled={disabled || isEmpty}>
                Cancel
              </Button>
              <Button
                className="bg-[#007a5a] hover:bg-[#007a5a]/80 text-white"
                size="sm"
                onClick={() => {}}
                disabled={disabled}>
                Save
              </Button>
            </div>
          )}

          {variant === "create" && (
            <Hint label="Send message">
              <Button
                disabled={disabled || isEmpty}
                onClick={() => {}}
                size="iconSm"
                className={cn(
                  "ml-auto",
                  isEmpty
                    ? " bg-white hover:bg-white text-muted-foreground"
                    : " bg-[#007a5a] hover:bg-[#007a5a]/80 text-white"
                )}>
                <MdSend className="size-4" />
              </Button>
            </Hint>
          )}
        </div>
      </div>
      {variant === "create" && (
        <div
          className={cn(
            "p-2 text-[10px] text-muted-foreground flex justify-end opacity-0",
            !isEmpty && "opacity-100"
          )}>
          <p>
            <strong>Shift + Enter</strong> to add a new line
          </p>
        </div>
      )}
    </div>
  );
};

export default Editor;
