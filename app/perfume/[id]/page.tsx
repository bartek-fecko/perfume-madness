import { notFound } from "next/navigation";
import { getPerfumeById } from "@/lib/actions/perfumes";
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

  const perfume = await getPerfumeById(id);

  if (!perfume) {
    notFound();
  }

  // Tylko perfume jest cache'owany (Data Cache) i prefetchowany - user/komentarze leniwie na kliencie
  return <PerfumeDetail perfume={perfume} initialReadonly={readonly === "true"} />;
}
