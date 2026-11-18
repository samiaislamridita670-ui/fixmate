"use client";

import { useCallback, useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { api } from "@/lib/api";
import { formatDate, ROLE_META } from "@/lib/constants";
import type { AppUser, Role } from "@/lib/types";
import { RoleBadge } from "@/components/ui/Badge";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/ui/Feedback";
import { useToast } from "@/components/Toast";

const ROLES: Role[] = ["customer", "technician", "admin"];

export default function AdminUsersPage() {
  const toast = useToast();
  const { data: session } = authClient.useSession();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | Role>("all");
  const [busyId, setBusyId] = useState("");
  const [pendingRole, setPendingRole] = useState<{ user: AppUser; role: Role } | null>(null);
  const [saving, setSaving] = useState(false);

  const currentUserId = String(session?.user?.id || "");

  // Loader touches state only inside promise callbacks, so the effect never
  // sets state synchronously (react-hooks/set-state-in-effect).
  const loadUsers = useCallback(
    () =>
      api
        .get<{ users?: AppUser[] }>("/api/users")
        .then((data) => {
          setUsers(data.users || []);
          setError("");
        })
        .catch((err: unknown) => {
          setError(err instanceof Error ? err.message : "Could not load users.");
        })
        .finally(() => {
          setLoading(false);
        }),
    []
  );

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  async function confirmRoleChange() {
    if (!pendingRole) return;
    setSaving(true);
    setBusyId(pendingRole.user.id);
    try {
      await api.patch(`/api/users/${pendingRole.user.id}/role`, { role: pendingRole.role });
      setUsers((current) =>
        current.map((user) =>
          user.id === pendingRole.user.id ? { ...user, role: pendingRole.role } : user
        )
      );
      toast.success(
        `${pendingRole.user.name} is now a ${ROLE_META[pendingRole.role].label.toLowerCase()}.`
      );
      setPendingRole(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not change the role.");
    } finally {
      setSaving(false);
      setBusyId("");
    }
  }

  const filtered = users.filter((user) => {
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    const term = search.trim().toLowerCase();
    const matchesSearch =
      !term ||
      user.name.toLowerCase().includes(term) ||
      user.email.toLowerCase().includes(term);
    return matchesRole && matchesSearch;
  });

  const counts = {
    all: users.length,
    customer: users.filter((u) => u.role === "customer").length,
    technician: users.filter((u) => u.role === "technician").length,
    admin: users.filter((u) => u.role === "admin").length,
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-black uppercase tracking-widest text-emerald-600">
          Admin dashboard
        </p>
        <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
          Manage Users
        </h1>
        <p className="mt-1.5 text-sm text-slate-500">
          {users.length} registered user{users.length === 1 ? "" : "s"} · roles are enforced by the
          server on every request.
        </p>
      </div>

      <div className="card card-pad space-y-4">
        <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
          <div>
            <label htmlFor="user-search" className="label">
              Search users
            </label>
            <input
              id="user-search"
              type="search"
              className="input"
              placeholder="Search by name or email…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {(["all", ...ROLES] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setRoleFilter(item)}
                className={`chip transition ${
                  roleFilter === item
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-100 capitalize text-slate-600 hover:bg-slate-200"
                }`}
              >
                {item} ({counts[item as keyof typeof counts]})
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <ErrorState
          description={error}
          onRetry={() => {
            setError("");
            setLoading(true);
            void loadUsers();
          }}
        />
      )}

      <div className="table-shell">
        {loading ? (
          <TableSkeleton rows={6} />
        ) : filtered.length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon="🔍"
              title="No users match your search"
              description="Try a different name, email or role filter."
            />
          </div>
        ) : (
          <table className="min-w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="table-th">User</th>
                <th className="table-th">Role</th>
                <th className="table-th">Phone</th>
                <th className="table-th">Area</th>
                <th className="table-th">Joined</th>
                <th className="table-th">Change role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((user) => {
                const isSelf = user.id === currentUserId;
                return (
                  <tr key={user.id} className="hover:bg-slate-50/70">
                    <td className="table-td">
                      <div className="flex items-center gap-3">
                        {user.image ? (
                          <img
                            src={user.image}
                            alt=""
                            className="h-9 w-9 rounded-full object-cover"
                          />
                        ) : (
                          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-xs font-black text-emerald-700">
                            {user.name?.charAt(0)?.toUpperCase() || "U"}
                          </span>
                        )}
                        <div className="min-w-0">
                          <p className="truncate font-bold text-slate-900">
                            {user.name}
                            {isSelf && (
                              <span className="ml-2 text-[10px] font-black uppercase text-emerald-600">
                                (you)
                              </span>
                            )}
                          </p>
                          <p className="truncate text-xs text-slate-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="table-td">
                      <RoleBadge role={user.role} />
                    </td>
                    <td className="table-td">{user.phone || "—"}</td>
                    <td className="table-td">{user.area || "—"}</td>
                    <td className="table-td">{user.createdAt ? formatDate(user.createdAt) : "—"}</td>
                    <td className="table-td">
                      {isSelf ? (
                        <span className="text-xs font-semibold text-slate-400">
                          Cannot change own role
                        </span>
                      ) : (
                        <div className="flex gap-2">
                          <select
                            aria-label={`Role for ${user.name}`}
                            className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900"
                            value={user.role}
                            onChange={(event) =>
                              setPendingRole({
                                user,
                                role: event.target.value as Role,
                              })
                            }
                            disabled={busyId === user.id}
                          >
                            {ROLES.map((role) => (
                              <option key={role} value={role}>
                                {ROLE_META[role].label}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <ConfirmDialog
        open={!!pendingRole}
        title="Change user role?"
        message={
          pendingRole
            ? `${pendingRole.user.name} will become a ${ROLE_META[pendingRole.role].label}. Their permissions change immediately.`
            : ""
        }
        confirmLabel="Change role"
        busy={saving}
        onConfirm={confirmRoleChange}
        onCancel={() => setPendingRole(null)}
      />
    </div>
  );
}
