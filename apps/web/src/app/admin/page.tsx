import Link from "next/link";

export default function AdminHome() {
  return (
    <main className="mx-auto flex max-w-3xl flex-1 flex-col gap-4 px-6 py-12">
      <h1 className="text-2xl font-semibold">CareKin admin</h1>
      <Link href="/admin/verification-queue" className="text-blue-600 underline">
        Verification queue
      </Link>
    </main>
  );
}
