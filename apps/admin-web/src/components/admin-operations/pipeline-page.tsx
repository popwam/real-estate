"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { LoadingState } from "@/components/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { DetailCard } from "@/components/platform/detail-card";
import { useCreateOperation, usePatchOperation } from "@/hooks/use-admin-operations";
import { useCrmLeads, useCrmPipelineStages } from "@/hooks/use-admin-crm";
import type { CrmLead } from "@/types/admin-crm";

export function PipelinePage({ leadBasePath = "/developer/crm/leads" }: { leadBasePath?: string }) {
  const stagesQuery = useCrmPipelineStages();
  const { data: stages = [], isLoading: stagesLoading, error: stagesError, refetch: refetchStages } = stagesQuery;
  const { data: leads, isLoading: leadsLoading, error: leadsError, refetch: refetchLeads } = useCrmLeads({ page: 1, pageSize: 100 });
  const createStage = useCreateOperation("pipeline-stages", "/crm/pipeline/stages");
  const patch = usePatchOperation("pipeline-stage-move");
  const [stageName, setStageName] = useState("");
  const [selectedLead, setSelectedLead] = useState("");
  const [selectedStage, setSelectedStage] = useState("");
  const [moveNote, setMoveNote] = useState("");
  const [search, setSearch] = useState("");

  const leadsByStage = useMemo(() => {
    const map = new Map<string, CrmLead[]>();
    for (const lead of leads?.items ?? []) {
      const query = search.trim().toLowerCase();
      if (query && !`${lead.client?.name ?? ""} ${lead.status} ${lead.project?.name ?? ""}`.toLowerCase().includes(query)) continue;
      const key = lead.pipelineStageId ?? "unassigned";
      map.set(key, [...(map.get(key) ?? []), lead]);
    }
    return map;
  }, [leads?.items, search]);

  async function create() {
    if (!stageName.trim()) return;
    await createStage.mutateAsync({ name: stageName });
    setStageName("");
  }

  async function moveLead() {
    if (!selectedLead || !selectedStage) return;
    await patch.mutateAsync({ path: `/crm/leads/${selectedLead}/stage`, input: { stageId: selectedStage, note: moveNote.trim() || undefined } });
    setSelectedLead("");
    setSelectedStage("");
    setMoveNote("");
  }

  return (
    <>
      <PageHeader title="CRM pipeline" description="Foundation Kanban view with stage columns and a simple lead move action." />
      <div className="space-y-6">
        {(stagesError || leadsError) ? (
          <DetailCard title="Pipeline loading issue">
            <p className="text-sm text-red-700">{stagesError?.message ?? leadsError?.message}</p>
            <button className="mt-3 rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium" onClick={() => { void refetchStages(); void refetchLeads(); }}>
              Retry
            </button>
          </DetailCard>
        ) : null}
        {stagesLoading || leadsLoading ? <LoadingState label="Loading CRM pipeline" /> : null}
        <DetailCard title="Filter leads">
          <input className="h-10 w-full rounded-md border border-zinc-300 px-3 text-sm" placeholder="Search by lead, status, or project" value={search} onChange={(event) => setSearch(event.target.value)} />
        </DetailCard>
        <DetailCard title="Stage setup">
          <div className="flex gap-2">
            <input className="h-10 rounded-md border border-zinc-300 px-3 text-sm" placeholder="New stage name" value={stageName} onChange={(event) => setStageName(event.target.value)} />
            <button className="h-10 rounded-md bg-zinc-950 px-4 text-sm font-medium text-white" onClick={create}>Add stage</button>
          </div>
        </DetailCard>
        <DetailCard title="Move lead">
          <div className="grid gap-3 md:grid-cols-4">
            <select className="h-10 rounded-md border border-zinc-300 px-3 text-sm" value={selectedLead} onChange={(event) => setSelectedLead(event.target.value)}>
              <option value="">Select lead</option>
              {(leads?.items ?? []).map((lead) => <option key={lead.id} value={lead.id}>{lead.client?.name ?? lead.id}</option>)}
            </select>
            <select className="h-10 rounded-md border border-zinc-300 px-3 text-sm" value={selectedStage} onChange={(event) => setSelectedStage(event.target.value)}>
              <option value="">Select stage</option>
              {stages.map((stage) => <option key={stage.id} value={stage.id}>{stage.name}</option>)}
            </select>
            <input className="h-10 rounded-md border border-zinc-300 px-3 text-sm" placeholder="Optional move note" value={moveNote} onChange={(event) => setMoveNote(event.target.value)} />
            <button className="h-10 rounded-md bg-zinc-950 px-4 text-sm font-medium text-white" onClick={moveLead}>Move</button>
          </div>
          {patch.error ? <p className="mt-3 text-sm text-red-700">{patch.error.message}</p> : null}
        </DetailCard>
        <div className="grid gap-4 lg:grid-cols-4">
          {stages.map((stage) => (
            <section className="rounded-md border border-zinc-200 bg-white p-3" key={stage.id}>
              <h2 className="text-sm font-semibold text-zinc-900">{stage.name}</h2>
              <div className="mt-3 space-y-2">
                {(leadsByStage.get(stage.id) ?? []).map((lead) => (
                  <div className="rounded-md border border-zinc-200 p-3 text-sm" key={lead.id}>
                    <Link className="font-medium text-zinc-900 hover:underline" href={`${leadBasePath}/${lead.id}`}>
                      {lead.client?.name ?? "CRM lead"}
                    </Link>
                    <p className="text-zinc-500">{lead.status}{lead.project?.name ? ` · ${lead.project.name}` : ""}</p>
                    <p className="mt-1 text-xs text-zinc-400">Stage history is available on lead detail.</p>
                  </div>
                ))}
                {!(leadsByStage.get(stage.id) ?? []).length ? <p className="text-sm text-zinc-500">No leads.</p> : null}
              </div>
            </section>
          ))}
        </div>
      </div>
    </>
  );
}
