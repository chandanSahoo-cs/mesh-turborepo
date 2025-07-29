import { useCreateFriendMessage } from "@/features/friendMessages/api/useCreateFriendMessage";
import { useGenerateUploadUrl } from "@/features/upload/api/useGenerateUploadUrl";
import { errorToast } from "@/lib/toast";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import Quill from "quill";
import { useRef, useState } from "react";
import { Id } from "../../../../../convex/_generated/dataModel";

const Editor = dynamic(() => import("@/components/Editor"), { ssr: false });

interface ChatInputProps {
  placeholder: string;
  conversationId: Id<"friendConversations">;
}

type CreateMessageValue = {
  friendConversationId: Id<"friendConversations">;
  body?: string;
  image: Id<"_storage"> | undefined;
};

export const ChatInput = ({ placeholder, conversationId }: ChatInputProps) => {
  const editorRef = useRef<Quill | null>(null);
  const [editorKey, setEditorkey] = useState(0);
  const [isPending, setIsPending] = useState(false);

  const { generateUploadUrl } = useGenerateUploadUrl();
  const { createFriendMessage } = useCreateFriendMessage();

  const handleSubmit = async ({
    body,
    image,
  }: {
    body: string;
    image: File | null;
  }) => {
    try {
      setIsPending(true);
      editorRef?.current?.enable(false);

      const values: CreateMessageValue = {
        friendConversationId: conversationId,
        body,
        image: undefined,
      };

      if (image) {
        const url = await generateUploadUrl();

        if (!url) {
          throw new Error("Url not found");
        }

        const result = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": image.type },
          body: image,
        });

        if (!result.ok) {
          throw new Error("Failed to upload file");
        }

        const { storageId } = await result.json();
        values.image = storageId;
      }

      await createFriendMessage(values, {
        throwError: true,
      });
      setEditorkey((prev) => prev + 1);
    } catch {
      errorToast("Failed to send message");
    } finally {
      setIsPending(false);
      editorRef.current?.enable(true);
    }
  };
  return (
    <motion.div
      className="px-6 py-4 bg-[#fffce9] border-t-4 border-black"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}>
      <Editor
        key={editorKey}
        placeholder={placeholder}
        onSubmit={handleSubmit}
        disabled={isPending}
        innerRef={editorRef}
      />
    </motion.div>
  );
};
