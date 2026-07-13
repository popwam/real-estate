"use client";

import { apiRequest } from "@/lib/api";

export type CustomerProfile = {
  id: string;
  organizationId: string;
  userId?: string | null;
  fullName: string;
  phone: string;
  email?: string | null;
  preferredLanguage: string;
  status: string;
};

export type RealEstateProject = {
  id: string;
  organizationId: string;
  name: string;
  code: string;
  address?: string | null;
  status: string;
};

export type Building = {
  id: string;
  organizationId: string;
  projectId: string;
  name: string;
  code: string;
  floorsCount?: number | null;
  project?: RealEstateProject;
};

export type Unit = {
  id: string;
  organizationId: string;
  projectId: string;
  buildingId: string;
  floorId?: string | null;
  unitNumber: string;
  unitCode: string;
  unitType: string;
  status: string;
  area?: string | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  qrPassEnabled: boolean;
  project?: RealEstateProject;
  building?: Building;
  assignments?: UnitCustomerAssignment[];
  qrPasses?: UnitQrPass[];
};

export type UnitCustomerAssignment = {
  id: string;
  unitId: string;
  customerProfileId: string;
  userId?: string | null;
  relationType: string;
  isActive: boolean;
  customerProfile?: CustomerProfile;
};

export type UnitQrPass = {
  id: string;
  unitId: string;
  passType: string;
  displayCode?: string | null;
  status: string;
  expiresAt?: string | null;
  qrToken?: string;
  qrPayload?: string;
  unit?: Unit;
};

export function listCustomersApi() {
  return apiRequest<CustomerProfile[]>("/customers");
}

export function createCustomerApi(input: Partial<CustomerProfile>) {
  return apiRequest<CustomerProfile>("/customers", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function listRealEstateProjectsApi() {
  return apiRequest<RealEstateProject[]>("/real-estate/projects");
}

export function createRealEstateProjectApi(input: Partial<RealEstateProject>) {
  return apiRequest<RealEstateProject>("/real-estate/projects", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function listBuildingsApi() {
  return apiRequest<Building[]>("/real-estate/buildings");
}

export function createBuildingApi(input: Partial<Building>) {
  return apiRequest<Building>("/real-estate/buildings", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function listUnitsApi() {
  return apiRequest<Unit[]>("/real-estate/units");
}

export function getUnitApi(id: string) {
  return apiRequest<Unit>(`/real-estate/units/${id}`);
}

export function createUnitApi(input: Partial<Unit>) {
  return apiRequest<Unit>("/real-estate/units", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function createUnitAssignmentApi(unitId: string, input: Partial<UnitCustomerAssignment>) {
  return apiRequest<UnitCustomerAssignment>(`/real-estate/units/${unitId}/assignments`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function createQrPassApi(unitId: string, input: Partial<UnitQrPass>) {
  return apiRequest<UnitQrPass>(`/real-estate/units/${unitId}/qr-passes`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function revokeQrPassApi(id: string) {
  return apiRequest<UnitQrPass>(`/real-estate/qr-passes/${id}/revoke`, { method: "POST" });
}

export function suspendQrPassApi(id: string) {
  return apiRequest<UnitQrPass>(`/real-estate/qr-passes/${id}/suspend`, { method: "POST" });
}

export function regenerateQrPassApi(id: string) {
  return apiRequest<UnitQrPass>(`/real-estate/qr-passes/${id}/regenerate`, { method: "POST" });
}

export function listMyUnitsApi() {
  return apiRequest<Unit[]>("/me/units");
}

export function getMyUnitApi(id: string) {
  return apiRequest<Unit>(`/me/units/${id}`);
}

export function listMyQrPassesApi() {
  return apiRequest<UnitQrPass[]>("/me/qr-passes");
}
