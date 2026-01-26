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
  // Pobierz komentarze
  const comments = await getComments(id);

  // Pobierz liczbę komentarzy użytkownika
  const userCommentCount = user ? await getUserCommentCount(id) : 0;

  return (
    <PerfumeDetail
      perfume={perfume}
      isReadOnly={isReadOnly}
      initialComments={comments}
      currentUserId={user?.id || null}
      userCommentCount={userCommentCount}
    />
  );
}
