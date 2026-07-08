import { useState, type ReactNode } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { isSupabaseConfigured } from "../lib/supabase";
import {
  DashboardIcon,
  ContactsIcon,
  CompaniesIcon,
  TasksIcon,
  MenuIcon,
} from "./icons";

const NAV = [
  { to: "/", label: "Dashboard", Icon: DashboardIcon },
  { to: "/contacts", label: "Contacts", Icon: ContactsIcon },
  { to: "/companies", label: "Companies", Icon: CompaniesIcon },
  { to: "/tasks", label: "Tasks", Icon: TasksIcon },
];

function NavItems({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="space-y-0.5">
      {NAV.map(({ to, label, Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === "/"}
          onClick={onNavigate}
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              isActive
                ? "bg-brand-50 text-brand-700"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-800"
            }`
          }
        >
          <Icon size={18} />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-2.5 px-1">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">
        K
      </div>
      <div className="text-[15px] font-semibold tracking-tight text-slate-900">
        KOBIS Connect
      </div>
    </div>
  );
}

export default function Layout({ children }: { children: ReactNode }) {
  const { email, signOut, requiresAuth } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const title =
    NAV.find((n) => n.to === location.pathname)?.label ?? "KOBIS Connect";

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[248px_1fr]">
      {/* Sidebar (desktop) */}
      <aside className="hidden border-r border-slate-200 bg-white lg:flex lg:flex-col">
        <div className="px-4 py-5">
          <Brand />
        </div>
        <div className="flex-1 px-3">
          <NavItems />
        </div>
        <div className="space-y-3 border-t border-slate-100 p-3">
          <div className="px-1 text-[11px] leading-relaxed text-slate-400">
            <span className="kbd">/</span> search
            <span className="mx-1.5">·</span>
            <span className="kbd">N</span> new
          </div>
          {!isSupabaseConfigured && (
            <div className="rounded-lg bg-amber-50 px-3 py-2 text-[11px] leading-snug text-amber-800 ring-1 ring-inset ring-amber-200">
              Demo mode — data is saved in this browser only. Add Supabase keys
              to share across the office.
            </div>
          )}
          <div className="flex items-center justify-between gap-2 px-1">
            <span className="truncate text-xs text-slate-500" title={email ?? ""}>
              {email}
            </span>
            {requiresAuth && (
              <button onClick={signOut} className="btn-ghost !px-2 !py-1 text-xs">
                Sign out
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white/85 px-4 py-3 backdrop-blur lg:px-8">
          <div className="flex items-center gap-3">
            <button
              className="btn-ghost !px-2 lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <MenuIcon size={20} />
            </button>
            <h1 className="text-lg font-semibold tracking-tight text-slate-900">
              {title}
            </h1>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 lg:px-8 lg:py-8">{children}</main>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="animate-fade-in absolute inset-0 bg-slate-900/40"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute left-0 top-0 flex h-full w-64 flex-col bg-white p-3 shadow-pop">
            <div className="px-1 py-3">
              <Brand />
            </div>
            <div className="flex-1">
              <NavItems onNavigate={() => setMobileOpen(false)} />
            </div>
            {requiresAuth && (
              <button onClick={signOut} className="btn-ghost justify-start">
                Sign out
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
