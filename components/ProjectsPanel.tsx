"use client";

import { useState } from "react";
import { Project, Chat } from "@/lib/firestore";
import { FolderOpen, Plus, Trash2, MessageSquare, X } from "lucide-react";

interface ProjectsPanelProps {
  projects: Project[];
  chats: Chat[];
  onCreateProject: (name: string, description: string) => Promise<void>;
  onDeleteProject: (id: string) => Promise<void>;
  onSelectChat: (id: string) => void;
}

export default function ProjectsPanel({ projects, chats, onCreateProject, onDeleteProject, onSelectChat }: ProjectsPanelProps) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setLoading(true);
    await onCreateProject(name, description);
    setName(""); setDescription(""); setShowForm(false);
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-full bg-[#212121] p-6">
      <div className="max-w-3xl mx-auto w-full">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-xl flex items-center justify-center">
              <FolderOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-white font-bold text-xl">Projects</h1>
              <p className="text-gray-500 text-sm">Organize your conversations</p>
            </div>
          </div>
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:from-violet-500 hover:to-indigo-500">
            <Plus className="w-4 h-4" /> New Project
          </button>
        </div>

        {showForm && (
          <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-5 mb-6 animate-scale-in">
            <div className="flex items-center justify-between mb-4">
              <span className="text-white font-semibold">Create Project</span>
              <button onClick={() => setShowForm(false)}><X className="w-4 h-4 text-gray-500" /></button>
            </div>
            <input type="text" placeholder="Project name" value={name} onChange={(e) => setName(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-violet-500 mb-3" />
            <input type="text" placeholder="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-violet-500 mb-4" />
            <button onClick={handleCreate} disabled={!name.trim() || loading}
              className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white py-2.5 rounded-xl text-sm font-semibold disabled:opacity-40 transition-all">
              {loading ? "Creating..." : "Create Project"}
            </button>
          </div>
        )}

        {projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <FolderOpen className="w-12 h-12 text-gray-700 mb-3" />
            <p className="text-gray-500 text-sm">No projects yet</p>
            <p className="text-gray-700 text-xs mt-1">Create a project to organize your chats</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {projects.map((project) => {
              const projectChats = chats.filter((c) => c.projectId === project.id);
              return (
                <div key={project.id} className="bg-white/[0.04] border border-white/10 rounded-2xl p-4 hover:border-violet-500/30 transition-all group">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <FolderOpen className="w-4 h-4 text-violet-400" />
                      <span className="text-white font-semibold text-sm">{project.name}</span>
                    </div>
                    <button onClick={() => onDeleteProject(project.id)} className="opacity-0 group-hover:opacity-100 text-gray-700 hover:text-red-400 transition-all">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {project.description && <p className="text-gray-500 text-xs mb-3">{project.description}</p>}
                  <div className="space-y-1">
                    {projectChats.length === 0 ? (
                      <p className="text-gray-700 text-xs">No chats in this project</p>
                    ) : projectChats.map((chat) => (
                      <button key={chat.id} onClick={() => onSelectChat(chat.id)}
                        className="flex items-center gap-2 w-full text-left text-gray-400 hover:text-white text-xs py-1 px-2 rounded-lg hover:bg-white/5 transition-colors">
                        <MessageSquare className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{chat.title}</span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
