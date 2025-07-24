import { format, isToday, isYesterday } from "date-fns";

import { Hint } from "@/components/Hint";
import { ThreadBar } from "@/components/ThreadBar";
import { Thumbnail } from "@/components/Thumbnail";
import { Toolbar } from "@/components/Toolbar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useRemoveFriendMessage } from "@/features/friendMessages/api/useDeleteFriendMessage";
import { useEditFriendMessage } from "@/features/friendMessages/api/useEditFriendMessage";
import { useToggleFriendReaction } from "@/features/reactions/api/useToggleFriendReaction";
import { useConfirm } from "@/hooks/useConfirm";
import { usePanel } from "@/hooks/usePanel";
import { errorToast, successToast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";
import { Doc, Id } from "../../../../../convex/_generated/dataModel";
import { FriendReactions } from "./FriendReaction";

const Renderer = dynamic(() => import("@/components/Renderer"), { ssr: false });
const Editor = dynamic(() => import("@/components/Editor"), { ssr: false });

interface MessageProps {
  id: Id<"friendMessages">;
  authorId: Id<"users">;
  authorImage?: string;
  authorName?: string;
  isAuthor: boolean;
  reactions: Array<Doc<"friendReactions">>;
  body: Doc<"friendMessages">["body"];
  image: string | null | undefined;
  createdAt: Doc<"friendMessages">["_creationTime"];
  updatedAt: Doc<"friendMessages">["updatedAt"];
  isEditing: boolean;
  isCompact?: boolean;
  setEditingId: (id: Id<"friendMessages"> | null) => void;
  hideThreadButton?: boolean;
  threadCount?: number;
  threadImage?: string;
  threadName?: string;
  threadTimestamp?: number;
}

const formatFullTime = (date: Date) => {
  return `${isToday(date) ? "Today" : isYesterday(date) ? "Yesterday" : format(date, "MMMM d, yyyy")} at ${format(date, "hh:mm:ss a")}`;
};

export const Message = ({
  id,
  authorImage,
  authorName = "Friend",
  isAuthor,
  reactions,
  body,
  image,
  createdAt,
  updatedAt,
  isCompact,
  isEditing,
  setEditingId,
  hideThreadButton,
  threadCount,
  threadImage,
  threadName,
  threadTimestamp,
}: MessageProps) => {
  const { parentMessageId, onOpenMessage, onClose } = usePanel();
  const [ConfirmDialog, confirm] = useConfirm(
    "Delete message",
    "Are you sure you want to delete this message? This cannot be undone"
  );
  const { editFriendMessage, isPending: isEditingFriendMessage } =
    useEditFriendMessage();
  const { removeFriendMessage, isPending: isRemovingFriendMessage } =
    useRemoveFriendMessage();
  const { toggleFriendReaction } = useToggleFriendReaction();

  const handleUpdate = ({ body }: { body: string }) => {
    editFriendMessage(
      { friendMessageId: id, body },
      {
        onSuccess: () => {
          successToast("Message edited");
          setEditingId(null);
        },
        onError: () => {
          errorToast("Failed to edit message");
        },
      }
    );
  };

  const handleDelete = async () => {
    const ok = await confirm();

    if (!ok) return;

    removeFriendMessage(
      { friendMessageId: id },
      {
        onSuccess: () => {
          successToast("Message deleted");

          if (parentMessageId === id) {
            onClose();
          }
        },
        onError: () => {
          errorToast("Failed to delete message");
        },
      }
    );
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleReaction = (value: any) => {
    toggleFriendReaction(
      { value, friendMessageId: id },
      {
        onError: () => {
          errorToast("Failed to add reaction");
        },
      }
    );
  };

  const isPending = isEditingFriendMessage || isRemovingFriendMessage;

  const avatarFallback = authorName?.charAt(0).toUpperCase();
  if (isCompact) {
    return (
      <>
        <ConfirmDialog />

        <div
          className={cn(
            "flex flex-col gap-2 p-1.5 px-5 hover:bg-gray-100/60 group relative",
            isEditing && "bg-[#f2c74433] hover:bg-[#f2c74433]",
            isRemovingFriendMessage &&
              "bg-rose-500/50 transform transition-all scale-y-0 origin-bottom duration-200"
          )}>
          <div className="flex items-start gap-2">
            <Hint label={formatFullTime(new Date(createdAt))}>
              <button className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 w-[40px] leading-[22px] text-center hover:underline">
                {format(new Date(createdAt), "hh:mm")}
              </button>
            </Hint>
            {isEditing ? (
              <div className="size-full">
                <Editor
                  onSubmit={handleUpdate}
                  disabled={isEditingFriendMessage}
                  defaultValue={JSON.parse(body as string)}
                  onCancel={() => setEditingId(null)}
                  variant="update"
                />
              </div>
            ) : (
              <div className="flex flex-col w-full px-3">
                <Renderer value={body as string} />
                <Thumbnail url={image} />

                {updatedAt ? (
                  <span className="text-xs text-muted-foreground">
                    (edited)
                  </span>
                ) : null}
                <FriendReactions data={reactions} onChange={handleReaction} />
                <ThreadBar
                  count={threadCount}
                  image={threadImage}
                  timestamp={threadTimestamp}
                  name={threadName}
                  onClick={() => onOpenMessage(id)}
                />
              </div>
            )}
          </div>
          {!isEditing && (
            <Toolbar
              isAuthor={isAuthor}
              isPending={isPending}
              handleEdit={() => setEditingId(id)}
              handleThread={() => onOpenMessage(id)}
              handleDelete={handleDelete}
              handleReaction={handleReaction}
              hideThreadButton={hideThreadButton}
            />
          )}
        </div>
      </>
    );
  }

  return (
    <>
      <ConfirmDialog />
      <div
        className={cn(
          "flex flex-col gap-2 p-1.5 px-5 hover:bg-gray-100/60 group relative",
          isEditing && "bg-[#f2c74433] hover:bg-[#f2c74433]",
          isRemovingFriendMessage &&
            "bg-rose-500/50 transform transition-all scale-y-0 origin-bottom duration-200"
        )}>
        <div className="flex items-start gap-2">
          <button>
            <Avatar>
              <AvatarImage alt={authorName} src={authorImage} />
              <AvatarFallback className="rounded-md bg-sky-500 text-white">
                {avatarFallback}
              </AvatarFallback>
            </Avatar>
          </button>
          {isEditing ? (
            <div className="size-full">
              <Editor
                onSubmit={handleUpdate}
                disabled={isEditingFriendMessage}
                defaultValue={JSON.parse(body as string)}
                onCancel={() => setEditingId(null)}
                variant="update"
              />
            </div>
          ) : (
            <div className="flex flex-col px-5 w-full overflow-hidden">
              <div className="text-sm">
                <button
                  onClick={() => {}}
                  className="font-bold text-primary hover:underline">
                  {authorName}
                </button>
                <span>&nbsp;&nbsp;</span>
                <Hint label={formatFullTime(new Date(createdAt))}>
                  <button className="text-xs text-muted-foreground hover:underline">
                    {format(new Date(createdAt), "h:mm a")}
                  </button>
                </Hint>
              </div>
              <Renderer value={body as string} />
              <Thumbnail url={image} />
              {updatedAt ? (
                <span className="text-xs text-muted-foreground">(edited)</span>
              ) : null}
              <FriendReactions data={reactions} onChange={handleReaction} />
              <ThreadBar
                count={threadCount}
                image={threadImage}
                timestamp={threadTimestamp}
                name={threadName}
                onClick={() => onOpenMessage(id)}
              />
            </div>
          )}
        </div>
        {!isEditing && (
          <Toolbar
            isAuthor={isAuthor}
            isPending={isPending}
            handleEdit={() => setEditingId(id)}
            handleThread={() => {
              onOpenMessage(id);
            }}
            handleDelete={handleDelete}
            handleReaction={handleReaction}
            hideThreadButton={hideThreadButton}
          />
        )}
      </div>
    </>
  );
};
