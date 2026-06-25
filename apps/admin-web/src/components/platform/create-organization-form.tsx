"use client";

import { FormEvent, useState } from "react";
import { useCreatePlatformOrganization } from "@/hooks/use-platform-admin";
import { FeedbackState } from "@/components/feedback-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
    <section className="ui-card mb-5 p-4">
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-[var(--color-foreground)]">Create organization record</h2>
        <p className="mt-1 text-sm leading-6 text-[var(--color-muted)]">
          Create the company shell first, then open its dossier to review profile data and issue invitations.
        </p>
      </div>
      <form className="grid gap-3 lg:grid-cols-[1.2fr_220px_1fr_1fr_auto]" onSubmit={submit}>
        <div className="space-y-2">
          <Label htmlFor="platform-org-name">Company name</Label>
          <Input required id="platform-org-name" name="name" placeholder="Company name" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="platform-org-type">Company type</Label>
          <select id="platform-org-type" name="type" className="ui-input">
            <option value="DEVELOPER">Developer</option>
            <option value="BROKERAGE">Brokerage</option>
            <option value="INDIVIDUAL_BROKER">Individual broker</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="platform-org-city">City</Label>
          <Input id="platform-org-city" name="city" placeholder="City" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="platform-org-country">Country</Label>
          <Input id="platform-org-country" name="country" placeholder="Country" />
        </div>
        <div className="flex items-end">
          <Button className="w-full" disabled={create.isPending} type="submit">
            {create.isPending ? "Creating" : "Create"}
          </Button>
        </div>
        {create.error ? (
          <FeedbackState
            className="lg:col-span-5"
            tone="error"
            title="Could not create organization"
            description={create.error.message}
          />
        ) : null}
        {createdName ? (
          <FeedbackState
            className="lg:col-span-5"
            tone="success"
            title={`${createdName} was created`}
            description="Open the dossier below to review details, add verification context, and create invitations."
          />
        ) : null}
      </form>
    </section>
  );
}

function optional(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text || undefined;
}
