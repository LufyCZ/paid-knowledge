"use client";

import { useState } from "react";
import { useWallet } from "@/hooks/useWallet";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const FEATURED_FORMS = [
  {
    id: "1",
    type: "Form",
    title: "Consumer",
    reward: "$13 USD",
    duration: "5 min",
    category: "survey",
  },
  {
    id: "2",
    type: "Photo",
    title: "Yellow Taxi",
    reward: "$13 USD",
    location: "Cannes",
    category: "photo",
  },
  {
    id: "3",
    type: "Form",
    title: "College",
    reward: "$25 USD",
    duration: "8 min",
    category: "survey",
  },
];

const ALL_FORMS = [
  {
    id: "4",
    type: "Form",
    title: "Consumer Electronics",
    reward: "$13 USD",
    duration: "5 min",
    category: "survey",
  },
  {
    id: "5",
    type: "Photo",
    title: "Yellow Taxi",
    reward: "$13 USD",
    location: "Cannes",
    category: "photo",
  },
  {
    id: "6",
    type: "Form",
    title: "Coffee Shop",
    reward: "$8 USD",
    duration: "3 min",
    category: "survey",
  },
  {
    id: "7",
    type: "Photo",
    title: "Street Art & Murals in",
    reward: "$15 USD",
    location: "Downtown",
    category: "photo",
  },
  {
    id: "8",
    type: "Form",
    title: "Remote Work",
    reward: "$20 USD",
    duration: "12 min",
    category: "survey",
  },
  {
    id: "9",
    type: "Photo",
    title: "Local Restaurant",
    reward: "$10 USD",
    location: "Local",
    category: "photo",
  },
];

const FILTER_OPTIONS = [
  { id: "all", label: "All" },
  { id: "photo", label: "Photo" },
  { id: "form", label: "Form" },
  { id: "location", label: "Cannes" },
];

export default function LandingPage() {
  const { isConnected } = useWallet();
  const [selectedFilter, setSelectedFilter] = useState("all");

  const filteredForms =
    selectedFilter === "all"
      ? ALL_FORMS
      : ALL_FORMS.filter(
          (form) =>
            form.category === selectedFilter ||
            form.location?.toLowerCase() === selectedFilter
        );

  const FormCard = ({ form }: { form: any }) => (
    <Link href={`/form/${form.id}`} className="block">
      <div className="bg-white rounded-xl p-4 shadow-sm border hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-2">
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                form.type === "Form"
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
        </div>

        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
          {form.title}
        </h3>

        <div className="flex items-center text-sm text-gray-500">
          {form.duration && (
            <div className="flex items-center mr-4">
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
      </div>
    </Link>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">ProjectName</h1>
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
        {/* Featured Section */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Featured</h2>
          <div className="horizontal-scroll flex space-x-4 overflow-x-auto pb-2">
            {FEATURED_FORMS.map((form) => (
              <div key={form.id} className="flex-shrink-0 w-48">
                <FormCard form={form} />
              </div>
            ))}
          </div>
        </section>

        {/* Explore Section */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Explore</h2>

          {/* Filter Tabs */}
          <div className="flex space-x-2 mb-4 overflow-x-auto pb-2">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredForms.map((form) => (
              <FormCard key={form.id} form={form} />
            ))}
          </div>
        </section>

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
  );
}
