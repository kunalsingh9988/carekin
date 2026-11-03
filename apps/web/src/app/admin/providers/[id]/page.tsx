import { AdminProviderReview } from "@/components/workspace/AdminPages";

export const metadata = { title: "Provider review" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AdminProviderReview id={id} />;
}
