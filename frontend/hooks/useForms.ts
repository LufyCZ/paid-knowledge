import { useState, useEffect } from "react";
import { supabase, type BountyForm } from "@/lib/supabase";

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

  // Convert Supabase form to our display format
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
      reward: `$${form.reward_per_question} ${form.reward_token}`,
      duration,
      location,
      category: type.toLowerCase(),
      eligibility: form.user_eligibility,
      endDate: form.end_date,
      featured: form.featured,
    };
  };

  // Helper function to extract location from description
  const extractLocationFromDescription = (
    description: string | null
  ): string | undefined => {
    if (!description) return undefined;

    // Simple pattern matching for common location indicators
    const locationPatterns = [
      /in ([A-Z][a-z]+)/i,
      /at ([A-Z][a-z]+)/i,
      /near ([A-Z][a-z]+)/i,
    ];

    for (const pattern of locationPatterns) {
      const match = description.match(pattern);
      if (match) return match[1];
    }

    return undefined;
  };

  // Helper function to calculate estimated duration
  const calculateEstimatedDuration = (form: BountyForm): string => {
    // This is a simplified calculation - in reality you'd query the questions count
    // For now, we'll use a base estimate
    return "5 min"; // Default duration
  };

  const fetchForms = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Use a consistent date string to avoid hydration issues
      const currentDate = new Date().toISOString();

      // Fetch all active, public forms that haven't expired
      const { data: forms, error: formsError } = await supabase
        .from("bounty_forms")
        .select("*")
        .eq("status", "active")
        .eq("visibility", "Public")
        .gt("end_date", currentDate)
        .order("created_at", { ascending: false });

      if (formsError) {
        throw formsError;
      }

      // Transform the data
      const transformedForms = forms?.map(transformForm) || [];

      // Split into featured and all forms
      const featured = transformedForms.filter((form) => form.featured);
      const all = transformedForms.filter((form) => !form.featured);

      setFeaturedForms(featured);
      setAllForms(all);
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

  return {
    featuredForms,
    allForms,
    isLoading: isLoading || !isClient, // Keep loading until client-side
    error,
    refreshForms: fetchForms,
  };
}
