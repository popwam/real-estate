"use client";

import { Copy } from "lucide-react";
import type { OrganizationDomain } from "@/types/admin-public";

export function DomainVerificationInstructions({ domain }: { domain: OrganizationDomain }) {
  const instructions = domain.verificationInstructions;

  return (
    <div className="space-y-3 rounded-md border border-zinc-200 bg-zinc-50 p-4">
      <div>
        <h3 className="text-sm font-semibold text-zinc-950">TXT verification</h3>
        <p className="mt-1 text-sm leading-6 text-zinc-500">
          Add this TXT record at your DNS provider, then request verification. No DNS provider is called from this UI.
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <Instruction label="TXT name" value={instructions?.txtName ?? `_popwam.${domain.domain}`} />
        <Instruction label="TXT value" value={instructions?.txtValue ?? domain.verificationToken} />
      </div>
    </div>
  );
}

function Instruction({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase text-zinc-500">{label}</dt>
      <dd className="mt-1 flex items-start gap-2 rounded-md bg-white p-2 text-zinc-900 ring-1 ring-inset ring-zinc-200">
        <span className="min-w-0 flex-1 break-all font-mono text-xs">{value}</span>
        <button
          type="button"
          className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-100 hover:text-zinc-950"
          title={`Copy ${label}`}
          onClick={() => void navigator.clipboard?.writeText(value)}
        >
          <Copy className="h-4 w-4" aria-hidden="true" />
          <span className="sr-only">Copy {label}</span>
        </button>
      </dd>
    </div>
  );
}
