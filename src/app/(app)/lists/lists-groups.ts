export type ListItem = {
  label: string;
  href: string;
};

export type ListGroup = {
  label: string;
  items: ListItem[];
};

/**
 * The single place that defines every reference/lookup list in the app
 * and which group it belongs to — drives `lists-nav.tsx`. Adding a future
 * list (a "Tax & Payroll" group for Greek insurance rates, a "Projects"
 * group for project states, etc.) is adding an entry here, nothing
 * structural.
 */
export const LIST_GROUPS: ListGroup[] = [
  {
    label: "Transactions",
    items: [
      { label: "Categories", href: "/lists/categories" },
      { label: "VAT rates", href: "/lists/vat-rates" },
    ],
  },
];
