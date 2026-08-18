import type { TypedSupabaseClient } from "@/lib/supabase/types";

export type LeadListItem = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  status_id: string | null;
  status_name: string | null;
  created_at: string;
};

export type LeadDetail = LeadListItem & {
  needs: string | null;
  description: string | null;
};

export type LeadActivity = {
  id: string;
  body: string;
  author_name: string | null;
  created_at: string;
};

export type LeadSortKey = "name" | "email" | "created_at";
export type LeadSortDir = "asc" | "desc";

export const LEAD_SORT_KEYS: LeadSortKey[] = ["name", "email", "created_at"];

export type LeadListParams = {
  /** Matched against name OR phone OR email. */
  search?: string;
  statusId?: string;
  sort?: LeadSortKey;
  dir?: LeadSortDir;
};

export type LeadListResult = {
  leads: LeadListItem[];
  totalCount: number;
};

/** Escapes ILIKE wildcards so a literal "%"/"_" isn't treated as a pattern. */
function escapeLikePattern(value: string): string {
  return value.replace(/[%_]/g, (match) => `\\${match}`);
}

// Shape PostgREST returns with the status name embedded (a to-one join).
type LeadRow = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  status_id: string | null;
  created_at: string;
  lead_statuses: { name: string } | null;
};

/**
 * The Leads list view: DB-level search/filter/sort. Status is filterable but
 * not sortable (it's a joined name; ordering by it would need a flattening view
 * like transactions_expanded — not worth it here). Defaults to newest-first.
 */
export async function getLeadsList(
  supabase: TypedSupabaseClient,
  params: LeadListParams = {}
): Promise<LeadListResult> {
  let query = supabase
    .from("leads")
    .select(
      "id, name, phone, email, status_id, created_at, lead_statuses(name)",
      { count: "exact" }
    )
    .eq("is_deleted", false);

  if (params.search) {
    const pattern = `%${escapeLikePattern(params.search)}%`;
    query = query.or(
      `name.ilike.${pattern},phone.ilike.${pattern},email.ilike.${pattern}`
    );
  }

  if (params.statusId) {
    query = query.eq("status_id", params.statusId);
  }

  if (params.sort) {
    query = query.order(params.sort, { ascending: params.dir === "asc" });
    if (params.sort !== "name") {
      query = query.order("name", { ascending: true });
    }
  } else {
    query = query.order("created_at", { ascending: false });
  }

  const { data, error, count } = await query.returns<LeadRow[]>();
  if (error) {
    throw new Error(error.message);
  }

  const leads: LeadListItem[] = (data ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    phone: r.phone,
    email: r.email,
    status_id: r.status_id,
    status_name: r.lead_statuses?.name ?? null,
    created_at: r.created_at,
  }));

  return { leads, totalCount: count ?? 0 };
}

/** A single lead with its status name, or null if not found / deleted. */
export async function getLead(
  supabase: TypedSupabaseClient,
  id: string
): Promise<LeadDetail | null> {
  const { data, error } = await supabase
    .from("leads")
    .select(
      "id, name, phone, email, needs, description, status_id, created_at, lead_statuses(name)"
    )
    .eq("id", id)
    .eq("is_deleted", false)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }
  if (!data) return null;

  const row = data as LeadRow & {
    needs: string | null;
    description: string | null;
  };

  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    email: row.email,
    needs: row.needs,
    description: row.description,
    status_id: row.status_id,
    status_name: row.lead_statuses?.name ?? null,
    created_at: row.created_at,
  };
}

/** A lead's activity log, newest first. */
export async function getLeadActivities(
  supabase: TypedSupabaseClient,
  leadId: string
): Promise<LeadActivity[]> {
  const { data, error } = await supabase
    .from("lead_activities")
    .select("id, body, author_name, created_at")
    .eq("lead_id", leadId)
    .eq("is_deleted", false)
    .order("created_at", { ascending: false })
    .returns<LeadActivity[]>();

  if (error) {
    throw new Error(error.message);
  }
  return data ?? [];
}
