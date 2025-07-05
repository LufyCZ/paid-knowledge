# Dynamic Forms with TanStack Form Integration

This document explains the complete form system implementation with TanStack Form, database integration, and crypto payment rewards.

## System Overview

The form system consists of:

1. **Form Builder** (`/form-builder`) - Create forms with questions
2. **Form List** (`/forms`) - Browse available public forms
3. **Form Submission** (`/form/[id]`) - Complete forms and earn rewards
4. **Database Integration** - Store forms, questions, and responses
5. **Payment Integration** - Automatic crypto rewards

## Architecture

### Database Schema

```sql
-- Forms table stores form metadata
bounty_forms (id, name, description, dates, rewards, status)

-- Questions table stores individual questions
form_questions (id, form_id, title, type, options, order_index)

-- Responses table tracks form submissions
form_responses (id, form_id, wallet_address, total_reward, status)

-- Answers table stores individual question answers
question_answers (id, response_id, question_id, answer_text, answer_options)

-- Payment tracking
payment_references (id, reference_id, transaction_id, status)
```

### Form Flow

1. **Create**: Admin creates form with questions in form builder
2. **Publish**: Form status set to "active" and becomes publicly available
3. **Browse**: Users discover forms on `/forms` page
4. **Complete**: Users submit form responses on `/form/[id]`
5. **Reward**: Automatic crypto payment to user's wallet
6. **Track**: All submissions and payments stored in database

## Question Types

### 1. Text Input

```typescript
{
  type: "text",
  title: "What is your name?",
  description: "Please enter your full name",
  required: true
}
```

### 2. Textarea

```typescript
{
  type: "textarea",
  title: "Describe your experience",
  description: "Please provide detailed feedback",
  required: true
}
```

### 3. Number Input

```typescript
{
  type: "number",
  title: "How old are you?",
  description: "Enter your age in years",
  required: true
}
```

### 4. Single Choice (Radio)

```typescript
{
  type: "single-choice",
  title: "What is your favorite color?",
  options: ["Red", "Blue", "Green", "Yellow"],
  required: true
}
```

### 5. Multiple Choice (Checkbox)

```typescript
{
  type: "multiple-choice",
  title: "Which programming languages do you know?",
  options: ["JavaScript", "Python", "Java", "C++"],
  required: true
}
```

## Form Validation

### TanStack Form Validation

```typescript
// Text validation
validators: {
  onChange: ({ value }) => {
    if (!value || (typeof value === 'string' && value.length < 1)) {
      return "This field is required";
    }
    return undefined;
  },
}

// Number validation
validators: {
  onChange: ({ value }) => {
    if (!value) return "This field is required";
    const num = parseFloat(value.toString());
    if (isNaN(num)) return "Please enter a valid number";
    return undefined;
  },
}

// Selection validation
validators: {
  onChange: ({ value }) => {
    if (!value) return "Please select an option";
    return undefined;
  },
}
```

### Form State Management

- **Can Submit**: Form validates all required fields are filled
- **Loading States**: Shows spinner during submission
- **Error Handling**: Displays validation and submission errors
- **Success State**: Confirmation page after successful submission

## Payment Integration

### Automatic Rewards

```typescript
// Calculate total reward
const totalReward = form.reward_per_question * submissionData.answers.length;

// Process payment after form submission
const paymentFunction = formData.reward_token === "USDC" ? payUSDC : payWLD;
await paymentFunction(
  userWalletAddress,
  totalReward.toString(),
  `Bounty reward for form: ${formData.name}`,
  responseId
);
```

### Payment Flow

1. User submits form with wallet connected
2. Form response saved to database
3. Total reward calculated (questions × reward_per_question)
4. Payment initiated using World ID payment hook
5. Payment reference linked to form response
6. User receives crypto directly to their wallet

## API Functions

### Form Operations

```typescript
// Create new form with questions
await createBountyForm(formData);

// Get all public active forms
await getBountyForms();

// Get specific form with questions
await getBountyForm(formId);

// Submit form response
await submitFormResponse({
  formId,
  walletAddress,
  answers: [...]
});

// Update form status
await updateFormStatus(formId, "active");
```

### Response Handling

```typescript
// All API functions return consistent format
{
  success: boolean,
  data?: any,
  error?: string
}
```

## User Experience

### Mobile-First Design

- Touch-friendly form controls
- Responsive layout for all screen sizes
- Clear visual hierarchy and spacing
- Easy navigation between questions

### Form Discovery

- **Forms List Page**: Browse all available forms
- **Form Cards**: Show reward amount, time remaining, description
- **Filtering**: Only shows active, public, valid-date forms
- **Call-to-Action**: Clear "Start Form" buttons

### Form Completion

- **Progress Indication**: Question numbers and total count
- **Reward Display**: Shows reward per question and total reward
- **Wallet Integration**: Connect wallet before submission
- **Real-time Validation**: Immediate feedback on field errors
- **Success Confirmation**: Clear confirmation after submission

## Security & Validation

### Form Access Control

- Only active forms can be accessed
- Date range validation (start_date to end_date)
- Public/Private visibility settings
- Form status validation (draft/active/completed/cancelled)

### Data Validation

- Frontend validation with TanStack Form
- Backend validation in API routes
- Type safety with TypeScript
- Required field enforcement

### Payment Security

- Wallet connection required for submission
- Payment verification through Worldcoin API
- Transaction tracking in database
- Reference ID linking to prevent fraud

## Usage Examples

### Creating a Survey Form

```typescript
const formData = {
  name: "User Experience Survey",
  description: "Help us improve our platform",
  startDate: "2025-01-01",
  endDate: "2025-12-31",
  visibility: "Public",
  rewardPerQuestion: 0.5,
  rewardToken: "USDC",
  questions: [
    {
      id: 1,
      title: "How satisfied are you with our service?",
      type: "single-choice",
      options: [
        "Very Satisfied",
        "Satisfied",
        "Neutral",
        "Dissatisfied",
        "Very Dissatisfied",
      ],
    },
    {
      id: 2,
      title: "What features would you like to see?",
      type: "textarea",
      description: "Please describe in detail",
    },
  ],
};

await createBountyForm(formData);
```

### Form Submission

```typescript
const submissionData = {
  formId: "form_uuid",
  walletAddress: "0x...",
  answers: [
    {
      questionId: "question_1_uuid",
      answerText: "Very Satisfied",
    },
    {
      questionId: "question_2_uuid",
      answerText: "I would like to see better mobile interface",
    },
  ],
};

const result = await submitFormResponse(submissionData);
// User receives: 2 questions × 0.5 USDC = 1.0 USDC reward
```

## Error Handling

### Common Errors and Solutions

1. **Form Not Found**: Check form ID and ensure form exists
2. **Form Inactive**: Only active forms can be accessed
3. **Date Range**: Forms outside date range are inaccessible
4. **Wallet Not Connected**: User must connect wallet before submission
5. **Validation Errors**: All required fields must be completed
6. **Payment Failures**: Check wallet balance and network connectivity

### Error Display

- Clear error messages for users
- Retry buttons where appropriate
- Fallback to home page if form unavailable
- Success confirmations for completed actions

## Performance Considerations

### Optimizations

- Dynamic imports for form components
- Efficient database queries with proper indexes
- Minimal re-renders with TanStack Form
- Lazy loading of form data
- Responsive images and assets

### Caching Strategy

- Form data cached after initial load
- Static form list with periodic refresh
- Payment status polling for real-time updates
- Browser storage for form progress (future enhancement)

This complete form system provides a seamless experience for creating, discovering, and completing bounty forms with crypto rewards!
