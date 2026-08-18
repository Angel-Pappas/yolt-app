"use client";

import { thClass, tableHeadRowClass } from "@/components/table/table-styles";
import { TableHeaderCell } from "@/components/table/table-header-cell";
import { HeaderTextFilterPopover } from "@/components/table/header-text-filter-popover";
import { HeaderFilterPopover } from "@/components/table/header-filter-popover";
import { useListParams } from "@/components/table/use-list-params";
import { useSortState } from "@/components/table/use-sort-state";
import { LEAD_SORT_KEYS, type LeadSortKey } from "./queries";

export function LeadTableHeader({
  statusOptions,
}: {
  statusOptions: { value: string; label: string }[];
}) {
  const { searchParams, setFilterParams } = useListParams();
  const { currentSort, currentDir, handleSort } =
    useSortState<LeadSortKey>(LEAD_SORT_KEYS);
  const sort = { currentSort, currentDir, onSort: handleSort };

  return (
    <thead>
      <tr className={tableHeadRowClass}>
        <th className={thClass}>
          <TableHeaderCell
            label="Name"
            sortKey="name"
            {...sort}
            filter={<HeaderTextFilterPopover label="name" paramKey="q" />}
          />
        </th>
        <th className={thClass}>
          <TableHeaderCell
            label="Phone"
            filter={<HeaderTextFilterPopover label="phone" paramKey="q" />}
          />
        </th>
        <th className={thClass}>
          <TableHeaderCell
            label="Email"
            sortKey="email"
            {...sort}
            filter={<HeaderTextFilterPopover label="email" paramKey="q" />}
          />
        </th>
        <th className={thClass}>
          <TableHeaderCell
            label="Status"
            filter={
              <HeaderFilterPopover
                label="statuses"
                value={searchParams.get("status") ?? ""}
                onChange={(v) => setFilterParams({ status: v || null })}
                options={statusOptions}
              />
            }
          />
        </th>
        <th className={thClass}>
          <TableHeaderCell label="Added" sortKey="created_at" {...sort} />
        </th>
        <th className={thClass}></th>
      </tr>
    </thead>
  );
}
