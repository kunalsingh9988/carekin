import { RescheduleVisit } from "@/components/workspace/FamilyPages";

export const metadata = { title: "Reschedule visit" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <RescheduleVisit id={id} />;
}
