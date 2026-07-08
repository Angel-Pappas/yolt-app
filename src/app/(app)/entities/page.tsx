import { createClient } from "@/lib/supabase/server";
import { addEntity } from "./actions";
import { getActiveEntities } from "./queries";
import { EntityModal } from "./entity-modal";
import { EntityRow } from "./entity-row";

export default async function EntitiesPage() {
  const supabase = await createClient();

  const { data: entities } = await getActiveEntities(supabase);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Entities</h1>
        <EntityModal
          trigger="Add"
          title="Add entity"
          submitLabel="Add"
          action={addEntity}
        />
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left">
            <th className="py-2">Name</th>
            <th className="py-2">VAT number</th>
            <th className="py-2 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {entities?.map((e) => (
            <EntityRow key={e.id} entity={e} />
          ))}
          {entities?.length === 0 && (
            <tr>
              <td colSpan={3} className="py-4 text-center text-neutral-500">
                No entities yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
