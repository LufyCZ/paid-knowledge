# World ID Payment Integration Guide

This guide explains how to use the World ID payment system in your bounty forms application.

## Overview

The payment integration consists of:

1. **Frontend Hook**: `useWorldPay` - React hook for handling payments
2. **Backend APIs**: Payment initiation and confirmation endpoints
3. **Database**: Payment reference tracking
4. **Worldcoin Integration**: Developer Portal API verification

## Setup

### 1. Environment Variables

Add these to your `.env.local`:

```bash
# Worldcoin Configuration
NEXT_PUBLIC_WORLDCOIN_APP_ID=your_app_id_from_developer_portal
WORLDCOIN_DEV_PORTAL_API_KEY=your_api_key_from_developer_portal

# Supabase Configuration (already configured)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 2. Database Schema

Run the updated SQL schema in your Supabase SQL editor to add the `payment_references` table:

```sql
-- The schema.sql file has been updated with the payment_references table
```

### 3. Worldcoin Developer Portal

1. Go to [Worldcoin Developer Portal](https://developer.worldcoin.org/)
2. Create or select your app
3. Add recipient addresses to the whitelist (Security > Addresses)
4. Get your API key from the settings

## Usage

### Basic Payment

```typescript
import { useWorldPay } from "@/hooks/useWorldPay";
import { Tokens } from "@worldcoin/minikit-js";

function PaymentComponent() {
  const { pay, isLoading, error, lastTransaction } = useWorldPay();

  const handlePayment = async () => {
    const result = await pay({
      to: "0x...", // Recipient address
      amount: "1.5", // Amount in human-readable format
      token: Tokens.USDC, // or Tokens.WLD
      description: "Payment for bounty form completion",
    });

    if (result.status === "success") {
      console.log("Payment successful:", result.transactionId);
    } else {
      console.error("Payment failed:", result.errorMessage);
    }
  };

  return (
    <button onClick={handlePayment} disabled={isLoading}>
      {isLoading ? "Processing..." : "Pay with USDC"}
    </button>
  );
}
```

### Helper Methods

```typescript
// Pay with USDC (recommended for stable value)
const payUSDC = async (to, amount, description, reference?) => {
  return await payUSDC(to, amount, description, reference);
};

// Pay with WLD
const payWLD = async (to, amount, description, reference?) => {
  return await payWLD(to, amount, description, reference);
};
```

## Payment Flow

1. **Initiate**: Call `pay()` or helper methods
2. **Backend Setup**: Hook calls `/api/initiate-payment` to create reference
3. **World App**: User approves payment in World App
4. **Verification**: Hook calls `/api/confirm-payment` to verify with Worldcoin
5. **Database**: Payment status is stored in `payment_references` table

## Payment States

- `initiated`: Payment reference created
- `confirmed`: Payment verified and accepted
- `failed`: Payment failed or verification failed

## Error Handling

```typescript
const { error, clearError } = useWorldPay();

if (error) {
  console.error("Payment error:", error);
  // Show error to user
  clearError(); // Clear error when done
}
```

## Integration with Bounty Forms

For bounty form rewards, you can:

1. **Store form completion**:

```typescript
// When user completes form
const formResponse = await submitFormResponse(formData);

// Trigger payment
const payment = await payUSDC(
  userWalletAddress,
  rewardAmount,
  `Bounty reward for form: ${formName}`,
  formResponse.id // Use form response ID as reference
);
```

2. **Track payments**:

```sql
-- Link payments to form responses
UPDATE payment_references
SET response_id = 'form_response_uuid'
WHERE reference_id = 'payment_reference';
```

## Supported Tokens

- **USDC**: 6 decimals, stable value (recommended)
- **WLD**: 18 decimals, Worldcoin native token
- **ETH**: Not currently supported on Worldchain

## Minimum Payment

- Minimum payment amount: $0.1 USD equivalent
- Gas fees are sponsored by World App

## Security Notes

1. **Recipient Whitelisting**: Add recipient addresses to your Worldcoin app whitelist
2. **Server Verification**: Always verify payments on the backend
3. **Reference Validation**: Check payment references match your database
4. **Environment Keys**: Keep API keys secure and never expose service role keys

## Testing

Use the `PaymentExample` component for testing:

```typescript
import { PaymentExample } from "@/components/PaymentExample";

// In your page or component
<PaymentExample />;
```

## API Endpoints

### POST /api/initiate-payment

- Creates a unique payment reference
- Stores reference in database
- Returns: `{ id: "payment_reference" }`

### POST /api/confirm-payment

- Verifies payment with Worldcoin API
- Updates payment status in database
- Returns: `{ success: boolean }`

## Troubleshooting

1. **MiniKit not ready**: Ensure World App is installed and MiniKit is initialized
2. **Payment failed**: Check recipient address is whitelisted
3. **Verification failed**: Ensure API key and app ID are correct
4. **Amount too small**: Minimum $0.1 USD equivalent required

## Next Steps

- Add user authentication for secure payments
- Implement payment history and tracking
- Add webhook support for real-time payment updates
- Integrate with form completion workflow
