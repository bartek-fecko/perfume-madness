"use client";

import { useState } from "react";
import { UserPlus, UserMinus, Loader2 } from "lucide-react";
import { followUser, unfollowUser } from "@/lib/actions/follows";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface FollowButtonProps {
  userId: string;
  initialIsFollowing: boolean;
  variant?: "default" | "compact";
  className?: string;
}

export function FollowButton({
  userId,
  initialIsFollowing,
  variant = "default",
  className,
}: FollowButtonProps) {
  const router = useRouter();
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isLoading, setIsLoading] = useState(false);

  const handleToggleFollow = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setIsLoading(true);

    try {
      if (isFollowing) {
        const result = await unfollowUser(userId);
        if (result.success) {
          setIsFollowing(false);
        } else {
          console.error("Failed to unfollow:", result.error);
          alert(result.error || "Nie udało się przestać obserwować");
        }
      } else {
        const result = await followUser(userId);
        if (result.success) {
          setIsFollowing(true);
        } else {
          console.error("Failed to follow:", result.error);
          alert(result.error || "Nie udało się obserwować");
        }
      }
      router.refresh();
    } catch (error) {
      console.error("Error toggling follow:", error);
      alert("Wystąpił błąd. Spróbuj ponownie.");
    } finally {
      setIsLoading(false);
    }
  };

  if (variant === "compact") {
    return (
      <button
        onClick={handleToggleFollow}
        disabled={isLoading}
        className={cn(
          "p-2 rounded-lg transition-all",
          isFollowing
            ? "bg-muted hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
            : "bg-primary hover:bg-primary/90 text-primary-foreground",
          isLoading && "opacity-50 cursor-not-allowed",
          className,
        )}
        title={isFollowing ? "Przestań obserwować" : "Obserwuj"}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : isFollowing ? (
          <UserMinus className="w-4 h-4" />
        ) : (
          <UserPlus className="w-4 h-4" />
        )}
      </button>
    );
  }

  return (
    <button
      onClick={handleToggleFollow}
      disabled={isLoading}
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all",
        isFollowing
          ? "bg-muted hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
          : "bg-primary hover:bg-primary/90 text-primary-foreground",
        isLoading && "opacity-50 cursor-not-allowed",
        className,
      )}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Ładowanie...</span>
        </>
      ) : isFollowing ? (
        <>
          <UserMinus className="w-4 h-4" />
          <span>Przestań obserwować</span>
        </>
      ) : (
        <>
          <UserPlus className="w-4 h-4" />
          <span>Obserwuj</span>
        </>
      )}
    </button>
  );
}
