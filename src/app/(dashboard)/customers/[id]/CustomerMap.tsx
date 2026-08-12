"use client";

import dynamic from "next/dynamic";

const LocationPicker = dynamic(() => import("@/components/LocationPicker").then((m) => m.LocationPicker), {
  ssr: false,
  loading: () => (
    <div className="flex h-56 items-center justify-center rounded-xl border border-sibol-green/20 bg-sibol-green/5 text-sm text-sibol-green/60">
      Loading map…
    </div>
  ),
});

export function CustomerMap({ lat, lng }: { lat: number; lng: number }) {
  return <LocationPicker lat={lat} lng={lng} readOnly />;
}
