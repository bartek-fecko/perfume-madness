import { notFound } from "next/navigation";
import { getPerfumeById } from "@/lib/actions/perfumes";
import { getCurrentUser } from "@/lib/actions/auth";
import { PerfumeDetail } from "@/components/perfume-detail";

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

  // Komentarze doczytują się leniwie na kliencie - strona detail jest prefetchowana tylko z perfumem (Next Data Cache)
  return (
    <PerfumeDetail
      perfume={perfume}
      isReadOnly={isReadOnly}
      initialComments={[]}
      currentUserId={user?.id || null}
      userCommentCount={0}
      user={user}
    />
  );
}
