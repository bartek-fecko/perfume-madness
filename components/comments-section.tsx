"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare, Trash2, Send } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { addComment, deleteComment } from "@/lib/actions/comments";
import type { PerfumeComment } from "@/lib/types";

interface CommentsSectionProps {
  perfumeId: string;
  initialComments: PerfumeComment[];
  currentUserId: string | null;
  userCommentCount: number;
  isReadOnly: boolean;
}

export function CommentsSection({
  perfumeId,
  initialComments,
  currentUserId,
  userCommentCount,
  isReadOnly,
}: CommentsSectionProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [newComment, setNewComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [localCommentCount, setLocalCommentCount] = useState(userCommentCount);

  const remainingComments = Math.max(0, 5 - localCommentCount);
  const canComment = !isReadOnly && currentUserId && remainingComments > 0;

  const handleAddComment = () => {
    if (!newComment.trim() || newComment.length > 500) {
      setError("Komentarz musi mieć od 1 do 500 znaków");
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await addComment(perfumeId, newComment);
      if (result.success) {
        setNewComment("");
        setLocalCommentCount((prev) => prev + 1);
        router.refresh();
      } else {
        setError(result.error || "Nie udało się dodać komentarza");
      }
    });
  };

  const handleDeleteComment = (commentId: string) => {
    startTransition(async () => {
      const result = await deleteComment(commentId);
      if (result.success) {
        setLocalCommentCount((prev) => prev - 1);
        router.refresh();
      } else {
        setError(result.error || "Nie udało się usunąć komentarza");
      }
    });
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return "teraz";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m temu`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h temu`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d temu`;
    return date.toLocaleDateString("pl-PL", {
      day: "numeric",
      month: "short",
    });
  };

  return (
    <div className="mt-12 border-t border-border pt-8">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <MessageSquare className="w-5 h-5 text-primary" />
        <h2 className="text-xl font-semibold text-foreground">
          Komentarze ({initialComments.length})
        </h2>
      </div>

      {/* Add Comment Form */}
      {!isReadOnly && currentUserId && (
        <div className="mb-8 p-4 bg-muted/30 rounded-xl border border-border">
          <Textarea
            value={newComment}
            onChange={(e) => {
              setNewComment(e.target.value);
              setError(null);
            }}
            placeholder="Dodaj komentarz..."
            rows={3}
            maxLength={500}
            disabled={isPending || !canComment}
            className="mb-3 resize-none"
          />
          <div className="flex items-center justify-between">
            <div className="text-sm">
              <span className="text-muted-foreground">
                {newComment.length}/500 znaków
              </span>
              {currentUserId && (
                <span className="text-muted-foreground ml-4">
                  • Pozostało{" "}
                  <span
                    className={
                      remainingComments === 0
                        ? "text-destructive font-medium"
                        : "text-primary font-medium"
                    }
                  >
                    {remainingComments}/5
                  </span>{" "}
                  komentarzy
                </span>
              )}
            </div>
            <Button
              onClick={handleAddComment}
              disabled={isPending || !newComment.trim() || !canComment}
              className="gap-2"
            >
              <Send className="w-4 h-4" />
              {isPending ? "Wysyłanie..." : "Wyślij"}
            </Button>
          </div>
          {error && <p className="text-sm text-destructive mt-2">{error}</p>}
          {remainingComments === 0 && (
            <p className="text-sm text-destructive mt-2">
              Osiągnięto limit 5 komentarzy dla tych perfum
            </p>
          )}
        </div>
      )}

      {isReadOnly && (
        <div className="mb-8 p-4 bg-muted/30 rounded-xl border border-border text-center">
          <p className="text-sm text-muted-foreground">
            Zaloguj się, aby dodać komentarz
          </p>
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-4">
        {initialComments.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              Brak komentarzy. Bądź pierwszy!
            </p>
          </div>
        ) : (
          initialComments.map((comment) => (
            <div
              key={comment.id}
              className="p-4 bg-card border border-border rounded-xl hover:bg-muted/20 transition-colors"
            >
              <div className="flex items-start gap-3">
                <Avatar className="w-10 h-10 border border-border flex-shrink-0">
                  <AvatarImage
                    src={comment.user_avatar || "/placeholder.svg"}
                  />
                  <AvatarFallback className="bg-primary/10 text-primary text-sm">
                    {comment.user_name?.[0]?.toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm text-foreground">
                        {comment.user_name}
                      </p>
                      <span className="text-xs text-muted-foreground">
                        • {formatTimeAgo(comment.created_at)}
                      </span>
                    </div>

                    {currentUserId === comment.user_id && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Usunąć komentarz?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              Ta akcja nie może zostać cofnięta.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Anuluj</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteComment(comment.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Usuń
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>

                  <p className="text-sm text-foreground leading-relaxed break-words">
                    {comment.comment}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
