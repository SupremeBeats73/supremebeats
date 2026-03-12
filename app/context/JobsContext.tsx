"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";
import type { Job, JobStatus, JobType } from "../lib/types";
import { JOB_LIMITS, JOB_CREDIT_COST, DEFAULT_DAILY_CREDITS } from "../lib/jobConfig";

function generateJobId() {
  return `job_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

type JobsContextType = {
  jobs: Job[];
  creditsRemaining: number;
  automationPaused: boolean;
  setAutomationPaused: (paused: boolean) => void;
  /** Returns { success, jobId, error }. Caller must run work then completeJob or failJob. */
  submitJob: (
    userId: string,
    projectId: string,
    jobType: JobType,
    options?: { triggeredByAutomation?: boolean }
  ) => { success: boolean; jobId?: string; error?: string };
  completeJob: (jobId: string) => void;
  failJob: (jobId: string, refund?: boolean) => void;
  cancelJob: (jobId: string) => void;
  retryJob: (jobId: string) => boolean;
  getJobsForUser: (userId: string) => Job[];
  getJobs: () => Job[];
  /** For admin: set credits (e.g. reset). */
  setCreditsRemaining: (n: number) => void;
};

const JobsContext = createContext<JobsContextType | null>(null);

export function JobsProvider({ children }: { children: ReactNode }) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [creditsRemaining, setCreditsRemaining] = useState(DEFAULT_DAILY_CREDITS);
  const [automationPaused, setAutomationPaused] = useState(false);

  const activeStatuses: JobStatus[] = ["queued", "processing"];

  const getJobsForUser = useCallback(
    (userId: string) => jobs.filter((j) => j.user_id === userId),
    [jobs]
  );

  const getJobs = useCallback(() => jobs, [jobs]);

  const concurrentCount = useCallback(
    (userId: string) =>
      jobs.filter(
        (j) => j.user_id === userId && activeStatuses.includes(j.status)
      ).length,
    [jobs]
  );

  const submitJob = useCallback(
    (
      userId: string,
      projectId: string,
      jobType: JobType,
      options?: { triggeredByAutomation?: boolean }
    ): { success: boolean; jobId?: string; error?: string } => {
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
            activeStatuses.includes(j.status)
        );
        if (automationRunning) {
          return { success: false, error: "Max 1 automation batch per user" };
        }
      }

      const duplicateKey = `${userId}:${projectId}:${jobType}`;
      const isDuplicate = jobs.some(
        (j) =>
          j.user_id === userId &&
          j.project_id === projectId &&
          j.job_type === jobType &&
          activeStatuses.includes(j.status)
      );
      if (isDuplicate) {
        return { success: false, error: "Duplicate job (same project and type already queued or processing)" };
      }

      const creditCost = JOB_CREDIT_COST[jobType];
      if (creditsRemaining < creditCost) {
        return { success: false, error: "Insufficient credits" };
      }

      const now = new Date().toISOString();
      const jobId = generateJobId();
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
      setCreditsRemaining((c) => c - creditCost);
      return { success: true, jobId };
    },
    [jobs, creditsRemaining, automationPaused, concurrentCount]
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
        setCreditsRemaining((c) => c + job.credit_cost);
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
      if (activeStatuses.includes(job.status)) {
        setCreditsRemaining((c) => c + job.credit_cost);
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
        automationPaused,
        setAutomationPaused,
        submitJob,
        completeJob,
        failJob,
        cancelJob,
        retryJob,
        getJobsForUser,
        getJobs,
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
