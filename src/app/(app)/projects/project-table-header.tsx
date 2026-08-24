"use client";

import { thClass, tableHeadRowClass } from "@/components/table/table-styles";
import { TableHeaderCell } from "@/components/table/table-header-cell";
import { HeaderTextFilterPopover } from "@/components/table/header-text-filter-popover";
import { HeaderFilterPopover } from "@/components/table/header-filter-popover";
import { useListParams } from "@/components/table/use-list-params";
import { useSortState } from "@/components/table/use-sort-state";
import { PROJECT_SORT_KEYS, type ProjectSortKey } from "./queries";

type Option = { value: string; label: string };

export function ProjectTableHeader({
  statusOptions,
}: {
  statusOptions: Option[];
}) {
  const { searchParams, setFilterParams } = useListParams();
  const { currentSort, currentDir, handleSort } =
    useSortState<ProjectSortKey>(PROJECT_SORT_KEYS);
  const sort = { currentSort, currentDir, onSort: handleSort };

  return (
    <thead>
      <tr className={tableHeadRowClass}>
        <th className={thClass}>
          <TableHeaderCell label="No." />
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
          <TableHeaderCell label="Client" />
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
          <TableHeaderCell label="Value" align="right" />
        </th>
        <th className={thClass}>
          <TableHeaderCell
            label="Next step"
            filter={<HeaderTextFilterPopover label="next step" paramKey="q" />}
          />
        </th>
        <th className={thClass}></th>
      </tr>
    </thead>
  );
}
