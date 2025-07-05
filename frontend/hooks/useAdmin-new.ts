"use client";
import { useState, useEffect } from "react";

// Hook for admin form management - now using Walrus storage
export const useAdminForms = () => {
  const [forms, setForms] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchForms = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/forms?admin=true");
      if (!response.ok) {
        throw new Error(`Failed to fetch forms: ${response.statusText}`);
      }

      const data = await response.json();
      setForms(data.forms || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch forms");
    } finally {
      setLoading(false);
    }
  };

  const updateFormStatus = async (
    formIds: string[],
    status: "draft" | "active" | "completed" | "cancelled"
  ) => {
    setLoading(true);
    setError(null);

    try {
      const promises = formIds.map(async (id) => {
        const response = await fetch(`/api/forms/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status }),
        });

        if (!response.ok) {
          throw new Error(
            `Failed to update form ${id}: ${response.statusText}`
          );
        }

        return response.json();
      });

      await Promise.all(promises);
      await fetchForms(); // Refresh the forms list
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update forms");
    } finally {
      setLoading(false);
    }
  };

  const deleteForm = async (formId: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/forms/${formId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(`Failed to delete form: ${response.statusText}`);
      }

      await fetchForms(); // Refresh the forms list
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete form");
    } finally {
      setLoading(false);
    }
  };

  const toggleFormFeature = async (formId: string, featured: boolean) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/forms/${formId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ featured }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update form: ${response.statusText}`);
      }

      await fetchForms(); // Refresh the forms list
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update form");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForms();
  }, []);

  return {
    forms,
    loading,
    error,
    fetchForms,
    updateFormStatus,
    deleteForm,
    toggleFormFeature,
  };
};

// Hook for admin user management - now using Walrus storage
export const useAdminUsers = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/profile?admin=true");
      if (!response.ok) {
        throw new Error(`Failed to fetch users: ${response.statusText}`);
      }

      const data = await response.json();
      setUsers(data.users || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  const updateUserVerification = async (
    userId: string,
    verificationLevel: "unverified" | "device" | "orb"
  ) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: userId,
          verification_level: verificationLevel,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update user: ${response.statusText}`);
      }

      await fetchUsers(); // Refresh the users list
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update user");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return {
    users,
    loading,
    error,
    fetchUsers,
    updateUserVerification,
  };
};

// Hook for admin analytics - now using Walrus storage
export const useAdminAnalytics = () => {
  const [analytics, setAnalytics] = useState({
    totalForms: 0,
    totalUsers: 0,
    totalResponses: 0,
    totalRewards: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch analytics from multiple endpoints
      const [formsRes, usersRes] = await Promise.all([
        fetch("/api/forms?admin=true"),
        fetch("/api/profile?admin=true"),
      ]);

      if (!formsRes.ok || !usersRes.ok) {
        throw new Error("Failed to fetch analytics data");
      }

      const [formsData, usersData] = await Promise.all([
        formsRes.json(),
        usersRes.json(),
      ]);

      const forms = formsData.forms || [];
      const users = usersData.users || [];

      // Calculate analytics
      const totalResponses = forms.reduce(
        (sum: number, form: any) => sum + (form.response_count || 0),
        0
      );
      const totalRewards = forms.reduce(
        (sum: number, form: any) => sum + (form.total_rewards_paid || 0),
        0
      );

      setAnalytics({
        totalForms: forms.length,
        totalUsers: users.length,
        totalResponses,
        totalRewards,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch analytics"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  return {
    analytics,
    loading,
    error,
    fetchAnalytics,
  };
};
