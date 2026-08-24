import type { TypedSupabaseClient } from "@/lib/supabase/types";

export type ProjectListItem = {
  id: string;
  name: string;
  sort_order: number | null;
  status_id: string | null;
  status_name: string | null;
  next_step: string | null;
  value: number | null;
  estimated_months: number | null;
  lead_id: string | null;
  /** The main contact's name, read from the linked lead (never duplicated). */
  contact_name: string | null;
  created_at: string;
};

export type ProjectDetail = {
  id: string;
  name: string;
  sort_order: number | null;
  lead_id: string | null;
  status_id: string | null;
  description: string | null;
  value: number | null;
  estimated_months: number | null;
  next_step: string | null;
  created_at: string;
  /** The originating lead's name + main contact, for the header and the "View lead" link. */
  lead_name: string | null;
  contact_name: string | null;
};

export type ProjectAction = {
  id: string;
  body: string;
  action_date: string;
  author_name: string | null;
  user_id: string;
  created_at: string;
};

export type ProjectSortKey = "name";
export type ProjectSortDir = "asc" | "desc";
export const PROJECT_SORT_KEYS: ProjectSortKey[] = ["name"];

export type ProjectListParams = {
  /** Matched against name / description / next step. */
  search?: string;
  /** Multi-select status ids; any of them. The sentinel "none" matches projects with no status set. */
  statusIds?: string[];
  sort?: ProjectSortKey;
  dir?: ProjectSortDir;
};

export type ProjectListResult = { projects: ProjectListItem[]; totalCount: number };

function escapeLikePattern(value: string): string {
  return value.replace(/[%_]/g, (match) => `\\${match}`);
}

type ProjectListRow = {
  id: string;
  name: string;
  sort_order: number | null;
  status_id: string | null;
  next_step: string | null;
  value: number | string | null;
  estimated_months: number | null;
  lead_id: string | null;
  created_at: string;
  leads: { name: string; contact_name: string | null } | null;
  project_statuses: { name: string } | null;
};

export async function getProjectsList(
  supabase: TypedSupabaseClient,
  params: ProjectListParams = {}
): Promise<ProjectListResult> {
  let query = supabase
    .from("projects")
    .select(
      "id, name, sort_order, status_id, next_step, value, estimated_months, lead_id, created_at, leads(name, contact_name), project_statuses(name)",
      { count: "exact" }
    )
    .eq("is_deleted", false);

  if (params.search) {
    const p = `%${escapeLikePattern(params.search)}%`;
    query = query.or(
      `name.ilike.${p},description.ilike.${p},next_step.ilike.${p}`
    );
  }
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
    // Default: the auto Order number, smallest first, empties last; newest-first
    // as a stable tiebreak.
    query = query
      .order("sort_order", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false });
  }

  const { data, error, count } = await query.returns<ProjectListRow[]>();
  if (error) {
    throw new Error(error.message);
  }

  const projects: ProjectListItem[] = (data ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    sort_order: r.sort_order,
    status_id: r.status_id,
    next_step: r.next_step,
    value: r.value === null ? null : Number(r.value),
    estimated_months: r.estimated_months,
    lead_id: r.lead_id,
    created_at: r.created_at,
    contact_name: r.leads?.contact_name ?? null,
    status_name: r.project_statuses?.name ?? null,
  }));

  return { projects, totalCount: count ?? 0 };
}

type ProjectDetailRow = {
  id: string;
  name: string;
  sort_order: number | null;
  lead_id: string | null;
  status_id: string | null;
  description: string | null;
  value: number | string | null;
  estimated_months: number | null;
  next_step: string | null;
  created_at: string;
  leads: { name: string; contact_name: string | null } | null;
};

export async function getProject(
  supabase: TypedSupabaseClient,
  id: string
): Promise<ProjectDetail | null> {
  const { data, error } = await supabase
    .from("projects")
    .select(
      "id, name, sort_order, lead_id, status_id, description, value, estimated_months, next_step, created_at, leads(name, contact_name)"
    )
    .eq("id", id)
    .eq("is_deleted", false)
    .maybeSingle<ProjectDetailRow>();

  if (error) {
    throw new Error(error.message);
  }
  if (!data) return null;

  return {
    id: data.id,
    name: data.name,
    sort_order: data.sort_order,
    lead_id: data.lead_id,
    status_id: data.status_id,
    description: data.description,
    value: data.value === null ? null : Number(data.value),
    estimated_months: data.estimated_months,
    next_step: data.next_step,
    created_at: data.created_at,
    lead_name: data.leads?.name ?? null,
    contact_name: data.leads?.contact_name ?? null,
  };
}

/**
 * The active project (if any) created from a given lead — used by the lead page
 * to show either a "Convert to project" button or a "View project" link.
 */
export async function getProjectForLead(
  supabase: TypedSupabaseClient,
  leadId: string
): Promise<{ id: string; name: string } | null> {
  const { data, error } = await supabase
    .from("projects")
    .select("id, name")
    .eq("lead_id", leadId)
    .eq("is_deleted", false)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle<{ id: string; name: string }>();

  if (error) {
    throw new Error(error.message);
  }
  return data ?? null;
}

/** A project's actions (the History sub-tab), newest first. */
export async function getProjectActions(
  supabase: TypedSupabaseClient,
  projectId: string
): Promise<ProjectAction[]> {
  const { data, error } = await supabase
    .from("project_actions")
    .select("id, body, action_date, author_name, user_id, created_at")
    .eq("project_id", projectId)
    .eq("is_deleted", false)
    .order("action_date", { ascending: false })
    .order("created_at", { ascending: false })
    .returns<ProjectAction[]>();

  if (error) {
    throw new Error(error.message);
  }
  return data ?? [];
}
