"use client";

import { FormEvent, useState } from "react";
import { useCreatePlatformOrganization } from "@/hooks/use-platform-admin";
import { Button } from "@/components/ui/button";

export function CreateOrganizationForm() {
  const create = useCreatePlatformOrganization();
  const [createdName, setCreatedName] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const organization = await create.mutateAsync({
      name: String(data.get("name") ?? ""),
      type: String(data.get("type") ?? "DEVELOPER") as "DEVELOPER" | "BROKERAGE" | "INDIVIDUAL_BROKER",
      city: optional(data.get("city")),
      country: optional(data.get("country")),
    });
    setCreatedName(organization.name);
    form.reset();
  }

  return (
    <form className="mb-5 grid gap-3 rounded-md border border-zinc-200 bg-white p-4 md:grid-cols-5" onSubmit={submit}>
      <input required name="name" aria-label="Company name" placeholder="Company name" className="h-10 rounded-md border border-zinc-300 px-3 text-sm" />
      <select name="type" aria-label="Company type" className="h-10 rounded-md border border-zinc-300 px-3 text-sm">
        <option value="DEVELOPER">Developer</option>
        <option value="BROKERAGE">Brokerage</option>
        <option value="INDIVIDUAL_BROKER">Individual broker</option>
      </select>
      <input name="city" aria-label="City" placeholder="City" className="h-10 rounded-md border border-zinc-300 px-3 text-sm" />
      <input name="country" aria-label="Country" placeholder="Country" className="h-10 rounded-md border border-zinc-300 px-3 text-sm" />
      <Button disabled={create.isPending} type="submit">{create.isPending ? "Creating" : "Create company"}</Button>
      {create.error ? <p className="text-sm text-red-700 md:col-span-5">{create.error.message}</p> : null}
      {createdName ? <p className="text-sm text-emerald-700 md:col-span-5">Created {createdName}. Open it below to create an invitation.</p> : null}
    </form>
  );
}

function optional(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text || undefined;
}
