import { redirect } from "next/navigation";
import { Project } from "./types";

const demoProjects: Project[] = [
  {
    id: "demo-1",
    userId: "demo-user",
    name: "Neon Nights Cover",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "demo-2",
    userId: "demo-user",
    name: "Acoustic Sunday",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const listProjectsForUser = (userId: string): Project[] => {
  return demoProjects.map((project) => ({ ...project, userId }));
};

export const createProjectStub = (userId: string): Project => {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    userId,
    name: "Untitled Cover",
    createdAt: now,
    updatedAt: now,
  };
};

export const getProjectById = (projectId: string, userId: string): Project => {
  const match = demoProjects.find((project) => project.id === projectId);
  if (match) {
    return { ...match, userId, id: projectId };
  }

  return {
    id: projectId,
    userId,
    name: "Untitled Cover",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
};

export const requireUser = (userId: string | null | undefined) => {
  if (!userId) {
    redirect("/login");
  }
};
