/**
 * Shared types for the action-log ("History" sub-tab) used by both the Leads
 * and Projects features. A lead's or project's actions have the same shape and
 * the same UI; only which server actions they call differs, so those are passed
 * in as props (see actions-panel.tsx).
 */

export type UserOption = { id: string; name: string };

export type ActionRecord = {
  id: string;
  body: string;
  action_date: string;
  author_name: string | null;
  user_id: string;
  created_at: string;
};

/** What a wrapped Server Action returns (see src/lib/action-result.ts). */
type ActionResultLike = void | { error?: string | null };

export type AddActionFn = (
  parentId: string,
  formData: FormData
) => Promise<ActionResultLike>;

export type UpdateActionFn = (
  id: string,
  parentId: string,
  formData: FormData
) => Promise<ActionResultLike>;

export type DeleteActionFn = (
  id: string,
  parentId: string
) => Promise<ActionResultLike>;
