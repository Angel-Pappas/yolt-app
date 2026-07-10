import { ListsNav } from "./lists-nav";

export default function ListsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1">
      <ListsNav />
      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  );
}
