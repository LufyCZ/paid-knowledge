import { useState, useEffect } from "react";
import type { BountyForm } from "@/lib/types";

export interface FormData {
  id: string;
  type: "Survey" | "Photo";
  title: string;
  description: string;
  reward: string;
  duration?: string;
  location?: string;
  category: string;
  eligibility: "Orb" | "Device" | "All";
  endDate: string;
  featured: boolean;
}

export function useForms() {
  const [featuredForms, setFeaturedForms] = useState<FormData[]>([]);
  const [allForms, setAllForms] = useState<FormData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  // Initialize client-side state
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Convert Walrus form to our display format
  const transformForm = (form: BountyForm): FormData => {
    // Determine type based on form content (simplified logic)
    const type =
      form.description?.toLowerCase().includes("photo") ||
      form.name.toLowerCase().includes("photo")
        ? "Photo"
        : "Survey";

    // Extract location from description if it's a photo type
    const location =
      type === "Photo"
        ? extractLocationFromDescription(form.description)
        : undefined;

    // Calculate estimated duration based on questions count (simplified)
    const duration =
      type === "Survey" ? calculateEstimatedDuration(form) : undefined;

    return {
      id: form.id,
      type,
      title: form.name,
      description: form.description || "",
      reward: `${form.reward_per_question} ${form.reward_token}`,
      duration,
      location,
      category: determineCategory(form),
      eligibility: form.user_eligibility,
      endDate: form.end_date,
      featured: form.featured,
    };
  };

  const extractLocationFromDescription = (
    description: string | null
  ): string | undefined => {
    if (!description) return undefined;
    // Simple regex to extract location patterns (can be improved)
    const locationMatch = description.match(
      /(?:in|at|near)\s+([A-Z][a-zA-Z\s]+)/
    );
    return locationMatch ? locationMatch[1].trim() : undefined;
  };

  const calculateEstimatedDuration = (form: BountyForm): string => {
    // Simple estimation: assume 1-2 minutes per question
    // In a real app, you'd fetch the actual questions
    return "5-10 min";
  };

  const determineCategory = (form: BountyForm): string => {
    const name = form.name.toLowerCase();
    const description = form.description?.toLowerCase() || "";

    if (name.includes("photo") || description.includes("photo"))
      return "Photography";
    if (name.includes("survey") || description.includes("survey"))
      return "Research";
    if (name.includes("review") || description.includes("feedback"))
      return "Reviews";
    return "General";
  };

  const fetchForms = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch forms from Walrus API
      const response = await fetch("/api/forms");
      if (!response.ok) {
        throw new Error(`Failed to fetch forms: ${response.statusText}`);
      }

      const data = await response.json();
      const forms: BountyForm[] = data.forms || [];

      // Transform and filter forms
      const transformedForms = forms.map(transformForm);
      const activeForms = transformedForms.filter(
        (form) => new Date(form.endDate) > new Date()
      );

      setAllForms(activeForms);
      setFeaturedForms(activeForms.filter((form) => form.featured));
    } catch (err) {
      console.error("Error fetching forms:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch forms");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isClient) {
      fetchForms();
    }
  }, [isClient]);

  const refreshForms = () => {
    fetchForms();
  };

  return {
    featuredForms,
    allForms,
    isLoading,
    error,
    refreshForms,
  };
}
