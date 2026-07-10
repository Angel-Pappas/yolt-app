"use client";

import { useDialog } from "@/components/dialog/use-dialog";
import { DeleteButton } from "@/components/dialog/delete-button";
import { tableRowClass } from "@/components/table/table-styles";
import { TypePill } from "@/components/table/type-pill";
import { deleteCategory, updateCategory } from "./actions";
import { CategoryFormDialog } from "./category-form-dialog";
import type { Category, CategoryType } from "./queries";

const TYPE_LABEL: Record<CategoryType, string> = {
  income: "Income",
  expense: "Expense",
};

const TYPE_COLOR: Record<CategoryType, string> = {
  income: "bg-income-soft text-income",
  expense: "bg-expense-soft text-expense",
};

export function CategoryRow({ category }: { category: Category }) {
  const { dialogRef, open, close } = useDialog();

  return (
    <tr onClick={open} className={tableRowClass()}>
      <td className="px-4 py-3 text-sm text-ink">{category.name}</td>
      <td className="px-4 py-3">
        <TypePill label={TYPE_LABEL[category.type]} colorClass={TYPE_COLOR[category.type]} />
      </td>
      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
        <DeleteButton
          action={() => deleteCategory(category.id)}
          confirmMessage="Delete this category?"
          label="Delete category"
        />

        <CategoryFormDialog
          dialogRef={dialogRef}
          title="Edit category"
          submitLabel="Save"
          defaultValues={{ name: category.name, type: category.type }}
          action={updateCategory.bind(null, category.id)}
          onDone={close}
        />
      </td>
    </tr>
  );
}
