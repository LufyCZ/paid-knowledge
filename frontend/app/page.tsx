"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@/hooks/useWallet";
import { useDataRefresh } from "@/hooks/useDataRefresh";
import { ClientOnly } from "@/components/ClientOnly";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useTRPC } from "@/lib/trpc";
import { useQuery } from "@tanstack/react-query";

const FILTER_OPTIONS = [
  { id: "all", label: "All" },
  { id: "orb", label: "Orb Verified" },
  { id: "device", label: "Device Verified" },
] as const;

const FEATURED_FORM_IDS: string[] = [];

export default function HomePage() {
  const { isConnected } = useWallet();
  const trpc = useTRPC();
  const {
    data: allForms,
    isLoading,
    error,
    refetch: refreshForms,
  } = useQuery(trpc.questions.get.queryOptions());
  const [selectedFilter, setSelectedFilter] =
    useState<(typeof FILTER_OPTIONS)[number]["id"]>("all");
  const [isClient, setIsClient] = useState(false);

  // Add data refresh on navigation events
  useDataRefresh({
    refreshFn: () => void refreshForms(),
    dependencies: [], // Remove dependencies to prevent infinite loops
  });

  // Prevent hydration mismatch by only rendering after client mount
  useEffect(() => {
    setIsClient(true);
  }, []);

  const filteredForms =
    selectedFilter === "all"
      ? allForms
      : selectedFilter === "orb"
      ? allForms?.filter((form) => form.verificationLevel === "orb")
      : selectedFilter === "device"
      ? allForms?.filter((form) => form.verificationLevel === "device")
      : allForms;

  const featuredForms = allForms?.filter((form) =>
    FEATURED_FORM_IDS.includes(form.id)
  );

  // Helper function to get eligibility badge
  const getEligibilityBadge = (
    verificationLevel: "orb" | "device" | "none"
  ) => {
    switch (verificationLevel) {
      case "orb":
        return (
          <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-green-100 text-green-700">
            Orb verified
          </span>
        );
      case "device":
        return (
          <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-blue-100 text-blue-700">
            Device verified
          </span>
        );
      default:
        return null;
    }
  };

  // Helper function to format date (hydration-safe)
  const formatEndDate = (dateString: string) => {
    if (!isClient) return ""; // Return empty string during SSR

    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();

    if (diffTime <= 0) {
      return "Expired";
    }

    const diffMinutes = Math.ceil(diffTime / (1000 * 60));
    const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffMinutes < 60) {
      return `Ends in ${diffMinutes} ${
        diffMinutes === 1 ? "minute" : "minutes"
      }`;
    } else if (diffHours < 24) {
      return `Ends in ${diffHours} ${diffHours === 1 ? "hour" : "hours"}`;
    } else if (diffDays === 1) {
      return "Ends in 1 day";
    } else {
      return `Ends in ${diffDays} days`;
    }
  };

  const FormCard = ({
    form,
  }: {
    form: NonNullable<typeof allForms>[number];
    isFeatured?: boolean;
  }) => (
    <Link href={`/form/${form.id}`} className="block">
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 hover:border-gray-200">
        {/* Header with tags */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            {getEligibilityBadge(form.verificationLevel)}
          </div>
        </div>

        {/* Title and description */}
        <div className="mb-4">
          <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 text-lg">
            {form.title}
          </h3>
          <p className="text-sm text-gray-600 line-clamp-2">
            {form.description}
          </p>
        </div>

        {/* Footer with timing info and price */}
        <div className="flex items-center justify-between pt-3">
          <div className="flex items-center text-sm text-gray-500">
            <svg
              className="w-4 h-4 mr-1.5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            {formatEndDate(form.endDate)}
          </div>
          {form.reward ? (
            <div className="text-lg font-semibold text-gray-900">
              {form.reward.amount} {form.reward.currency}
            </div>
          ) : null}
        </div>
      </div>
    </Link>
  );

  return (
    <ClientOnly
      fallback={
        <div className="min-h-screen bg-gray-50 pb-20">
          <div className="bg-white border-b border-gray-100 px-6 py-4">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold text-gray-900">Questy</h1>
              <div className="bg-gray-200 rounded-full px-6 py-2">
                <span className="text-sm text-gray-600">+ Create</span>
              </div>
            </div>
          </div>
          <div className="px-6 py-8">
            <div className="flex justify-center items-center py-16">
              <div className="text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-black mx-auto mb-4"></div>
                <p className="text-gray-600">Loading forms...</p>
              </div>
            </div>
          </div>
        </div>
      }
    >
      <div className="min-h-screen bg-gray-50 pb-20">
        {/* Header */}
        <div className="bg-white border-b border-gray-100 px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900">Questy</h1>
            <Link href="/form-builder">
              <Button
                size="sm"
                className="bg-black text-white hover:bg-gray-800 rounded-full px-6 py-2"
              >
                + Create
              </Button>
            </Link>
          </div>
        </div>

        <div className="py-8 space-y-8">
          {/* Show loading until client is mounted to prevent hydration issues */}
          {!isClient || isLoading ? (
            <div className="flex justify-center items-center py-16 px-6">
              <div className="text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-black mx-auto mb-4"></div>
                <p className="text-gray-600">Loading forms...</p>
              </div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center mx-6">
              <div className="text-4xl mb-4">⚠️</div>
              <p className="text-red-800 font-medium mb-2">
                Something went wrong
              </p>
              <p className="text-red-600 text-sm">{error.message}</p>
            </div>
          ) : (
            <>
              {/* Featured Section */}
              <section className="px-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">
                  Featured
                </h2>
                {featuredForms && featuredForms.length > 0 ? (
                  <div className="flex space-x-4 overflow-x-auto scrollbar-hide pb-2 -mx-6 px-6">
                    {featuredForms.map((form) => (
                      <div key={form.id} className="flex-shrink-0 w-80">
                        <FormCard form={form} isFeatured={true} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-gray-500 text-center py-12 bg-white rounded-2xl border border-gray-100">
                    <div className="text-4xl mb-4">📋</div>
                    <p>No featured forms available</p>
                  </div>
                )}
              </section>

              {/* Explore Section */}
              <section>
                <div className="px-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-6">
                    Explore
                  </h2>
                </div>

                {/* Filter Tabs - Full width, no padding */}
                <div className="flex space-x-3 mb-6 overflow-x-auto scrollbar-hide pb-2 px-6">
                  {FILTER_OPTIONS.map((filter) => (
                    <button
                      key={filter.id}
                      onClick={() => setSelectedFilter(filter.id)}
                      className={`px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                        selectedFilter === filter.id
                          ? "bg-black text-white shadow-sm"
                          : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>

                {/* Forms Grid */}
                <div className="px-6">
                  {filteredForms && filteredForms.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredForms.map((form) => (
                        <FormCard key={form.id} form={form} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-gray-500 text-center py-12 bg-white rounded-2xl border border-gray-100">
                      <div className="text-4xl mb-4">🔍</div>
                      <p>No forms available for the selected filter</p>
                    </div>
                  )}
                </div>
              </section>
            </>
          )}

          {/* Connection Prompt for Non-Connected Users */}
          {!isConnected && (
            <div className="fixed bottom-24 left-6 right-6 bg-blue-600 text-white p-5 rounded-2xl shadow-xl border border-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg">
                    Connect to earn rewards
                  </h3>
                  <p className="text-sm text-blue-100 mt-1">
                    Connect your wallet to start earning from forms
                  </p>
                </div>
                <Link href="/account">
                  <Button
                    size="sm"
                    variant="outline"
                    className="bg-white text-blue-600 hover:bg-gray-50 border-white rounded-full px-6"
                  >
                    Connect
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </ClientOnly>
  );
}
