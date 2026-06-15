import { Suspense } from "react";
import AyarlarClient from "./AyarlarClient";

export default function AyarlarPage() {
  return (
    <Suspense fallback={<div className="min-h-[100dvh] flex items-center justify-center"><p className="text-gray-400 text-sm">Yükleniyor...</p></div>}>
      <AyarlarClient />
    </Suspense>
  );
}
