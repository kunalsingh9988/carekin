import { BookingDetail } from "@/components/workspace/BookingDetail";

export const metadata = { title: "Booking details" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <BookingDetail id={id} role="provider" />;
}
