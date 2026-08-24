import { getComments, getUserCommentCount } from "@/lib/actions/comments";
import { CommentsSection } from "./comments-section";

interface CommentsLoaderProps {
  perfumeId: string;
  currentUserId: string | null;
  isReadOnly: boolean;
}

export async function CommentsLoader({
  perfumeId,
  currentUserId,
  isReadOnly,
}: CommentsLoaderProps) {
  const [comments, count] = await Promise.all([
    getComments(perfumeId),
    currentUserId ? getUserCommentCount(perfumeId) : Promise.resolve(0),
  ]);

  return (
    <CommentsSection
      perfumeId={perfumeId}
      initialComments={comments}
      currentUserId={currentUserId}
      userCommentCount={count}
      isReadOnly={isReadOnly}
    />
  );
}
