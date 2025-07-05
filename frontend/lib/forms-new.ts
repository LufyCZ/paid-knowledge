// Forms service migrated to use Walrus storage exclusively
// This file now imports from walrus-forms.ts
export * from "./walrus-forms";

// Legacy exports for backward compatibility
import * as WalrusForms from "./walrus-forms";
import type { BountyForm } from "./types";

export interface CreateFormData {
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  visibility: "Public" | "Private";
  rewardPerQuestion: number;
  rewardToken: "USDC" | "WLD";
  userEligibility?: "Orb" | "Device" | "All";
  questions: {
    id: number;
    title: string;
    description: string;
    type: string;
    options?: string[];
  }[];
  // Optional payment data for funded forms
  paymentData?: {
    amount: number;
    transactionId: string;
    maxQuestions: number;
  };
}

// Legacy function wrapper for backward compatibility
export async function createForm(formData: CreateFormData) {
  return WalrusForms.createBountyForm(formData);
}

export async function getForms() {
  return WalrusForms.getBountyForms();
}

export async function getForm(id: string) {
  return WalrusForms.getBountyForm(id);
}

export async function updateForm(id: string, data: any) {
  return WalrusForms.updateFormStatus(id, data.status);
}

export async function getResponses(formId: string) {
  return WalrusForms.getFormResponses(formId);
}

export async function submitResponse(formId: string, answers: any[]) {
  // Transform answers into the expected format
  const submissionData = {
    formId,
    answers,
    userWallet: null, // Will be set by the API
  };
  return WalrusForms.submitFormResponse(submissionData);
}
