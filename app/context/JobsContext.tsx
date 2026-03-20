"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from "react";
import { useAuth } from "./AuthContext";
import { supabase } from "../lib/supabaseClient";
import type { Job, JobStatus, JobType } from "../lib/types";
import { JOB_LIMITS, JOB_CREDIT_COST } from "../lib/jobConfig";
import { isEliteUser } from "../lib/admin";

/** Display value for Elite (unlimited) users */
const ELITE_DISPLAY_CREDITS = 999999;

const ACTIVE_STATUSES: JobStatus[] = ["queued", "processing"];

function generateJobId() {
  return `job_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

type JobsContextType = {
  jobs: Job[];
  creditsRemaining: number;
  creditsLoading: boolean;
  automationPaused: boolean;
  setAutomationPaused: (paused: boolean) => void;
  /** Async: deducts credits in DB then returns { success, jobId, error }. Caller must run work then completeJob or failJob. */
  submitJob: (
    userId: string,
    projectId: string,
    jobType: JobType,
    options?: { triggeredByAutomation?: boolean }
  ) => Promise<{ success: boolean; jobId?: string; error?: string }>;
  completeJob: (jobId: string) => void;
  failJob: (jobId: string, refund?: boolean) => void;
  cancelJob: (jobId: string) => void;
  retryJob: (jobId: string) => boolean;
  getJobsForUser: (userId: string) => Job[];
  getJobs: () => Job[];
  /** Refresh credits from profile (e.g. after purchase). */
  refreshCredits: () => void;
  /** For admin: set credits (e.g. reset). */
  setCreditsRemaining: (n: number) => void;
};

const JobsContext = createContext<JobsContextType | null>(null);

export function JobsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [creditsRemaining, setCreditsRemaining] = useState(0);
  const [creditsLoading, setCreditsLoading] = useState(true);
  const [automationPaused, setAutomationPaused] = useState(false);

  const fetchCredits = useCallback(async () => {
    if (!user?.id) {
      setCreditsRemaining(0);
      setCreditsLoading(false);
      return;
    }
    setCreditsLoading(true);
    const { data } = await supabase
      .from("profiles")
      .select("credits, mic_tier, is_admin")
      .eq("id", user.id)
      .maybeSingle();
    const credits = typeof data?.credits === "number" ? data.credits : 0;
    const micTier = (data?.mic_tier as string) ?? "";
    const isAdmin = (data?.is_admin as boolean) ?? false;
    setCreditsRemaining(
      isEliteUser(user.email ?? null, micTier, isAdmin)
        ? ELITE_DISPLAY_CREDITS
        : credits
    );
    setCreditsLoading(false);
  }, [user]);

  useEffect(() => {
    // Defer execution so we don't synchronously trigger cascading renders.
    const id = window.setTimeout(() => {
      fetchCredits();
    }, 0);
    return () => window.clearTimeout(id);
  }, [fetchCredits]);

  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel(`jobs-credits-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${user.id}`,
        },
        (payload) => {
          const row = payload.new as { credits?: number; mic_tier?: string; is_admin?: boolean } | undefined;
          if (row && typeof row.credits === "number") {
            const micTier = (row.mic_tier as string) ?? "";
            const isAdmin = (row.is_admin as boolean) ?? false;
            setCreditsRemaining(
              isEliteUser(user?.email ?? null, micTier, isAdmin)
                ? ELITE_DISPLAY_CREDITS
                : row.credits
            );
          }
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, user?.email]);

  const getJobsForUser = useCallback(
    (userId: string) => jobs.filter((j) => j.user_id === userId),
    [jobs]
  );

  const getJobs = useCallback(() => jobs, [jobs]);

  const concurrentCount = useCallback(
    (userId: string) =>
      jobs.filter(
        (j) => j.user_id === userId && ACTIVE_STATUSES.includes(j.status)
      ).length,
    [jobs]
  );

  const submitJob = useCallback(
    async (
      userId: string,
      projectId: string,
      jobType: JobType,
      options?: { triggeredByAutomation?: boolean }
    ): Promise<{ success: boolean; jobId?: string; error?: string }> => {
      const triggeredByAutomation = options?.triggeredByAutomation ?? false;

      if (jobType === "automation_batch" && triggeredByAutomation) {
        return { success: false, error: "Automation cannot trigger automation" };
      }
      if (jobType === "automation_batch" && automationPaused) {
        return { success: false, error: "Automation is paused globally" };
      }
      if (concurrentCount(userId) >= JOB_LIMITS.maxConcurrentPerUser) {
        return { success: false, error: "Max concurrent jobs (5) reached" };
      }
      if (jobType === "automation_batch") {
        const automationRunning = jobs.some(
          (j) =>
            j.user_id === userId &&
            j.job_type === "automation_batch" &&
            ACTIVE_STATUSES.includes(j.status)
        );
        if (automationRunning) {
          return { success: false, error: "Max 1 automation batch per user" };
        }
      }

      const isDuplicate = jobs.some(
        (j) =>
          j.user_id === userId &&
          j.project_id === projectId &&
          j.job_type === jobType &&
          ACTIVE_STATUSES.includes(j.status)
      );
      if (isDuplicate) {
        return { success: false, error: "Duplicate job (same project and type already queued or processing)" };
      }

      const creditCost = JOB_CREDIT_COST[jobType];
      const jobId = generateJobId();

      const res = await fetch("/api/credits/deduct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: creditCost,
          reason: "job_deduct",
          jobId,
        }),
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        return {
          success: false,
          error: (data.error as string) || "Could not deduct credits",
        };
      }

      if (typeof data.newBalance === "number") {
        setCreditsRemaining(data.newBalance);
      } else if (data.unlimited) {
        setCreditsRemaining(ELITE_DISPLAY_CREDITS);
      }

      const now = new Date().toISOString();
      const job: Job = {
        job_id: jobId,
        user_id: userId,
        project_id: projectId,
        job_type: jobType,
        credit_cost: creditCost,
        status: "processing",
        retry_count: 0,
        created_at: now,
        updated_at: now,
        triggered_by_automation: triggeredByAutomation,
      };
      setJobs((prev) => [...prev, job]);
      return { success: true, jobId };
    },
    [jobs, automationPaused, concurrentCount]
  );

  const completeJob = useCallback((jobId: string) => {
    const now = new Date().toISOString();
    setJobs((prev) =>
      prev.map((j) =>
        j.job_id === jobId
          ? { ...j, status: "completed" as JobStatus, updated_at: now, completed_at: now }
          : j
      )
    );
  }, []);

  const failJob = useCallback((jobId: string, refund = true) => {
    const now = new Date().toISOString();
    setJobs((prev) => {
      const job = prev.find((j) => j.job_id === jobId);
      if (!job) return prev;
      if (refund) {
        fetch("/api/credits/refund", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: job.credit_cost,
            reason: "job_refund",
            jobId,
          }),
          credentials: "include",
        })
          .then((r) => r.json())
          .then((data) => {
            if (data.success && typeof data.newBalance === "number") {
              setCreditsRemaining(data.newBalance);
            }
          })
          .catch(() => {});
      }
      return prev.map((j) =>
        j.job_id === jobId
          ? { ...j, status: "failed" as JobStatus, updated_at: now }
          : j
      );
    });
  }, []);

  const cancelJob = useCallback((jobId: string) => {
    const now = new Date().toISOString();
    setJobs((prev) => {
      const job = prev.find((j) => j.job_id === jobId);
      if (!job) return prev;
      if (ACTIVE_STATUSES.includes(job.status)) {
        fetch("/api/credits/refund", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: job.credit_cost,
            reason: "job_refund",
            jobId,
          }),
          credentials: "include",
        })
          .then((r) => r.json())
          .then((data) => {
            if (data.success && typeof data.newBalance === "number") {
              setCreditsRemaining(data.newBalance);
            }
          })
          .catch(() => {});
      }
      return prev.map((j) =>
        j.job_id === jobId
          ? { ...j, status: "cancelled" as JobStatus, updated_at: now }
          : j
      );
    });
  }, []);

  const retryJob = useCallback((jobId: string): boolean => {
    const job = jobs.find((j) => j.job_id === jobId);
    if (!job || job.status !== "failed") return false;
    if (job.retry_count >= JOB_LIMITS.maxRetries) return false;
    const now = new Date().toISOString();
    setJobs((prev) =>
      prev.map((j) =>
        j.job_id === jobId
          ? {
              ...j,
              status: "queued" as JobStatus,
              retry_count: j.retry_count + 1,
              updated_at: now,
              error_message: null,
            }
          : j
      )
    );
    return true;
  }, [jobs]);

  return (
    <JobsContext.Provider
      value={{
        jobs,
        creditsRemaining,
        creditsLoading,
        automationPaused,
        setAutomationPaused,
        submitJob,
        completeJob,
        failJob,
        cancelJob,
        retryJob,
        getJobsForUser,
        getJobs,
        refreshCredits: fetchCredits,
        setCreditsRemaining,
      }}
    >
      {children}
    </JobsContext.Provider>
  );
}

export function useJobs() {
  const ctx = useContext(JobsContext);
  if (!ctx) throw new Error("useJobs must be used within JobsProvider");
  return ctx;
}
