import { useCallback, useEffect, useMemo, useState } from "react";
import { ClipboardList, ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import axios from "../lib/axios";
import { fetchActivityLog } from "../lib/activityLogApi";
import {
    ACTIVITY_ACTION_LABELS,
    formatActivityRow,
} from "../utils/activityLogFormat";

const PAGE_SIZE = 25;

const EMPTY_FILTERS = Object.freeze({
    actorId: "",
    role: "",
    action: "",
    from: "",
    to: "",
});

/**
 * Admin-only table of teacher and coach activity (Settings → Activities
 * log). Metadata only — entries never contain talk-data content. Rows
 * older than 90 days are pruned automatically by the backend.
 */
const ActivityLogPanel = () => {
    const [filters, setFilters] = useState(EMPTY_FILTERS);
    const [page, setPage] = useState(1);
    const [data, setData] = useState({ entries: [], totalPages: 1, total: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [users, setUsers] = useState([]);

    // Teacher + coach directory for the "User" filter dropdown.
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const [teachersRes, coachesRes] = await Promise.all([
                    axios.get("/api/teachers").catch(() => ({ data: { teachers: [] } })),
                    axios.get("/api/coaches").catch(() => ({ data: { coaches: [] } })),
                ]);
                if (cancelled) return;
                const teachers = (teachersRes.data?.teachers || []).map((t) => ({
                    id: t.id || t._id,
                    name: t.name,
                    role: "teacher",
                }));
                const coaches = (coachesRes.data?.coaches || []).map((c) => ({
                    id: c.id || c._id,
                    name: c.name,
                    role: "coach",
                }));
                setUsers(
                    [...teachers, ...coaches].sort((a, b) =>
                        (a.name || "").localeCompare(b.name || "")
                    )
                );
            } catch {
                // Dropdown stays empty; filtering by user is just unavailable.
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await fetchActivityLog({
                page,
                limit: PAGE_SIZE,
                ...filters,
            });
            setData({
                entries: result.entries || [],
                totalPages: result.totalPages || 1,
                total: result.total || 0,
            });
        } catch (err) {
            setError(err.response?.data?.message || "Failed to load the activity log");
        } finally {
            setLoading(false);
        }
    }, [page, filters]);

    useEffect(() => {
        load();
    }, [load]);

    const setFilter = (key, value) => {
        setFilters((prev) => ({ ...prev, [key]: value }));
        setPage(1);
    };

    const resetFilters = () => {
        setFilters(EMPTY_FILTERS);
        setPage(1);
    };

    const rows = useMemo(() => data.entries.map(formatActivityRow), [data.entries]);
    const hasFilters = Object.values(filters).some((v) => v !== "");

    return (
        <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
                <h2 className="card-title text-xl flex items-center gap-2">
                    <ClipboardList className="w-5 h-5 text-primary" />
                    Activities log
                </h2>
                <p className="text-sm text-base-content/70">
                    Teacher and coach actions from the last 90 days. Entries contain no
                    transcript or talk-data content.
                </p>

                <div className="flex flex-wrap items-end gap-2 mt-2">
                    <label className="form-control w-full sm:w-48">
                        <span className="label-text text-xs mb-1">User</span>
                        <select
                            className="select select-bordered select-sm"
                            value={filters.actorId}
                            onChange={(e) => setFilter("actorId", e.target.value)}
                        >
                            <option value="">All users</option>
                            {users.map((u) => (
                                <option key={u.id} value={u.id}>
                                    {u.name} ({u.role})
                                </option>
                            ))}
                        </select>
                    </label>
                    <label className="form-control w-full sm:w-36">
                        <span className="label-text text-xs mb-1">Role</span>
                        <select
                            className="select select-bordered select-sm"
                            value={filters.role}
                            onChange={(e) => setFilter("role", e.target.value)}
                        >
                            <option value="">All roles</option>
                            <option value="teacher">Teacher</option>
                            <option value="coach">Coach</option>
                        </select>
                    </label>
                    <label className="form-control w-full sm:w-56">
                        <span className="label-text text-xs mb-1">Activity</span>
                        <select
                            className="select select-bordered select-sm"
                            value={filters.action}
                            onChange={(e) => setFilter("action", e.target.value)}
                        >
                            <option value="">All activities</option>
                            {Object.entries(ACTIVITY_ACTION_LABELS).map(([value, label]) => (
                                <option key={value} value={value}>
                                    {label}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label className="form-control w-full sm:w-40">
                        <span className="label-text text-xs mb-1">From</span>
                        <input
                            type="date"
                            className="input input-bordered input-sm"
                            value={filters.from}
                            onChange={(e) => setFilter("from", e.target.value)}
                        />
                    </label>
                    <label className="form-control w-full sm:w-40">
                        <span className="label-text text-xs mb-1">To</span>
                        <input
                            type="date"
                            className="input input-bordered input-sm"
                            value={filters.to}
                            onChange={(e) => setFilter("to", e.target.value)}
                        />
                    </label>
                    {hasFilters && (
                        <button
                            type="button"
                            className="btn btn-ghost btn-sm gap-1"
                            onClick={resetFilters}
                        >
                            <RotateCcw className="w-3.5 h-3.5" />
                            Reset
                        </button>
                    )}
                </div>

                {error ? (
                    <div className="alert alert-error mt-4 text-sm">{error}</div>
                ) : loading ? (
                    <div className="flex justify-center py-10">
                        <span className="loading loading-spinner loading-md text-primary" />
                    </div>
                ) : rows.length === 0 ? (
                    <div className="text-center py-10 text-base-content/60 text-sm">
                        {hasFilters
                            ? "No activity matches these filters."
                            : "No activity recorded yet."}
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto mt-2">
                            <table className="table table-sm table-zebra">
                                <thead>
                                    <tr>
                                        <th>Timestamp</th>
                                        <th>User</th>
                                        <th>Role</th>
                                        <th>Activity</th>
                                        <th>Detail</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.map((row) => (
                                        <tr key={row.id}>
                                            <td className="whitespace-nowrap">{row.timestamp}</td>
                                            <td>{row.userName}</td>
                                            <td>{row.role}</td>
                                            <td>{row.activity}</td>
                                            <td className="max-w-xs truncate" title={row.detail}>
                                                {row.detail}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex items-center justify-between mt-3">
                            <span className="text-xs text-base-content/60">
                                {data.total} entr{data.total === 1 ? "y" : "ies"} · page {page} of{" "}
                                {data.totalPages}
                            </span>
                            <div className="join">
                                <button
                                    type="button"
                                    className="join-item btn btn-sm"
                                    disabled={page <= 1}
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                    Prev
                                </button>
                                <button
                                    type="button"
                                    className="join-item btn btn-sm"
                                    disabled={page >= data.totalPages}
                                    onClick={() => setPage((p) => p + 1)}
                                >
                                    Next
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default ActivityLogPanel;
