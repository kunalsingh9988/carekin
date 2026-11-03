import { ActiveCare } from "@/components/care/ActiveCare";
export const metadata = { title: "Active Care" };
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ActiveCare id={id} role="family" />;
}
