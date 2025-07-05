"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@/hooks/useWallet";
import { useForms, type FormData } from "@/hooks/useForms";
import { ClientOnly } from "@/components/ClientOnly";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const FILTER_OPTIONS = [
  { id: "all", label: "All" },
  { id: "photo", label: "Photo" },
  { id: "survey", label: "Survey" },
];

export default function HomePage() {
  const { isConnected } = useWallet();
  const { featuredForms, allForms, isLoading, error } = useForms();
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [isClient, setIsClient] = useState(false);

  // Prevent hydration mismatch by only rendering after client mount
  useEffect(() => {
    setIsClient(true);
  }, []);

  const filteredForms =
    selectedFilter === "all"
      ? allForms
      : allForms.filter((form) => form.category === selectedFilter);

  // Helper function to get eligibility badge
  const getEligibilityBadge = (eligibility: string) => {
    switch (eligibility) {
      case "Orb":
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
            Orb
          </span>
        );
      case "Device":
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
            Device
          </span>
        );
      case "All":
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
            All
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
            All
          </span>
        );
    }
  };

  // Helper function to format date (hydration-safe)
  const formatEndDate = (dateString: string) => {
    if (!isClient) return ""; // Return empty string during SSR

    const date = new Date(dateString);
    // Use UTC to ensure consistent rendering on server and client
    const month = date.toLocaleDateString("en-US", {
      month: "short",
      timeZone: "UTC",
    });
    const day = date.getUTCDate();
    return `${month} ${day}`;
  };

  const FormCard = ({
    form,
    isFeatured = false,
  }: {
    form: FormData;
    isFeatured?: boolean;
  }) => (
    <Link href={`/form/${form.id}`} className="block">
      <div
        className={`bg-white rounded-xl p-4 shadow-sm border hover:shadow-md transition-shadow ${
          isFeatured ? "min-h-[200px]" : ""
        }`}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-2">
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                form.type === "Survey"
                  ? "bg-purple-100 text-purple-700"
                  : "bg-blue-100 text-blue-700"
              }`}
            >
              {form.type}
            </span>
            <span className="text-lg font-semibold text-gray-900">
              {form.reward}
            </span>
          </div>
          {isFeatured && (
            <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full">
              Featured
            </span>
          )}
        </div>

        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
          {form.title}
        </h3>

        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {form.description}
        </p>

        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center space-x-3">
            {form.duration && (
              <div className="flex items-center">
                <span className="w-4 h-4 mr-1">⏱️</span>
                {form.duration}
              </div>
            )}
            {form.location && (
              <div className="flex items-center">
                <span className="w-4 h-4 mr-1">📍</span>
                {form.location}
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <div
              className="flex items-center"
              title={`Eligible: ${form.eligibility}`}
            >
              {getEligibilityBadge(form.eligibility)}
            </div>
            <div className="flex items-center">
              <span className="w-4 h-4 mr-1">📅</span>
              {formatEndDate(form.endDate)}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );

  return (
    <ClientOnly
      fallback={
        <div className="min-h-screen bg-gray-50 pb-20">
          <div className="bg-white border-b border-gray-200 px-4 py-4">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold text-gray-900">Questy</h1>
              <div className="bg-gray-200 rounded-full px-4 py-2">
                <span className="text-sm text-gray-600">+ Create</span>
              </div>
            </div>
          </div>
          <div className="px-4 py-6">
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
            </div>
          </div>
        </div>
      }
    >
      <div className="min-h-screen bg-gray-50 pb-20">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900">Questy</h1>
            <Link href="/form-builder">
              <Button
                size="sm"
                className="bg-black text-white hover:bg-gray-800 rounded-full px-4"
              >
                + Create
              </Button>
            </Link>
          </div>
        </div>

        <div className="px-4 py-6 space-y-6">
          {/* Show loading until client is mounted to prevent hydration issues */}
          {!isClient || isLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-red-800 text-sm">
                Failed to load forms: {error}
              </p>
            </div>
          ) : (
            <>
              {/* Featured Section */}
              <section>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Featured
                </h2>
                {featuredForms.length > 0 ? (
                  <div className="flex space-x-4 overflow-x-auto scrollbar-hide pb-2">
                    {featuredForms.map((form) => (
                      <div key={form.id} className="flex-shrink-0 w-64">
                        <FormCard form={form} isFeatured={true} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-gray-500 text-center py-8">
                    No featured forms available
                  </div>
                )}
              </section>

              {/* Explore Section */}
              <section>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Explore
                </h2>

                {/* Filter Tabs */}
                <div className="flex space-x-2 mb-4 overflow-x-auto scrollbar-hide pb-2">
                  {FILTER_OPTIONS.map((filter) => (
                    <button
                      key={filter.id}
                      onClick={() => setSelectedFilter(filter.id)}
                      className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                        selectedFilter === filter.id
                          ? "bg-black text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>

                {/* Forms Grid */}
                {filteredForms.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {filteredForms.map((form) => (
                      <FormCard key={form.id} form={form} />
                    ))}
                  </div>
                ) : (
                  <div className="text-gray-500 text-center py-8">
                    No forms available for the selected filter
                  </div>
                )}
              </section>
            </>
          )}

          {/* Connection Prompt for Non-Connected Users */}
          {!isConnected && (
            <div className="fixed bottom-24 left-4 right-4 bg-blue-600 text-white p-4 rounded-xl shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">Connect to earn rewards</h3>
                  <p className="text-sm text-blue-100">
                    Connect your wallet to start earning from forms
                  </p>
                </div>
                <Link href="/account">
                  <Button
                    size="sm"
                    variant="outline"
                    className="bg-white text-blue-600 hover:bg-gray-100 border-white"
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
