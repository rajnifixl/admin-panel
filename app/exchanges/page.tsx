"use client";
import { useEffect, useState } from "react";
import axios from "axios";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

const statusStyles: Record<string, string> = {
  Pending:   "bg-yellow-100 text-yellow-800",
  Approved:  "bg-blue-100 text-blue-800",
  Rejected:  "bg-red-100 text-red-800",
  Completed: "bg-green-100 text-green-800",
};

export default function ExchangesPage() {
  const [exchanges, setExchanges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [adminNote, setAdminNote] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState("All");

  const token = typeof window !== "undefined" ? localStorage.getItem("adminToken") : null;

  const fetchExchanges = async () => {
    try {
      const res = await axios.get(`${BACKEND_URL}/api/exchange/list`, {
        headers: { token },
      });
      if (res.data.success) setExchanges(res.data.exchanges);
    } catch (err) {
      console.error("Failed to fetch exchanges", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchExchanges(); }, []);

  const handleAction = async (id: string, action: "approve" | "reject" | "complete") => {
    try {
      setActionLoading(id + action);
      await axios.post(
        `${BACKEND_URL}/api/exchange/${id}/${action}`,
        action === "approve" ? { adminNote: adminNote[id] || "" } :
        action === "reject"  ? { rejectionReason: adminNote[id] || "" } : {},
        { headers: { token } }
      );
      fetchExchanges();
    } catch (err) {
      console.error(`Failed to ${action} exchange`, err);
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = filter === "All" ? exchanges : exchanges.filter(e => e.status === filter);

  if (loading) return (
    <div className="p-8 text-center text-gray-500">Loading exchanges...</div>
  );

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">🔄 Exchange Requests</h1>
          <p className="text-gray-500 text-sm mt-1">{exchanges.length} total requests</p>
        </div>
        {/* Filter Tabs */}
        <div className="flex gap-2">
          {["All", "Pending", "Approved", "Rejected", "Completed"].map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                filter === s
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-3">🔄</div>
          <p className="text-lg">No exchange requests found</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {filtered.map((ex) => (
            <div key={ex._id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  {/* Top Row */}
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <span className="font-mono text-xs text-gray-400">#{ex._id.slice(-8).toUpperCase()}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusStyles[ex.status] || "bg-gray-100 text-gray-700"}`}>
                      {ex.status}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(ex.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                  </div>

                  {/* Product & User */}
                  <p className="font-semibold text-gray-900 text-sm mb-1">📦 {ex.productName}</p>
                  {ex.userId && (
                    <p className="text-xs text-gray-500 mb-2">
                      👤 {ex.userId.name} ({ex.userId.email})
                    </p>
                  )}

                  {/* Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-1">Reason</p>
                      <p className="text-sm font-medium text-gray-800">{ex.reason}</p>
                    </div>
                    <div className="bg-indigo-50 rounded-lg p-3">
                      <p className="text-xs text-indigo-500 mb-1">Exchange Request</p>
                      <p className="text-sm font-medium text-indigo-800">{ex.exchangeRequest}</p>
                    </div>
                    {ex.comment && (
                      <div className="bg-gray-50 rounded-lg p-3 sm:col-span-2">
                        <p className="text-xs text-gray-500 mb-1">Additional Comment</p>
                        <p className="text-sm text-gray-700">{ex.comment}</p>
                      </div>
                    )}
                    {ex.adminNote && (
                      <div className="bg-green-50 rounded-lg p-3 sm:col-span-2">
                        <p className="text-xs text-green-600 mb-1">Admin Note</p>
                        <p className="text-sm text-green-800">{ex.adminNote}</p>
                      </div>
                    )}
                    {ex.rejectionReason && (
                      <div className="bg-red-50 rounded-lg p-3 sm:col-span-2">
                        <p className="text-xs text-red-500 mb-1">Rejection Reason</p>
                        <p className="text-sm text-red-700">{ex.rejectionReason}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions for Pending */}
              {ex.status === "Pending" && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <textarea
                    placeholder="Add note for customer (optional)..."
                    className="w-full border border-gray-200 rounded-lg p-2 text-sm mb-3 resize-none outline-none focus:border-indigo-400"
                    rows={2}
                    value={adminNote[ex._id] || ""}
                    onChange={e => setAdminNote(prev => ({ ...prev, [ex._id]: e.target.value }))}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAction(ex._id, "approve")}
                      disabled={actionLoading === ex._id + "approve"}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                      {actionLoading === ex._id + "approve" ? "..." : "✅ Approve"}
                    </button>
                    <button
                      onClick={() => handleAction(ex._id, "reject")}
                      disabled={actionLoading === ex._id + "reject"}
                      className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 disabled:opacity-50 transition-colors"
                    >
                      {actionLoading === ex._id + "reject" ? "..." : "❌ Reject"}
                    </button>
                  </div>
                </div>
              )}

              {/* Actions for Approved */}
              {ex.status === "Approved" && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => handleAction(ex._id, "complete")}
                    disabled={actionLoading === ex._id + "complete"}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
                  >
                    {actionLoading === ex._id + "complete" ? "..." : "🎉 Mark as Completed"}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}