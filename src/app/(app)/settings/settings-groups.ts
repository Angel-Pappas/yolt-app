/**
 * Every section of the global Settings area and which access it needs. This one
 * structure drives the settings sub-nav — add a section here, not in the nav
 * component. Sections are shown only to users who can access them:
 *   "all"     — everyone (their own account, the app's appearance)
 *   "finance" — finance users (the finance lookup lists)
 *   "crm"     — CRM users (added with the CRM, later phase)
 *   "admin"   — the super admin (user management, later phase)
 */

export type SettingsAccess = "all" | "finance" | "crm" | "admin";

export type SettingsLink = { label: string; href: string };

export type SettingsGroup = {
  label: string;
  access: SettingsAccess;
  items: SettingsLink[];
};

export const SETTINGS_GROUPS: SettingsGroup[] = [
  {
    label: "Account",
    access: "all",
    items: [
      { label: "Account", href: "/settings/account" },
      { label: "Appearance", href: "/settings/appearance" },
    ],
  },
  {
    label: "Finance",
    access: "finance",
    items: [
      { label: "Categories", href: "/settings/categories" },
      { label: "VAT rates", href: "/settings/vat-rates" },
    ],
  },
];
