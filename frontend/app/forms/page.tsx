"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getBountyForms } from "@/lib/forms";
import { BountyForm } from "@/lib/supabase";
import { Button } from "@/components/ui/button";

export default function FormsListPage() {
  const [allForms, setAllForms] = useState<BountyForm[]>([]);
  const [filteredForms, setFilteredForms] = useState<BountyForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter and sort states
  const [searchQuery, setSearchQuery] = useState("");
  const [eligibilityFilter, setEligibilityFilter] = useState<
    "All" | "Orb" | "Device" | "Any"
  >("Any");
  const [sortBy, setSortBy] = useState<
    "newest" | "oldest" | "ending-soon" | "reward-high" | "reward-low"
  >("newest");
  const [tokenFilter, setTokenFilter] = useState<"All" | "USDC" | "WLD">("All");
  const [filtersExpanded, setFiltersExpanded] = useState(false);

  useEffect(() => {
    async function loadForms() {
      try {
        const result = await getBountyForms();
        if (!result.success) {
          setError(result.error || "Failed to load forms");
          return;
        }

        // Filter to only show active, public forms within date range
        const now = new Date();
        const activeForms = (result.data || []).filter((form) => {
          const startDate = new Date(form.start_date);
          const endDate = new Date(form.end_date);
          return (
            form.status === "active" &&
            form.visibility === "Public" &&
            now >= startDate &&
            now <= endDate
          );
        });

        setAllForms(activeForms);
      } catch (err) {
        setError("Failed to load forms");
      } finally {
        setLoading(false);
      }
    }

    loadForms();
  }, []);

  // Apply filters and sorting
  useEffect(() => {
    let filtered = [...allForms];

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (form) =>
          form.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (form.description &&
            form.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Apply eligibility filter
    if (eligibilityFilter !== "Any") {
      filtered = filtered.filter(
        (form) => form.user_eligibility === eligibilityFilter
      );
    }

    // Apply token filter
    if (tokenFilter !== "All") {
      filtered = filtered.filter((form) => form.reward_token === tokenFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
        case "oldest":
          return (
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
        case "ending-soon":
          return (
            new Date(a.end_date).getTime() - new Date(b.end_date).getTime()
          );
        case "reward-high":
          return b.reward_per_question - a.reward_per_question;
        case "reward-low":
          return a.reward_per_question - b.reward_per_question;
        default:
          return 0;
      }
    });

    setFilteredForms(filtered);
  }, [allForms, searchQuery, eligibilityFilter, sortBy, tokenFilter]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading forms...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-6 bg-white rounded-lg shadow-lg max-w-md">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Error</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Available Bounty Forms
          </h1>
          <p className="mt-2 text-gray-600">
            Complete forms and earn crypto rewards for your responses
          </p>
        </div>

        {/* Search Bar - Separate and Always Visible */}
        <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6 mb-4 transform transition-all duration-200 hover:shadow-md">
          <div className="max-w-md mx-auto">
            <label className="block text-sm font-medium text-gray-700 mb-2 text-center">
              Search Forms
            </label>
            <div className="relative group">
              <input
                type="text"
                placeholder="Search by name or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-base transition-all duration-200 group-hover:border-gray-400"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-400 transition-colors duration-200 group-focus-within:text-blue-500">
                  🔍
                </span>
              </div>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors duration-200 transform hover:scale-110"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Collapsible Filters */}
        <div className="bg-white rounded-lg shadow-sm border mb-8 overflow-hidden transform transition-all duration-200 hover:shadow-md">
          {/* Filter Header */}
          <button
            onClick={() => setFiltersExpanded(!filtersExpanded)}
            className="w-full p-4 sm:p-6 flex items-center justify-between hover:bg-gray-50 transition-all duration-200 group"
          >
            <div className="flex items-center space-x-3">
              <span className="text-lg transition-transform duration-200 group-hover:scale-110">
                ⚙️
              </span>
              <div className="text-left">
                <h3 className="font-medium text-gray-900 transition-colors duration-200 group-hover:text-blue-700">
                  Advanced Filters
                </h3>
                <p className="text-sm text-gray-600">
                  Sort and filter by criteria
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {/* Active Filters Indicator */}
              {(eligibilityFilter !== "Any" ||
                tokenFilter !== "All" ||
                sortBy !== "newest") && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 animate-pulse">
                  Filters active
                </span>
              )}
              {/* Expand/Collapse Icon */}
              <div
                className={`transform transition-all duration-300 ease-out ${
                  filtersExpanded
                    ? "rotate-180 text-blue-600"
                    : "rotate-0 text-gray-400"
                } group-hover:scale-110`}
              >
                <span>▼</span>
              </div>
            </div>
          </button>

          {/* Collapsible Filter Content */}
          <div
            className={`transition-all duration-500 ease-in-out ${
              filtersExpanded
                ? "max-h-96 opacity-100 translate-y-0"
                : "max-h-0 opacity-0 -translate-y-2"
            } overflow-hidden`}
          >
            <div className="border-t border-gray-200 p-4 sm:p-6 animate-in slide-in-from-top-2 duration-300">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Eligibility Filter */}
                <div className="transform transition-all duration-200 hover:scale-105">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    User Type
                  </label>
                  <select
                    value={eligibilityFilter}
                    onChange={(e) =>
                      setEligibilityFilter(e.target.value as any)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200 hover:border-gray-400"
                  >
                    <option value="Any">Any verification</option>
                    <option value="All">All users</option>
                    <option value="Device">Device verified</option>
                    <option value="Orb">Orb verified</option>
                  </select>
                </div>

                {/* Token Filter */}
                <div className="transform transition-all duration-200 hover:scale-105">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reward Token
                  </label>
                  <select
                    value={tokenFilter}
                    onChange={(e) => setTokenFilter(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200 hover:border-gray-400"
                  >
                    <option value="All">All tokens</option>
                    <option value="USDC">USDC</option>
                    <option value="WLD">WLD</option>
                  </select>
                </div>

                {/* Sort */}
                <div className="transform transition-all duration-200 hover:scale-105">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sort By
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200 hover:border-gray-400"
                  >
                    <option value="newest">Newest first</option>
                    <option value="oldest">Oldest first</option>
                    <option value="ending-soon">Ending soon</option>
                    <option value="reward-high">Highest reward</option>
                    <option value="reward-low">Lowest reward</option>
                  </select>
                </div>
              </div>

              {/* Results count and Clear filters */}
              <div className="mt-6 pt-4 border-t border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <p className="text-sm text-gray-600 transition-all duration-200">
                  Showing{" "}
                  <span className="font-semibold text-blue-600">
                    {filteredForms.length}
                  </span>{" "}
                  of <span className="font-semibold">{allForms.length}</span>{" "}
                  forms
                </p>

                {(searchQuery ||
                  eligibilityFilter !== "Any" ||
                  tokenFilter !== "All" ||
                  sortBy !== "newest") && (
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setEligibilityFilter("Any");
                      setTokenFilter("All");
                      setSortBy("newest");
                    }}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-all duration-200 flex items-center space-x-1 hover:bg-blue-50 px-3 py-2 rounded-lg transform hover:scale-105"
                  >
                    <span className="transition-transform duration-200 hover:rotate-180">
                      🔄
                    </span>
                    <span>Clear all filters</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Forms Grid */}
        {filteredForms.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📝</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {allForms.length === 0 ? "No Active Forms" : "No Forms Found"}
            </h2>
            <p className="text-gray-600">
              {allForms.length === 0
                ? "There are no active bounty forms available at the moment."
                : "Try adjusting your search or filter criteria."}
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredForms.map((form) => (
              <FormCard key={form.id} form={form} />
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 text-center">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Want to create your own bounty form?
            </h3>
            <p className="text-gray-600 mb-4">
              Build custom forms and reward participants with crypto payments
            </p>
            <Link href="/form-builder">
              <Button>Create a Form</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

interface FormCardProps {
  form: BountyForm;
}

// Helper function to get eligibility icon and description
function getEligibilityInfo(eligibility: string) {
  switch (eligibility) {
    case "Orb":
      return {
        icon: "🔮",
        label: "Orb verified",
        description: "Requires Orb verification",
        className: "bg-purple-100 text-purple-800",
      };
    case "Device":
      return {
        icon: "📱",
        label: "Device verified",
        description: "Requires Device verification",
        className: "bg-blue-100 text-blue-800",
      };
    case "All":
    default:
      return {
        icon: "🌍",
        label: "All users",
        description: "Device or Orb verification",
        className: "bg-green-100 text-green-800",
      };
  }
}

function FormCard({ form }: FormCardProps) {
  const startDate = new Date(form.start_date);
  const endDate = new Date(form.end_date);
  const now = new Date();

  // Calculate days remaining
  const daysRemaining = Math.ceil(
    (endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );

  const eligibilityInfo = getEligibilityInfo(form.user_eligibility || "All");

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
            {form.name}
          </h3>
          <div className="flex-shrink-0 ml-2 space-y-1">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 block">
              Active
            </span>
          </div>
        </div>

        {/* Eligibility Badge */}
        <div className="mb-4">
          <span
            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${eligibilityInfo.className}`}
          >
            <span className="mr-1">{eligibilityInfo.icon}</span>
            {eligibilityInfo.label}
          </span>
        </div>

        {/* Description */}
        {form.description && (
          <p className="text-gray-600 text-sm mb-4 line-clamp-3">
            {form.description}
          </p>
        )}

        {/* Reward Info */}
        <div className="bg-blue-50 rounded-lg p-3 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-900">
                Reward per Form
              </p>
              <p className="text-lg font-bold text-blue-600">
                {form.reward_per_question} {form.reward_token}
              </p>
            </div>
            <div className="text-2xl">💰</div>
          </div>
        </div>

        {/* Time Info */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-gray-600">
            <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
            <span>
              {daysRemaining > 0
                ? `${daysRemaining} day${
                    daysRemaining === 1 ? "" : "s"
                  } remaining`
                : "Ends today"}
            </span>
          </div>
          <div className="flex items-center text-sm text-gray-500">
            <span>📅</span>
            <span className="ml-1">Until {endDate.toLocaleDateString()}</span>
          </div>
        </div>

        {/* Action Button */}
        <Link href={`/form/${form.id}`} className="block">
          <Button className="w-full">Start Form</Button>
        </Link>
      </div>
    </div>
  );
}
