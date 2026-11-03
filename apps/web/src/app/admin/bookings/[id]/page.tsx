import { BookingDetail } from "@/components/workspace/BookingDetail";

export const metadata = { title: "Manage booking" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <BookingDetail id={id} role="admin" />;
}
