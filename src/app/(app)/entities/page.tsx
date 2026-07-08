import { createClient } from "@/lib/supabase/server";
import { addEntity } from "./actions";
import { getActiveEntities } from "./queries";
import { EntityModal } from "./entity-modal";
import { EntityRow } from "./entity-row";

export default async function EntitiesPage() {
  const supabase = await createClient();

  const { data: entities } = await getActiveEntities(supabase);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold text-ink">Entities</h1>
        <EntityModal
          trigger="Add entity"
          title="Add entity"
          submitLabel="Add"
          action={addEntity}
        />
      </div>

      <div className="overflow-x-auto rounded-xl border border-edge bg-surface shadow-[var(--shadow-card)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-edge">
              <th className="px-4 py-3 text-left text-[11px] font-semibold tracking-wider text-ink-faint uppercase">
                Name
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold tracking-wider text-ink-faint uppercase">
                VAT number
              </th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {entities?.map((e) => (
              <EntityRow key={e.id} entity={e} />
            ))}
            {entities?.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-10 text-center text-sm text-ink-faint">
                  No entities yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
