export type NavItem = { href: string; label: string; icon: string };
export type NavGroup = { title: string; items: NavItem[] };

export const NAV_GROUPS: NavGroup[] = [
  {
    title: "Araw-araw",
    items: [
      { href: "/", label: "Dashboard", icon: "🏠" },
      { href: "/sales", label: "Benta (Sales Log)", icon: "🧾" },
      { href: "/purchases", label: "Binili (Purchases Log)", icon: "🛒" },
      { href: "/expenses", label: "Gastos (Expenses)", icon: "💸" },
      { href: "/inventory", label: "Stock (Inventory)", icon: "📦" },
      { href: "/customers", label: "Mga Customer", icon: "👥" },
    ],
  },
  {
    title: "Setup & Reports",
    items: [
      { href: "/pricing", label: "Presyo (Pricing)", icon: "🏷️" },
      { href: "/suppliers", label: "Suppliers", icon: "🚚" },
      { href: "/inquiries", label: "Mga Tanong (Leads)", icon: "💬" },
      { href: "/reports", label: "Reports (P&L)", icon: "📊" },
      { href: "/compliance", label: "Permits & Compliance", icon: "✅" },
    ],
  },
];
