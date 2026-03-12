"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";
import type {
  Project,
  ProjectAsset,
  ProjectAssetKind,
  AssetStatus,
  YouTubePackageData,
} from "../lib/types";

type ProjectsContextType = {
  projects: Project[];
  assets: ProjectAsset[];
  createProject: (data: Omit<Project, "id" | "createdAt" | "updatedAt">) => Project;
  getProject: (id: string) => Project | undefined;
  getAssets: (projectId: string) => ProjectAsset[];
  addAsset: (
    projectId: string,
    kind: ProjectAssetKind,
    label: string,
    initialStatus?: AssetStatus
  ) => ProjectAsset;
  updateAssetStatus: (
    assetId: string,
    status: AssetStatus,
    errorMessage?: string | null
  ) => void;
  /** Mock generation: simulates delay then sets success/failure. Returns asset id. */
  mockGenerate: (
    projectId: string,
    kind: ProjectAssetKind,
    label: string,
    options?: { fail?: boolean; delayMs?: number }
  ) => Promise<string>;
  getYouTubePackage: (projectId: string) => YouTubePackageData | undefined;
  setYouTubePackage: (projectId: string, data: YouTubePackageData) => void;
  mockGenerateYouTubePackage: (projectId: string) => Promise<YouTubePackageData>;
};

const ProjectsContext = createContext<ProjectsContextType | null>(null);

function generateId() {
  return Math.random().toString(36).slice(2, 12);
}

export function ProjectsProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [assets, setAssets] = useState<ProjectAsset[]>([]);
  const [youtubePackages, setYoutubePackages] = useState<Record<string, YouTubePackageData>>({});

  const createProject = useCallback(
    (data: Omit<Project, "id" | "createdAt" | "updatedAt">) => {
      const now = new Date().toISOString();
      const project: Project = {
        ...data,
        id: generateId(),
        createdAt: now,
        updatedAt: now,
      };
      setProjects((prev) => [...prev, project]);
      return project;
    },
    []
  );

  const getProject = useCallback(
    (id: string) => projects.find((p) => p.id === id),
    [projects]
  );

  const getAssets = useCallback(
    (projectId: string) =>
      assets.filter((a) => a.projectId === projectId).sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    [assets]
  );

  const addAsset = useCallback(
    (
      projectId: string,
      kind: ProjectAssetKind,
      label: string,
      initialStatus: AssetStatus = "pending"
    ) => {
      const asset: ProjectAsset = {
        id: generateId(),
        projectId,
        kind,
        label,
        url: null,
        status: initialStatus,
        createdAt: new Date().toISOString(),
      };
      setAssets((prev) => [...prev, asset]);
      return asset;
    },
    []
  );

  const updateAssetStatus = useCallback(
    (assetId: string, status: AssetStatus, errorMessage?: string | null) => {
      setAssets((prev) =>
        prev.map((a) =>
          a.id === assetId ? { ...a, status, errorMessage: errorMessage ?? a.errorMessage } : a
        )
      );
    },
    []
  );

  const mockGenerate = useCallback(
    async (
      projectId: string,
      kind: ProjectAssetKind,
      label: string,
      options?: { fail?: boolean; delayMs?: number }
    ): Promise<string> => {
      const delayMs = options?.delayMs ?? 2200;
      const shouldFail = options?.fail ?? false;
      const asset = addAsset(projectId, kind, label, "processing");

      await new Promise((r) => setTimeout(r, delayMs));

      if (shouldFail) {
        updateAssetStatus(asset.id, "failure", "Mock failure (no API connected)");
        throw new Error("Mock failure (no API connected)");
      }
      updateAssetStatus(asset.id, "success");
      return asset.id;
    },
    [addAsset, updateAssetStatus]
  );

  const getYouTubePackage = useCallback(
    (projectId: string) => youtubePackages[projectId],
    [youtubePackages]
  );

  const setYouTubePackage = useCallback(
    (projectId: string, data: YouTubePackageData) => {
      setYoutubePackages((prev) => ({ ...prev, [projectId]: data }));
    },
    []
  );

  const mockGenerateYouTubePackage = useCallback(
    async (projectId: string): Promise<YouTubePackageData> => {
      await new Promise((r) => setTimeout(r, 1800));
      const project = projects.find((p) => p.id === projectId);
      const name = project?.name ?? "Track";
      const genre = project?.genre || "Music";
      const mood = project?.mood || "";
      const data: YouTubePackageData = {
        title: `${name} | ${genre} Type Beat | ${mood ? mood + " " : ""}2025`,
        description: `${name}\n\n🎵 ${genre} type beat\n${mood ? `Mood: ${mood}\n` : ""}\n▶ Use this beat with permission. Credit in description.\n\n#${genre.replace(/\s/g, "")} #typebeat #supremebeats`,
        tags: [name, `${genre} type beat`, "type beat", "beat", genre, "supremebeats", mood].filter(Boolean),
        hashtags: [`#${name.replace(/\s/g, "")}`, `#${genre.replace(/\s/g, "")}typebeat`, "#typebeat", "#supremebeats"],
        readinessScore: 72 + Math.floor(Math.random() * 24),
        generatedAt: new Date().toISOString(),
      };
      setYoutubePackages((prev) => ({ ...prev, [projectId]: data }));
      return data;
    },
    [projects]
  );

  return (
    <ProjectsContext.Provider
      value={{
        projects,
        assets,
        createProject,
        getProject,
        getAssets,
        addAsset,
        updateAssetStatus,
        mockGenerate,
        getYouTubePackage,
        setYouTubePackage,
        mockGenerateYouTubePackage,
      }}
    >
      {children}
    </ProjectsContext.Provider>
  );
}

export function useProjects() {
  const ctx = useContext(ProjectsContext);
  if (!ctx) throw new Error("useProjects must be used within ProjectsProvider");
  return ctx;
}
