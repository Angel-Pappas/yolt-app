import type { TypedSupabaseClient } from "@/lib/supabase/types";

export type LeadListItem = {
  id: string;
  name: string;
  origin_name: string | null;
  status_name: string | null;
  next_step: string | null;
  description: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  created_at: string;
};

export type LeadDetail = {
  id: string;
  name: string;
  origin_id: string | null;
  status_id: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  contact_landline: string | null;
  contact_website: string | null;
  contact_email: string | null;
  description: string | null;
  next_step: string | null;
  created_at: string;
};

export type LeadAction = {
  id: string;
  body: string;
  author_name: string | null;
  user_id: string;
  created_at: string;
};

export type LeadContact = {
  id: string;
  name: string | null;
  phone: string | null;
  landline: string | null;
  website: string | null;
  email: string | null;
};

export type UserOption = { id: string; name: string };

export type LeadSortKey = "name";
export type LeadSortDir = "asc" | "desc";
export const LEAD_SORT_KEYS: LeadSortKey[] = ["name"];

export type LeadListParams = {
  /** Matched against name / contact name / contact email / contact phone. */
  search?: string;
  originId?: string;
  statusId?: string;
  sort?: LeadSortKey;
  dir?: LeadSortDir;
};

export type LeadListResult = { leads: LeadListItem[]; totalCount: number };

function escapeLikePattern(value: string): string {
  return value.replace(/[%_]/g, (match) => `\\${match}`);
}

type LeadListRow = {
  id: string;
  name: string;
  next_step: string | null;
  description: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  created_at: string;
  lead_origins: { name: string } | null;
  lead_statuses: { name: string } | null;
};

export async function getLeadsList(
  supabase: TypedSupabaseClient,
  params: LeadListParams = {}
): Promise<LeadListResult> {
  let query = supabase
    .from("leads")
    .select(
      "id, name, next_step, description, contact_email, contact_phone, created_at, lead_origins(name), lead_statuses(name)",
      { count: "exact" }
    )
    .eq("is_deleted", false);

  if (params.search) {
    const p = `%${escapeLikePattern(params.search)}%`;
    query = query.or(
      `name.ilike.${p},contact_name.ilike.${p},contact_email.ilike.${p},contact_phone.ilike.${p},next_step.ilike.${p},description.ilike.${p}`
    );
  }
  if (params.originId) query = query.eq("origin_id", params.originId);
  if (params.statusId) query = query.eq("status_id", params.statusId);

  if (params.sort) {
    query = query.order(params.sort, { ascending: params.dir === "asc" });
    if (params.sort !== "name") query = query.order("name", { ascending: true });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  const { data, error, count } = await query.returns<LeadListRow[]>();
  if (error) {
    throw new Error(error.message);
  }

  const leads: LeadListItem[] = (data ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    next_step: r.next_step,
    description: r.description,
    contact_email: r.contact_email,
    contact_phone: r.contact_phone,
    created_at: r.created_at,
    origin_name: r.lead_origins?.name ?? null,
    status_name: r.lead_statuses?.name ?? null,
  }));

  return { leads, totalCount: count ?? 0 };
}

export async function getLead(
  supabase: TypedSupabaseClient,
  id: string
): Promise<LeadDetail | null> {
  const { data, error } = await supabase
    .from("leads")
    .select(
      "id, name, origin_id, status_id, contact_name, contact_phone, contact_landline, contact_website, contact_email, description, next_step, created_at"
    )
    .eq("id", id)
    .eq("is_deleted", false)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }
  return (data as LeadDetail | null) ?? null;
}

/** A lead's actions (the History sub-tab), newest first. */
export async function getLeadActions(
  supabase: TypedSupabaseClient,
  leadId: string
): Promise<LeadAction[]> {
  const { data, error } = await supabase
    .from("lead_actions")
    .select("id, body, author_name, user_id, created_at")
    .eq("lead_id", leadId)
    .eq("is_deleted", false)
    .order("created_at", { ascending: false })
    .returns<LeadAction[]>();

  if (error) {
    throw new Error(error.message);
  }
  return data ?? [];
}

/** A lead's additional contacts (the Contacts sub-tab), oldest first. */
export async function getLeadContacts(
  supabase: TypedSupabaseClient,
  leadId: string
): Promise<LeadContact[]> {
  const { data, error } = await supabase
    .from("lead_contacts")
    .select("id, name, phone, landline, website, email")
    .eq("lead_id", leadId)
    .eq("is_deleted", false)
    .order("created_at", { ascending: true })
    .returns<LeadContact[]>();

  if (error) {
    throw new Error(error.message);
  }
  return data ?? [];
}

/**
 * Active users for the action's actor picker. Only meaningful for admins — the
 * profiles RLS returns just the caller's own row to a non-admin (who doesn't use
 * the picker anyway).
 */
export async function getUsersForPicker(
  supabase: TypedSupabaseClient
): Promise<UserOption[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .eq("is_active", true);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? [])
    .map((p) => ({ id: p.id, name: p.full_name || p.email || "User" }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
