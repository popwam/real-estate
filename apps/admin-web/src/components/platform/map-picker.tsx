"use client";

import { useState } from "react";
import { LocateFixed, MapPinned } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/i18n";

type MapPickerProps = {
  addressName: string;
  latitudeName: string;
  longitudeName: string;
  exactRadiusName: string;
  expandedRadiusName: string;
  defaultAddress?: string | null;
  defaultLatitude?: number | null;
  defaultLongitude?: number | null;
  defaultExactRadiusMeters?: number | null;
  defaultExpandedRadiusMeters?: number | null;
};

export function MapPicker({
  addressName,
  latitudeName,
  longitudeName,
  exactRadiusName,
  expandedRadiusName,
  defaultAddress,
  defaultLatitude,
  defaultLongitude,
  defaultExactRadiusMeters = 30,
  defaultExpandedRadiusMeters = 1000,
}: MapPickerProps) {
  const { t } = useI18n();
  const [latitude, setLatitude] = useState(defaultLatitude?.toString() ?? "");
  const [longitude, setLongitude] = useState(defaultLongitude?.toString() ?? "");
  const [geoError, setGeoError] = useState<string | null>(null);

  function useCurrentLocation() {
    setGeoError(null);
    if (!navigator.geolocation) {
      setGeoError(t("mapPicker.geolocationUnavailable"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude.toFixed(6));
        setLongitude(position.coords.longitude.toFixed(6));
      },
      () => setGeoError(t("mapPicker.geolocationDenied")),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }

  return (
    <fieldset className="space-y-4 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:col-span-2 lg:col-span-3">
      <legend className="px-1 text-sm font-semibold text-[var(--color-foreground)]">{t("mapPicker.title")}</legend>
      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <label className="space-y-2">
          <Label htmlFor={`${addressName}-map-address`}>{t("provisioning.address")}</Label>
          <Input id={`${addressName}-map-address`} name={addressName} defaultValue={defaultAddress ?? ""} placeholder={t("mapPicker.addressPlaceholder")} />
        </label>
        <div className="flex items-end">
          <Button type="button" className="ui-button-secondary w-full" onClick={useCurrentLocation}>
            <LocateFixed className="h-4 w-4" aria-hidden="true" />
            {t("mapPicker.currentLocation")}
          </Button>
        </div>
      </div>

      <div className="relative min-h-44 overflow-hidden rounded-[var(--radius-md)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4">
        <div className="absolute inset-0 opacity-50" style={{ backgroundImage: "linear-gradient(var(--color-border) 1px, transparent 1px), linear-gradient(90deg, var(--color-border) 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
        <div className="relative flex min-h-36 flex-col items-center justify-center gap-3 text-center">
          <MapPinned className="h-8 w-8 text-[var(--color-accent)]" aria-hidden="true" />
          <p className="max-w-xl text-sm leading-6 text-[var(--color-muted)]">{t("mapPicker.providerMissing")}</p>
          {latitude && longitude ? (
            <span className="ui-badge">{latitude}, {longitude}</span>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-2">
          <Label htmlFor={`${exactRadiusName}-radius`}>{t("provisioning.exactRadius")}</Label>
          <Input id={`${exactRadiusName}-radius`} name={exactRadiusName} type="number" min={1} max={50000} defaultValue={defaultExactRadiusMeters ?? 30} />
        </label>
        <label className="space-y-2">
          <Label htmlFor={`${expandedRadiusName}-radius`}>{t("provisioning.expandedRadius")}</Label>
          <Input id={`${expandedRadiusName}-radius`} name={expandedRadiusName} type="number" min={1} max={50000} defaultValue={defaultExpandedRadiusMeters ?? 1000} />
        </label>
      </div>

      <details className="rounded-[var(--radius-sm)] border border-[var(--color-border)] p-3">
        <summary className="cursor-pointer text-sm font-semibold text-[var(--color-foreground)]">{t("mapPicker.advanced")}</summary>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <label className="space-y-2">
            <Label htmlFor={`${latitudeName}-lat`}>{t("provisioning.latitude")}</Label>
            <Input id={`${latitudeName}-lat`} name={latitudeName} type="number" min={-90} max={90} step="0.000001" value={latitude} onChange={(event) => setLatitude(event.target.value)} />
          </label>
          <label className="space-y-2">
            <Label htmlFor={`${longitudeName}-lng`}>{t("provisioning.longitude")}</Label>
            <Input id={`${longitudeName}-lng`} name={longitudeName} type="number" min={-180} max={180} step="0.000001" value={longitude} onChange={(event) => setLongitude(event.target.value)} />
          </label>
        </div>
      </details>
      {geoError ? <p className="text-sm text-red-600">{geoError}</p> : null}
    </fieldset>
  );
}
