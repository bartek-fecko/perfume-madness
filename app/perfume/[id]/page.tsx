import { notFound } from "next/navigation";
import { getPerfumeById } from "@/lib/actions/perfumes";
import { getCurrentUser } from "@/lib/actions/auth";
import { PerfumeDetail } from "@/components/perfume-detail";
import { getComments, getUserCommentCount } from "@/lib/actions/comments";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ readonly?: string }>;
}

export default async function PerfumeDetailPage({
  params,
  searchParams,
}: PageProps) {
  const { id } = await params;
  const { readonly } = await searchParams;

  const [perfume, user] = await Promise.all([
    getPerfumeById(id),
    getCurrentUser(),
  ]);

  if (!perfume) {
    notFound();
  }

  const isOwner = user?.id === perfume.user_id;
  const isReadOnly = readonly === "true" || !isOwner;
  // Pobierz komentarze równolegle - 200-400ms szybciej
  const [comments, userCommentCount] = await Promise.all([
    getComments(id),
    user ? getUserCommentCount(id) : Promise.resolve(0),
  ]);

  return (
    <PerfumeDetail
      perfume={perfume}
      isReadOnly={isReadOnly}
      initialComments={comments}
      currentUserId={user?.id || null}
      userCommentCount={userCommentCount}
      user={user}
    />
  );
}
