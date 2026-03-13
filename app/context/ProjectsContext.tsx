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
import {
  fetchProjects,
  fetchAssetsForProjects,
  fetchYouTubePackagesForProjects,
  createProjectInSupabase,
  insertAssetInSupabase,
  updateAssetStatusInSupabase,
  upsertYouTubePackageInSupabase,
} from "../lib/supabaseProjects";
import { uploadAssetToBucket } from "../lib/uploadAsset";
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
  projectsLoading: boolean;
  createProject: (data: Omit<Project, "id" | "createdAt" | "updatedAt">) => Promise<Project>;
  getProject: (id: string) => Project | undefined;
  getAssets: (projectId: string) => ProjectAsset[];
  addAsset: (
    projectId: string,
    kind: ProjectAssetKind,
    label: string,
    initialStatus?: AssetStatus
  ) => Promise<ProjectAsset>;
  uploadFile: (
    projectId: string,
    file: File,
    kind: ProjectAssetKind,
    label?: string
  ) => Promise<ProjectAsset>;
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
  setYouTubePackage: (projectId: string, data: YouTubePackageData) => void | Promise<void>;
  mockGenerateYouTubePackage: (projectId: string) => Promise<YouTubePackageData>;
};

const ProjectsContext = createContext<ProjectsContextType | null>(null);

export function ProjectsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [assets, setAssets] = useState<ProjectAsset[]>([]);
  const [youtubePackages, setYoutubePackages] = useState<Record<string, YouTubePackageData>>({});
  const [projectsLoading, setProjectsLoading] = useState(true);

  // Load projects, assets, and YouTube packages from Supabase when user is set
  useEffect(() => {
    if (!user?.id) {
      setProjects([]);
      setAssets([]);
      setYoutubePackages({});
      setProjectsLoading(false);
      return;
    }
    let cancelled = false;
    setProjectsLoading(true);
    (async () => {
      try {
        const projectList = await fetchProjects(user.id);
        if (cancelled) return;
        setProjects(projectList);
        const ids = projectList.map((p) => p.id);
        const [assetList, packages] = await Promise.all([
          fetchAssetsForProjects(user.id, ids),
          fetchYouTubePackagesForProjects(user.id, ids),
        ]);
        if (cancelled) return;
        setAssets(assetList);
        setYoutubePackages(packages);
      } catch (e) {
        if (!cancelled) {
          console.error("Failed to load projects from Supabase", e);
          setProjects([]);
          setAssets([]);
          setYoutubePackages({});
        }
      } finally {
        if (!cancelled) setProjectsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const createProject = useCallback(
    async (data: Omit<Project, "id" | "createdAt" | "updatedAt">): Promise<Project> => {
      if (!user?.id) {
        if (process.env.NODE_ENV === "development") {
          console.error("[ProjectsContext] createProject called but user is not signed in", {
            hasUser: !!user,
            userId: user?.id ?? null,
          });
        }
        throw new Error("Must be signed in to create a project");
      }
      if (process.env.NODE_ENV === "development") {
        console.log("[ProjectsContext] createProject calling Supabase with user_id:", user.id);
      }
      const project = await createProjectInSupabase(user.id, data);
      setProjects((prev) => [...prev, project]);
      return project;
    },
    [user?.id]
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
    async (
      projectId: string,
      kind: ProjectAssetKind,
      label: string,
      initialStatus: AssetStatus = "pending"
    ): Promise<ProjectAsset> => {
      if (!user?.id) throw new Error("Must be signed in to add an asset");
      const asset = await insertAssetInSupabase(user.id, projectId, kind, label, initialStatus);
      setAssets((prev) => [...prev, asset]);
      return asset;
    },
    [user?.id]
  );

  const uploadFile = useCallback(
    async (
      projectId: string,
      file: File,
      kind: ProjectAssetKind,
      label?: string
    ): Promise<ProjectAsset> => {
      if (!user?.id) {
        throw new Error("Must be signed in to upload an asset");
      }

      const publicUrl = await uploadAssetToBucket(file, {
        folder: `projects/${projectId}`,
      });

      const asset = await insertAssetInSupabase(
        user.id,
        projectId,
        kind,
        label ?? file.name,
        "success"
      );

      // Ensure local state and Supabase both have the URL set.
      setAssets((prev) =>
        prev.map((a) =>
          a.id === asset.id
            ? {
                ...a,
                url: publicUrl,
              }
            : a
        )
      );
      await updateAssetStatusInSupabase(asset.id, "success", undefined, publicUrl);

      return { ...asset, url: publicUrl };
    },
    [user?.id]
  );

  const updateAssetStatus = useCallback(
    (
      assetId: string,
      status: AssetStatus,
      errorMessage?: string | null,
      url?: string | null
    ) => {
      setAssets((prev) =>
        prev.map((a) =>
          a.id === assetId
            ? {
                ...a,
                status,
                errorMessage: errorMessage ?? a.errorMessage,
                url: url ?? a.url,
              }
            : a
        )
      );
      updateAssetStatusInSupabase(assetId, status, errorMessage, url).catch((e) =>
        console.error("Failed to update asset status in Supabase", e)
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
      const asset = await addAsset(projectId, kind, label, "processing");

      await new Promise((r) => setTimeout(r, delayMs));

      if (shouldFail) {
        updateAssetStatus(asset.id, "failure", "Mock failure (no API connected)");
        throw new Error("Mock failure (no API connected)");
      }

      let url: string | null = null;
      if (kind === "thumbnail" || kind === "cover_art") {
        url =
          "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=1000&auto=format&fit=crop";
      } else if (kind === "beat" || kind === "full_song") {
        url =
          "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3";
      }

      updateAssetStatus(asset.id, "success", undefined, url);
      return asset.id;
    },
    [addAsset, updateAssetStatus]
  );

  const getYouTubePackage = useCallback(
    (projectId: string) => youtubePackages[projectId],
    [youtubePackages]
  );

  const setYouTubePackage = useCallback(
    async (projectId: string, data: YouTubePackageData) => {
      if (!user?.id) return;
      try {
        await upsertYouTubePackageInSupabase(user.id, projectId, data);
        setYoutubePackages((prev) => ({ ...prev, [projectId]: data }));
      } catch (e) {
        console.error("Failed to save YouTube package to Supabase", e);
      }
    },
    [user?.id]
  );

  const mockGenerateYouTubePackage = useCallback(
    async (projectId: string): Promise<YouTubePackageData> => {
      if (!user?.id) throw new Error("Must be signed in to generate YouTube package");
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
      await upsertYouTubePackageInSupabase(user.id, projectId, data);
      setYoutubePackages((prev) => ({ ...prev, [projectId]: data }));
      return data;
    },
    [user?.id, projects]
  );

  return (
    <ProjectsContext.Provider
      value={{
        projects,
        assets,
        projectsLoading,
        createProject,
        getProject,
        getAssets,
        addAsset,
        uploadFile,
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
