import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getPerfumeById } from "@/lib/actions/perfumes";
import { getCurrentUser } from "@/lib/actions/auth";
import { PerfumeDetail } from "@/components/perfume-detail";
import { CommentsLoader } from "@/components/comments-loader";
import { MessageSquare } from "lucide-react";

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

  return (
    <PerfumeDetail
      perfume={perfume}
      isReadOnly={isReadOnly}
      currentUserId={user?.id || null}
      userCommentCount={0}
      user={user}
      initialComments={[]}
    >
      <Suspense
        fallback={
          <div className="mt-8 sm:mt-12 border-t border-border pt-6 sm:pt-8">
            <div className="flex items-center gap-2 mb-6">
              <MessageSquare className="w-5 h-5 text-primary animate-pulse" />
              <div className="h-6 w-32 bg-muted rounded animate-pulse" />
            </div>
            <div className="space-y-3">
              <div className="h-20 bg-muted/50 rounded-xl animate-pulse" />
              <div className="h-20 bg-muted/30 rounded-xl animate-pulse" />
            </div>
          </div>
        }
      >
        <CommentsLoader
          perfumeId={id}
          currentUserId={user?.id || null}
          isReadOnly={isReadOnly}
        />
      </Suspense>
    </PerfumeDetail>
  );
}
