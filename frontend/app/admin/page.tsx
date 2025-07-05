"use client";
import React from "react";
import {
  useAdminForms,
  useAdminStats,
  useFormExport,
} from "../../hooks/useAdmin";

export default function AdminDashboard() {
  const {
    forms,
    loading: formsLoading,
    error: formsError,
    updateFormStatus,
    deleteForm,
  } = useAdminForms();
  const { stats, loading: statsLoading, error: statsError } = useAdminStats();
  const { exportForm, loading: exportLoading } = useFormExport();

  if (formsLoading || statsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b px-4 py-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Manage bounty forms and responses
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center">
                <div className="text-3xl text-blue-600 mr-4">📋</div>
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Total Forms
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.totalForms}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center">
                <div className="text-3xl text-green-600 mr-4">✅</div>
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Active Forms
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.activeForms}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center">
                <div className="text-3xl text-orange-600 mr-4">📝</div>
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Total Responses
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.totalResponses}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center">
                <div className="text-3xl text-purple-600 mr-4">💰</div>
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Rewards Paid
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    ${stats.totalRewardsPaid}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {(formsError || statsError) && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <span className="text-red-600">❌</span>
              <p className="text-sm text-red-700">{formsError || statsError}</p>
            </div>
          </div>
        )}

        {/* Forms Table */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">All Forms</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Form Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Questions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reward
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date Range
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {forms.map((form) => (
                  <tr key={form.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {form.name}
                        </div>
                        {form.description && (
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {form.description}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          form.status === "active"
                            ? "bg-green-100 text-green-800"
                            : form.status === "draft"
                            ? "bg-gray-100 text-gray-800"
                            : form.status === "completed"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {form.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {form.form_questions?.length || 0} questions
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {form.reward_per_question} {form.reward_token}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>
                        {new Date(form.start_date).toLocaleDateString()}
                      </div>
                      <div>
                        to {new Date(form.end_date).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                      <select
                        value={form.status}
                        onChange={(e) =>
                          updateFormStatus([form.id], e.target.value as any)
                        }
                        className="text-xs border border-gray-300 rounded px-2 py-1"
                      >
                        <option value="draft">Draft</option>
                        <option value="active">Active</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>

                      <button
                        onClick={() => exportForm(form.id)}
                        disabled={exportLoading}
                        className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 disabled:opacity-50"
                      >
                        {exportLoading ? "Exporting..." : "Export"}
                      </button>

                      <button
                        onClick={() => {
                          if (
                            window.confirm(
                              "Are you sure you want to delete this form? This action cannot be undone."
                            )
                          ) {
                            deleteForm(form.id);
                          }
                        }}
                        className="text-xs bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {forms.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">📋</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No forms found
              </h3>
              <p className="text-gray-500">
                Forms will appear here once they are created.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
