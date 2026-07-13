"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { KeyRound, Plus, QrCode, RotateCcw, ShieldOff } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { PagePermissionGuard } from "@/components/page-permission-guard";
import { DetailCard } from "@/components/platform/detail-card";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n";
import {
  createBuildingApi,
  createCustomerApi,
  createQrPassApi,
  createRealEstateProjectApi,
  createUnitApi,
  createUnitAssignmentApi,
  getUnitApi,
  listBuildingsApi,
  listCustomersApi,
  listMyQrPassesApi,
  listMyUnitsApi,
  listRealEstateProjectsApi,
  listUnitsApi,
  regenerateQrPassApi,
  revokeQrPassApi,
  suspendQrPassApi,
  type Unit,
  type UnitQrPass,
} from "@/lib/real-estate-api";

export function RealEstateOverviewPage() {
  const { t } = useI18n();
  const projects = useQuery({ queryKey: ["real-estate", "projects"], queryFn: listRealEstateProjectsApi });
  const buildings = useQuery({ queryKey: ["real-estate", "buildings"], queryFn: listBuildingsApi });
  const units = useQuery({ queryKey: ["real-estate", "units"], queryFn: listUnitsApi });
  const customers = useQuery({ queryKey: ["customers"], queryFn: listCustomersApi });
  return (
    <PagePermissionGuard permissions={["real_estate.units.view", "real_estate.projects.view"]}>
      <PageHeader title={t("realEstate.title")} description={t("realEstate.description")} />
      <div className="grid gap-4 md:grid-cols-4">
        <Metric label={t("realEstate.projects")} value={projects.data?.length ?? 0} />
        <Metric label={t("realEstate.buildings")} value={buildings.data?.length ?? 0} />
        <Metric label={t("realEstate.units")} value={units.data?.length ?? 0} />
        <Metric label={t("realEstate.customers")} value={customers.data?.length ?? 0} />
      </div>
      <QrClarification />
    </PagePermissionGuard>
  );
}

export function ProjectsPage() {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["real-estate", "projects"], queryFn: listRealEstateProjectsApi });
  const mutation = useMutation({ mutationFn: createRealEstateProjectApi, onSuccess: () => queryClient.invalidateQueries({ queryKey: ["real-estate", "projects"] }) });
  const [form, setForm] = useState({ name: "", code: "", address: "" });
  return (
    <PagePermissionGuard permissions={["real_estate.projects.view"]}>
      <PageHeader title={t("realEstate.projects")} />
      <CreateRow onSubmit={() => mutation.mutate(form)} disabled={!form.name || !form.code} labels={[["name", t("common.name")], ["code", t("realEstate.code")], ["address", t("realEstate.address")]]} form={form} setForm={setForm} />
      <RecordGrid records={query.data ?? []} render={(project) => (
        <Record key={project.id} title={project.name} meta={`${project.code} - ${project.status}`} href={`/real-estate/projects/${project.id}`} />
      )} />
    </PagePermissionGuard>
  );
}

export function BuildingsPage() {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const projects = useQuery({ queryKey: ["real-estate", "projects"], queryFn: listRealEstateProjectsApi });
  const buildings = useQuery({ queryKey: ["real-estate", "buildings"], queryFn: listBuildingsApi });
  const mutation = useMutation({ mutationFn: createBuildingApi, onSuccess: () => queryClient.invalidateQueries({ queryKey: ["real-estate", "buildings"] }) });
  const [form, setForm] = useState({ projectId: "", name: "", code: "", floorsCount: "" });
  return (
    <PagePermissionGuard permissions={["real_estate.buildings.view"]}>
      <PageHeader title={t("realEstate.buildings")} />
      <DetailCard title={t("realEstate.createBuilding")}>
        <div className="grid gap-3 md:grid-cols-4">
          <select className="ui-input" value={form.projectId} onChange={(event) => setForm({ ...form, projectId: event.target.value })}>
            <option value="">{t("realEstate.selectProject")}</option>
            {(projects.data ?? []).map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
          </select>
          <input className="ui-input" placeholder={t("common.name")} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
          <input className="ui-input" placeholder={t("realEstate.code")} value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} />
          <Button disabled={!form.projectId || !form.name || !form.code} onClick={() => mutation.mutate({ ...form, floorsCount: form.floorsCount ? Number(form.floorsCount) : undefined })}>
            <Plus className="h-4 w-4" />{t("common.create")}
          </Button>
        </div>
      </DetailCard>
      <RecordGrid records={buildings.data ?? []} render={(building) => <Record key={building.id} title={building.name} meta={`${building.project?.name ?? ""} - ${building.code}`} href={`/real-estate/buildings/${building.id}`} />} />
    </PagePermissionGuard>
  );
}

export function UnitsPage() {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const buildings = useQuery({ queryKey: ["real-estate", "buildings"], queryFn: listBuildingsApi });
  const units = useQuery({ queryKey: ["real-estate", "units"], queryFn: listUnitsApi });
  const mutation = useMutation({ mutationFn: createUnitApi, onSuccess: () => queryClient.invalidateQueries({ queryKey: ["real-estate", "units"] }) });
  const [form, setForm] = useState({ buildingId: "", unitNumber: "", unitCode: "", unitType: "APARTMENT" });
  return (
    <PagePermissionGuard permissions={["real_estate.units.view"]}>
      <PageHeader title={t("realEstate.units")} />
      <DetailCard title={t("realEstate.createUnit")}>
        <div className="grid gap-3 md:grid-cols-5">
          <select className="ui-input" value={form.buildingId} onChange={(event) => setForm({ ...form, buildingId: event.target.value })}>
            <option value="">{t("realEstate.selectBuilding")}</option>
            {(buildings.data ?? []).map((building) => <option key={building.id} value={building.id}>{building.name}</option>)}
          </select>
          <input className="ui-input" placeholder={t("realEstate.unitNumber")} value={form.unitNumber} onChange={(event) => setForm({ ...form, unitNumber: event.target.value })} />
          <input className="ui-input" placeholder={t("realEstate.unitCode")} value={form.unitCode} onChange={(event) => setForm({ ...form, unitCode: event.target.value })} />
          <select className="ui-input" value={form.unitType} onChange={(event) => setForm({ ...form, unitType: event.target.value })}>
            {["APARTMENT", "VILLA", "OFFICE", "RETAIL", "CHALET", "OTHER"].map((type) => <option key={type}>{type}</option>)}
          </select>
          <Button disabled={!form.buildingId || !form.unitNumber || !form.unitCode} onClick={() => mutation.mutate(form)}>
            <Plus className="h-4 w-4" />{t("common.create")}
          </Button>
        </div>
      </DetailCard>
      <RecordGrid records={units.data ?? []} render={(unit) => <UnitRecord key={unit.id} unit={unit} />} />
    </PagePermissionGuard>
  );
}

export function UnitDetailPage() {
  const { t } = useI18n();
  const params = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const unit = useQuery({ queryKey: ["real-estate", "units", params.id], queryFn: () => getUnitApi(params.id), enabled: Boolean(params.id) });
  const customers = useQuery({ queryKey: ["customers"], queryFn: listCustomersApi });
  const assign = useMutation({ mutationFn: (customerProfileId: string) => createUnitAssignmentApi(params.id, { customerProfileId, relationType: "RESIDENT" }), onSuccess: () => queryClient.invalidateQueries({ queryKey: ["real-estate", "units", params.id] }) });
  const qr = useMutation({ mutationFn: () => createQrPassApi(params.id, { passType: "UNIT" }), onSuccess: () => queryClient.invalidateQueries({ queryKey: ["real-estate", "units", params.id] }) });
  const [customerId, setCustomerId] = useState("");
  return (
    <PagePermissionGuard permissions={["real_estate.units.view"]}>
      <PageHeader title={unit.data?.unitCode ?? t("realEstate.unit")} />
      <QrClarification />
      <DetailCard title={t("realEstate.assignments")}>
        <div className="mb-4 flex gap-2">
          <select className="ui-input max-w-sm" value={customerId} onChange={(event) => setCustomerId(event.target.value)}>
            <option value="">{t("realEstate.selectCustomer")}</option>
            {(customers.data ?? []).map((customer) => <option key={customer.id} value={customer.id}>{customer.fullName}</option>)}
          </select>
          <Button disabled={!customerId} onClick={() => assign.mutate(customerId)}>{t("realEstate.assignCustomer")}</Button>
        </div>
        <RecordGrid records={unit.data?.assignments ?? []} render={(assignment) => <Record key={assignment.id} title={assignment.customerProfile?.fullName ?? assignment.customerProfileId} meta={assignment.relationType} />} />
      </DetailCard>
      <DetailCard title={t("realEstate.qrPasses")} actions={<Button onClick={() => qr.mutate()}><QrCode className="h-4 w-4" />{t("realEstate.generateQr")}</Button>}>
        <QrList passes={unit.data?.qrPasses ?? []} unitId={params.id} />
      </DetailCard>
    </PagePermissionGuard>
  );
}

export function CustomersPage() {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["customers"], queryFn: listCustomersApi });
  const mutation = useMutation({ mutationFn: createCustomerApi, onSuccess: () => queryClient.invalidateQueries({ queryKey: ["customers"] }) });
  const [form, setForm] = useState({ fullName: "", phone: "", email: "", status: "RESIDENT" });
  return (
    <PagePermissionGuard permissions={["customers.view"]}>
      <PageHeader title={t("realEstate.customers")} />
      <CreateRow onSubmit={() => mutation.mutate(form)} disabled={!form.fullName || !form.phone} labels={[["fullName", t("realEstate.fullName")], ["phone", t("realEstate.phone")], ["email", t("realEstate.email")]]} form={form} setForm={setForm} />
      <RecordGrid records={query.data ?? []} render={(customer) => <Record key={customer.id} title={customer.fullName} meta={`${customer.status} - ${customer.phone}`} href={`/real-estate/customers/${customer.id}`} />} />
    </PagePermissionGuard>
  );
}

export function QrPassesPage() {
  const { t } = useI18n();
  const units = useQuery({ queryKey: ["real-estate", "units"], queryFn: listUnitsApi });
  const passes = useMemo(() => (units.data ?? []).flatMap((unit) => (unit.qrPasses ?? []).map((pass) => ({ ...pass, unit }))), [units.data]);
  return (
    <PagePermissionGuard permissions={["qr_passes.view"]}>
      <PageHeader title={t("realEstate.qrAccessPass")} />
      <QrClarification />
      <QrList passes={passes} />
    </PagePermissionGuard>
  );
}

export function MyUnitsPage() {
  const { t } = useI18n();
  const query = useQuery({ queryKey: ["my", "units"], queryFn: listMyUnitsApi });
  return (
    <PagePermissionGuard permissions={["self.units.view"]}>
      <PageHeader title={t("realEstate.myUnits")} />
      <RecordGrid records={query.data ?? []} empty={t("realEstate.noAssignedUnits")} render={(unit) => <UnitRecord key={unit.id} unit={unit} href={`/my/units/${unit.id}`} />} />
    </PagePermissionGuard>
  );
}

export function MyUnitDetailPage() {
  const params = useParams<{ id: string }>();
  const { t } = useI18n();
  const query = useQuery({ queryKey: ["my", "units"], queryFn: listMyUnitsApi });
  const unit = query.data?.find((item) => item.id === params.id);
  return (
    <PagePermissionGuard permissions={["self.units.view"]}>
      <PageHeader title={unit?.unitCode ?? t("realEstate.unit")} />
      {unit ? <UnitResidentPanel unit={unit} /> : <DetailCard title={t("realEstate.accessDenied")}>{t("realEstate.unitNotAssigned")}</DetailCard>}
    </PagePermissionGuard>
  );
}

export function MyQrPassesPage() {
  const { t } = useI18n();
  const query = useQuery({ queryKey: ["my", "qr-passes"], queryFn: listMyQrPassesApi });
  return (
    <PagePermissionGuard permissions={["self.qr_passes.view"]}>
      <PageHeader title={t("realEstate.myQrPasses")} />
      <QrList passes={query.data ?? []} />
    </PagePermissionGuard>
  );
}

function QrList({ passes }: { passes: UnitQrPass[]; unitId?: string }) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const revoke = useMutation({ mutationFn: revokeQrPassApi, onSuccess: () => queryClient.invalidateQueries() });
  const suspend = useMutation({ mutationFn: suspendQrPassApi, onSuccess: () => queryClient.invalidateQueries() });
  const regenerate = useMutation({ mutationFn: regenerateQrPassApi, onSuccess: () => queryClient.invalidateQueries() });
  if (!passes.length) return <p className="text-sm text-[var(--color-muted)]">{t("realEstate.noActiveQrPass")}</p>;
  return (
    <div className="grid gap-3">
      {passes.map((pass) => (
        <div key={pass.id} className="rounded-md border border-[var(--color-border)] p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-semibold">{pass.displayCode ?? pass.id}</p>
              <p className="text-sm text-[var(--color-muted)]">{pass.passType} - {pass.status}</p>
              {pass.qrPayload ? <code className="mt-2 block rounded bg-[var(--color-surface-muted)] p-2 text-xs">{pass.qrPayload}</code> : null}
            </div>
            <div className="flex gap-2">
              <Button className="ui-button-secondary" onClick={() => regenerate.mutate(pass.id)}><RotateCcw className="h-4 w-4" />{t("realEstate.regenerateQr")}</Button>
              <Button className="ui-button-secondary" onClick={() => suspend.mutate(pass.id)}><ShieldOff className="h-4 w-4" />{t("realEstate.suspendQr")}</Button>
              <Button className="ui-button-secondary" onClick={() => revoke.mutate(pass.id)}>{t("realEstate.revokeQr")}</Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function UnitResidentPanel({ unit }: { unit: Unit }) {
  const { t } = useI18n();
  return (
    <div className="grid gap-4">
      <DetailCard title={t("realEstate.unitDetails")}>
        <div className="grid gap-2 text-sm md:grid-cols-2">
          <p>{t("realEstate.project")}: {unit.project?.name ?? "-"}</p>
          <p>{t("realEstate.building")}: {unit.building?.name ?? "-"}</p>
          <p>{t("realEstate.unitNumber")}: {unit.unitNumber}</p>
          <p>{t("realEstate.qrStatus")}: {unit.qrPasses?.[0]?.status ?? t("realEstate.noActiveQrPass")}</p>
        </div>
      </DetailCard>
      <DetailCard title={t("realEstate.filesPlaceholder")}>{t("realEstate.placeholderBody")}</DetailCard>
      <DetailCard title={t("realEstate.paymentsPlaceholder")}>{t("realEstate.placeholderBody")}</DetailCard>
      <DetailCard title={t("realEstate.servicesPlaceholder")}>{t("realEstate.placeholderBody")}</DetailCard>
      <DetailCard title={t("realEstate.supportPlaceholder")}>{t("realEstate.placeholderBody")}</DetailCard>
    </div>
  );
}

function QrClarification() {
  const { t } = useI18n();
  return (
    <DetailCard title={t("realEstate.qrAccessPass")}>
      <p className="flex items-center gap-2 text-sm text-[var(--color-muted)]">
        <KeyRound className="h-4 w-4" />
        {t("realEstate.smartGateNotConfigured")}
      </p>
    </DetailCard>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return <div className="rounded-md border border-[var(--color-border)] p-4"><p className="text-sm text-[var(--color-muted)]">{label}</p><p className="mt-2 text-2xl font-semibold">{value}</p></div>;
}

function UnitRecord({ unit, href }: { unit: Unit; href?: string }) {
  return <Record title={unit.unitCode} meta={`${unit.project?.name ?? ""} ${unit.building?.name ?? ""} - ${unit.status}`} href={href ?? `/real-estate/units/${unit.id}`} />;
}

function Record({ title, meta, href }: { title: string; meta?: string; href?: string }) {
  const body = <div className="rounded-md border border-[var(--color-border)] p-4 hover:bg-[var(--color-surface-muted)]"><p className="font-semibold">{title}</p>{meta ? <p className="text-sm text-[var(--color-muted)]">{meta}</p> : null}</div>;
  return href ? <Link href={href}>{body}</Link> : body;
}

function RecordGrid<T>({ records, render, empty }: { records: T[]; render: (record: T) => ReactNode; empty?: string }) {
  const { t } = useI18n();
  return <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{records.length ? records.map(render) : <p className="text-sm text-[var(--color-muted)]">{empty ?? t("common.noData")}</p>}</div>;
}

function CreateRow<T extends Record<string, string>>({ labels, form, setForm, onSubmit, disabled }: { labels: Array<[keyof T & string, string]>; form: T; setForm: (value: T) => void; onSubmit: () => void; disabled: boolean }) {
  const { t } = useI18n();
  return (
    <DetailCard title={t("common.create")}>
      <div className="grid gap-3 md:grid-cols-4">
        {labels.map(([key, label]) => <input key={key} className="ui-input" placeholder={label} value={form[key] ?? ""} onChange={(event) => setForm({ ...form, [key]: event.target.value })} />)}
        <Button disabled={disabled} onClick={onSubmit}><Plus className="h-4 w-4" />{t("common.create")}</Button>
      </div>
    </DetailCard>
  );
}
