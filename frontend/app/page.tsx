"use client";

import { useWallet } from "@/hooks/useWallet";
import { ClientOnly } from "@/components/ClientOnly";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/lib/trpc";

export default function HomePage() {
  const { isConnected } = useWallet();
  const trpc = useTRPC();
  const {
    data: forms,
    error,
    isLoading,
  } = useQuery(trpc.questions.get.queryOptions());

  const FormCard = ({ form }: { form: NonNullable<typeof forms>[number] }) => (
    <Link href={`/form/${form.id}`} className="block">
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 hover:border-gray-200">
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
          <div className="text-lg font-semibold text-gray-900">
            {form.reward?.amount}
          </div>
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

        <div className="px-6 py-8 space-y-8">
          {/* Show loading until client is mounted to prevent hydration issues */}
          {isLoading ? (
            <div className="flex justify-center items-center py-16">
              <div className="text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-black mx-auto mb-4"></div>
                <p className="text-gray-600">Loading forms...</p>
              </div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
              <div className="text-4xl mb-4">⚠️</div>
              <p className="text-red-800 font-medium mb-2">
                Something went wrong
              </p>
              <p className="text-red-600 text-sm">{error.message}</p>
            </div>
          ) : (
            <>
              {/* Explore Section */}
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-6">
                  Explore
                </h2>

                {/* Forms Grid */}
                {forms && forms.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {forms.map((form) => (
                      <FormCard key={form.id} form={form} />
                    ))}
                  </div>
                ) : (
                  <div className="text-gray-500 text-center py-12 bg-white rounded-2xl border border-gray-100">
                    <div className="text-4xl mb-4">🔍</div>
                    <p>No forms available for the selected filter</p>
                  </div>
                )}
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
