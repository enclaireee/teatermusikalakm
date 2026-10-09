import { notFound } from "next/navigation";
import { Suspense } from "react";
import { BookingProvider } from "@/lib/booking";
import { isShowId } from "@/lib/event";

export function generateStaticParams() {
  return [{ show: "1" }, { show: "2" }];
}

// Reading params must sit inside <Suspense> with cacheComponents; unknown shows 404 here
// (dynamicParams isn't allowed with cacheComponents).
async function ShowProvider({ params, children }: { params: Promise<{ show: string }>; children: React.ReactNode }) {
  const { show } = await params;
  if (!isShowId(show)) notFound();
  return <BookingProvider show={show}>{children}</BookingProvider>;
}

export default function PesanLayout({ children, params }: LayoutProps<"/pesan/[show]">) {
  return (
    <Suspense fallback={<div className="flex-1" />}>
      <ShowProvider params={params}>{children}</ShowProvider>
    </Suspense>
  );
}
