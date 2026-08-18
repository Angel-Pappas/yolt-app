import { ListPageHeader } from "@/components/table/list-page-header";
import { thClass, tableHeadRowClass } from "@/components/table/table-styles";
import { requireAdmin } from "../../require-access";
import { getManagedUsers } from "./queries";
import { InviteUserModal } from "./invite-user-modal";
import { UserRow } from "./user-row";

export default async function UsersPage() {
  await requireAdmin();
  const users = await getManagedUsers();

  return (
    <div className="flex w-full max-w-5xl flex-1 flex-col gap-6 p-6">
      <ListPageHeader title="Users" addButton={<InviteUserModal />} />

      <div className="rounded-xl border border-edge bg-surface shadow-[var(--shadow-card)]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className={tableHeadRowClass}>
                <th className={thClass}>Email</th>
                <th className={thClass}>Name</th>
                <th className={thClass}>Access</th>
                <th className={thClass}>Status</th>
                <th className={thClass}></th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <UserRow key={user.id} user={user} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
