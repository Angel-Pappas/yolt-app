import type { TypedSupabaseClient } from "@/lib/supabase/types";

export type LeadListItem = {
  id: string;
  name: string;
  sort_order: number | null;
  origin_name: string | null;
  status_id: string | null;
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
  sort_order: number | null;
  origin_id: string | null;
  status_id: string | null;
  website: string | null;
  contact_name: string | null;
  contact_position: string | null;
  contact_phone: string | null;
  contact_landline: string | null;
  contact_email: string | null;
  description: string | null;
  next_step: string | null;
  campaign_platform: string | null;
  campaign_we_are: string | null;
  campaign_we_want: string | null;
  created_at: string;
};

export type LeadAction = {
  id: string;
  body: string;
  action_date: string;
  author_name: string | null;
  user_id: string;
  created_at: string;
};

export type LeadContact = {
  id: string;
  name: string | null;
  position: string | null;
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
  /** Multi-select origin ids; any of them. */
  originIds?: string[];
  /** Multi-select status ids; any of them. The sentinel "none" matches leads with no status set, and may be combined with real ids. */
  statusIds?: string[];
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
  sort_order: number | null;
  status_id: string | null;
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
      "id, name, sort_order, status_id, next_step, description, contact_email, contact_phone, created_at, lead_origins(name), lead_statuses(name)",
      { count: "exact" }
    )
    .eq("is_deleted", false);

  if (params.search) {
    const p = `%${escapeLikePattern(params.search)}%`;
    query = query.or(
      `name.ilike.${p},contact_name.ilike.${p},contact_email.ilike.${p},contact_phone.ilike.${p},next_step.ilike.${p},description.ilike.${p}`
    );
  }
  if (params.originIds?.length) query = query.in("origin_id", params.originIds);
  // "none" is the sentinel for the "No status" filter option; it can be
  // ticked alongside real statuses, so the two combine into an OR.
  if (params.statusIds?.length) {
    const hasNone = params.statusIds.includes("none");
    const realIds = params.statusIds.filter((s) => s !== "none");
    if (hasNone && realIds.length) {
      query = query.or(`status_id.is.null,status_id.in.(${realIds.join(",")})`);
    } else if (hasNone) {
      query = query.is("status_id", null);
    } else {
      query = query.in("status_id", realIds);
    }
  }

  if (params.sort) {
    query = query.order(params.sort, { ascending: params.dir === "asc" });
    if (params.sort !== "name") query = query.order("name", { ascending: true });
  } else {
    // Default: the manual Order number, smallest first, with the empty
    // (never-numbered) leads last; newest-first as a stable tiebreak.
    query = query
      .order("sort_order", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false });
  }

  const { data, error, count } = await query.returns<LeadListRow[]>();
  if (error) {
    throw new Error(error.message);
  }

  const leads: LeadListItem[] = (data ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    sort_order: r.sort_order,
    status_id: r.status_id,
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
      "id, name, sort_order, origin_id, status_id, website, contact_name, contact_position, contact_phone, contact_landline, contact_email, description, next_step, campaign_platform, campaign_we_are, campaign_we_want, created_at"
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
    .select("id, body, action_date, author_name, user_id, created_at")
    .eq("lead_id", leadId)
    .eq("is_deleted", false)
    .order("action_date", { ascending: false })
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
    .select("id, name, position, phone, landline, website, email")
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
