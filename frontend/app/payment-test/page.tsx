import { PaymentExample } from "@/components/PaymentExample";

export default function PaymentTestPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            World ID Payment Test
          </h1>
          <p className="mt-2 text-gray-600">
            Test the World ID payment integration for bounty forms
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Payment Interface</h2>
            <PaymentExample />
          </div>
        </div>
      </div>
    </div>
  );
}
