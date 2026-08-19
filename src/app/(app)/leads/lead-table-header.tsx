"use client";

import { thClass, tableHeadRowClass } from "@/components/table/table-styles";
import { TableHeaderCell } from "@/components/table/table-header-cell";
import { HeaderTextFilterPopover } from "@/components/table/header-text-filter-popover";
import { HeaderFilterPopover } from "@/components/table/header-filter-popover";
import { useListParams } from "@/components/table/use-list-params";
import { useSortState } from "@/components/table/use-sort-state";
import { LEAD_SORT_KEYS, type LeadSortKey } from "./queries";

type Option = { value: string; label: string };

export function LeadTableHeader({
  originOptions,
  statusOptions,
}: {
  originOptions: Option[];
  statusOptions: Option[];
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
            label="Origin"
            filter={
              <HeaderFilterPopover
                label="origins"
                value={searchParams.get("origin") ?? ""}
                onChange={(v) => setFilterParams({ origin: v || null })}
                options={originOptions}
              />
            }
          />
        </th>
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
            label="Email"
            filter={<HeaderTextFilterPopover label="email" paramKey="q" />}
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
            label="Description"
            filter={<HeaderTextFilterPopover label="description" paramKey="q" />}
          />
        </th>
        <th className={thClass}>
          <TableHeaderCell
            label="Next step"
            filter={<HeaderTextFilterPopover label="next step" paramKey="q" />}
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
        <th className={thClass}></th>
      </tr>
    </thead>
  );
}
