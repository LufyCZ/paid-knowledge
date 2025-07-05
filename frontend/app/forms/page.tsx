"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getBountyForms } from "@/lib/forms";
import { BountyForm } from "@/lib/supabase";
import { Button } from "@/components/ui/button";

export default function FormsListPage() {
  const [forms, setForms] = useState<BountyForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

        setForms(activeForms);
      } catch (err) {
        setError("Failed to load forms");
      } finally {
        setLoading(false);
      }
    }

    loadForms();
  }, []);

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

        {/* Forms Grid */}
        {forms.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📝</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              No Active Forms
            </h2>
            <p className="text-gray-600">
              There are no active bounty forms available at the moment.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {forms.map((form) => (
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

function FormCard({ form }: FormCardProps) {
  const startDate = new Date(form.start_date);
  const endDate = new Date(form.end_date);
  const now = new Date();

  // Calculate days remaining
  const daysRemaining = Math.ceil(
    (endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
            {form.name}
          </h3>
          <div className="flex-shrink-0 ml-2">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Active
            </span>
          </div>
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
                Reward per Question
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
