import { FamilyPlanDetail } from "@/components/workspace/FamilyPages";

export const metadata = { title: "Manage care plan" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <FamilyPlanDetail id={id} />;
}
