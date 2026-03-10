'use client';

import { useState, useEffect } from 'react';
import { Save, ExternalLink, Upload, X, Plus, GripVertical } from 'lucide-react';

interface Profile {
  display_name: string;
  bio: string;
  profile_picture_url: string | null;
  cover_photo_url: string | null;
  social_links: Record<string, string>;
  public_profile_slug: string;
}

interface Project {
  id: string;
  project_name: string;
  project_type: string;
  description: string;
  cover_image_url: string | null;
  link: string;
  is_public: boolean;
  display_order: number;
}

const SOCIAL_FIELDS = [
  { key: 'spotify', label: 'Spotify', placeholder: 'https://open.spotify.com/artist/...' },
  { key: 'appleMusic', label: 'Apple Music', placeholder: 'https://music.apple.com/...' },
  { key: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/...' },
  { key: 'facebook', label: 'Facebook', placeholder: 'https://facebook.com/...' },
  { key: 'youtube', label: 'YouTube', placeholder: 'https://youtube.com/...' },
  { key: 'soundcloud', label: 'SoundCloud', placeholder: 'https://soundcloud.com/...' },
  { key: 'tiktok', label: 'TikTok', placeholder: 'https://tiktok.com/@...' },
  { key: 'twitter', label: 'Twitter / X', placeholder: 'https://x.com/...' },
];

export default function ProfileEditor({ userId, profileSlug }: { userId: string; profileSlug: string }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState<'profile' | 'cover' | null>(null);

  // Form state
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [profilePicUrl, setProfilePicUrl] = useState('');
  const [coverPhotoUrl, setCoverPhotoUrl] = useState('');
  const [socialLinks, setSocialLinks] = useState<Record<string, string>>({});

  // Projects
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);

  useEffect(() => {
    fetch('/api/profile')
      .then((r) => r.json())
      .then((data) => {
        if (data.profile) {
          const p = data.profile;
          setDisplayName(p.display_name || '');
          setBio(p.bio || '');
          setProfilePicUrl(p.profile_picture_url || '');
          setCoverPhotoUrl(p.cover_photo_url || '');
          setSocialLinks(p.social_links || {});
        }
      })
      .finally(() => setLoading(false));

    fetch('/api/profile/projects')
      .then((r) => r.json())
      .then((data) => setProjects(data.projects || []))
      .finally(() => setLoadingProjects(false));
  }, []);

  function updateSocial(key: string, value: string) {
    setSocialLinks((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    setSaved(false);

    // Filter out empty social links
    const filteredLinks: Record<string, string> = {};
    Object.entries(socialLinks).forEach(([k, v]) => {
      if (v?.trim()) filteredLinks[k] = v.trim();
    });

    const res = await fetch('/api/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        display_name: displayName,
        bio,
        social_links: filteredLinks,
      }),
    });

    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
    setSaving(false);
  }

  async function handlePhotoUpload(file: File, type: 'profile' | 'cover') {
    setUploading(type);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    const res = await fetch('/api/profile/photo', { method: 'POST', body: formData });
    const data = await res.json();
    if (data.url) {
      if (type === 'profile') setProfilePicUrl(data.url);
      else setCoverPhotoUrl(data.url);
    }
    setUploading(null);
  }

  async function handleProjectImageUpload(file: File, projectId: string) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'project');
    formData.append('projectId', projectId);

    const res = await fetch('/api/profile/photo', { method: 'POST', body: formData });
    const data = await res.json();
    if (data.url) {
      setProjects((prev) => prev.map((p) => p.id === projectId ? { ...p, cover_image_url: data.url } : p));
    }
  }

  async function addProject() {
    const res = await fetch('/api/profile/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        project_name: 'New Project',
        project_type: '',
        description: '',
        link: '',
        display_order: projects.length,
      }),
    });
    const data = await res.json();
    if (data.project) setProjects((prev) => [...prev, data.project]);
  }

  async function updateProject(id: string, updates: Partial<Project>) {
    setProjects((prev) => prev.map((p) => p.id === id ? { ...p, ...updates } : p));
  }

  async function saveProject(project: Project) {
    await fetch('/api/profile/projects', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(project),
    });
  }

  async function deleteProject(id: string) {
    await fetch(`/api/profile/projects?id=${id}`, { method: 'DELETE' });
    setProjects((prev) => prev.filter((p) => p.id !== id));
  }

  if (loading) {
    return <p className="font-mono text-sm text-black/40">Loading profile...</p>;
  }

  return (
    <div className="space-y-10">
      {/* Cover Photo */}
      <div>
        <label className="block font-mono text-xs font-semibold uppercase tracking-wider mb-3">Cover Photo</label>
        <div className="relative w-full aspect-[3/1] bg-black/5 overflow-hidden mb-2">
          {coverPhotoUrl ? (
            <img src={coverPhotoUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="font-mono text-sm text-black/20">No cover photo</span>
            </div>
          )}
        </div>
        <label className="cursor-pointer inline-flex items-center gap-2 bg-black text-white font-mono text-xs font-bold uppercase tracking-wider px-4 py-2 hover:bg-black/80 transition-colors">
          <Upload className="w-3 h-3" />
          {uploading === 'cover' ? 'Uploading...' : 'Upload Cover'}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handlePhotoUpload(f, 'cover'); }}
            disabled={uploading !== null}
          />
        </label>
        <span className="font-mono text-[10px] text-black/30 ml-3">Recommended: 1500×500, JPG or PNG, max 5MB</span>
      </div>

      {/* Profile Picture */}
      <div>
        <label className="block font-mono text-xs font-semibold uppercase tracking-wider mb-3">Profile Photo</label>
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 bg-black/5 flex items-center justify-center overflow-hidden flex-shrink-0">
            {profilePicUrl ? (
              <img src={profilePicUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="font-heading text-3xl text-black/10">{displayName?.[0]?.toUpperCase() || '?'}</span>
            )}
          </div>
          <div>
            <label className="cursor-pointer inline-flex items-center gap-2 bg-black text-white font-mono text-xs font-bold uppercase tracking-wider px-4 py-2 hover:bg-black/80 transition-colors">
              <Upload className="w-3 h-3" />
              {uploading === 'profile' ? 'Uploading...' : 'Upload Photo'}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handlePhotoUpload(f, 'profile'); }}
                disabled={uploading !== null}
              />
            </label>
            <p className="font-mono text-[10px] text-black/30 mt-2">Square recommended, max 5MB</p>
          </div>
        </div>
      </div>

      {/* Display Name */}
      <div>
        <label className="block font-mono text-xs font-semibold uppercase tracking-wider mb-1">Display Name</label>
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="w-full border-2 border-black px-4 py-3 font-mono text-sm focus:border-accent focus:outline-none"
          placeholder="Your name or artist name"
        />
      </div>

      {/* Bio */}
      <div>
        <label className="block font-mono text-xs font-semibold uppercase tracking-wider mb-1">Bio</label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={4}
          className="w-full border-2 border-black/20 px-4 py-3 font-mono text-sm focus:border-accent focus:outline-none resize-vertical"
          placeholder="Tell people about yourself..."
        />
      </div>

      {/* Social Links */}
      <div>
        <label className="block font-mono text-xs font-semibold uppercase tracking-wider mb-3">Social Links</label>
        <div className="space-y-3">
          {SOCIAL_FIELDS.map((field) => (
            <div key={field.key} className="flex items-center gap-3">
              <span className="font-mono text-xs text-black/50 w-28 flex-shrink-0">{field.label}</span>
              <input
                type="url"
                value={socialLinks[field.key] || ''}
                onChange={(e) => updateSocial(field.key, e.target.value)}
                className="flex-1 border border-black/20 px-3 py-2 font-mono text-xs focus:border-accent focus:outline-none"
                placeholder={field.placeholder}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Public profile link */}
      {profileSlug && (
        <div className="border border-black/10 p-4 flex items-center justify-between">
          <div>
            <p className="font-mono text-[10px] text-black/40 uppercase tracking-wider">Your Public Profile</p>
            <p className="font-mono text-sm">/u/{profileSlug}</p>
          </div>
          <a
            href={`/u/${profileSlug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-xs text-accent hover:underline inline-flex items-center gap-1"
          >
            View <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}

      {/* Save Profile */}
      <button
        onClick={handleSave}
        disabled={saving || !displayName.trim()}
        className="w-full bg-accent text-black font-mono text-base font-bold uppercase tracking-wider py-4 hover:bg-accent/90 transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2"
      >
        <Save className="w-4 h-4" />
        {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Profile'}
      </button>

      {/* ============ PROJECTS ============ */}
      <div className="border-t-2 border-black pt-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-heading-lg">PROJECTS</h2>
            <p className="font-mono text-xs text-black/40 mt-1">Showcase your releases, singles, and projects with cover art and links.</p>
          </div>
          <button
            onClick={addProject}
            className="inline-flex items-center gap-2 bg-black text-white font-mono text-xs font-bold uppercase tracking-wider px-4 py-2 hover:bg-black/80 transition-colors"
          >
            <Plus className="w-3 h-3" /> Add Project
          </button>
        </div>

        {loadingProjects ? (
          <p className="font-mono text-sm text-black/40">Loading projects...</p>
        ) : projects.length === 0 ? (
          <p className="font-mono text-xs text-black/30 border border-black/10 p-8 text-center">
            No projects yet. Add your first release, single, or project to showcase on your profile.
          </p>
        ) : (
          <div className="space-y-6">
            {projects.map((project) => (
              <div key={project.id} className="border-2 border-black/10 p-5">
                <div className="flex gap-4">
                  {/* Cover art */}
                  <div className="w-32 h-32 bg-black/5 flex-shrink-0 overflow-hidden relative group">
                    {project.cover_image_url ? (
                      <img src={project.cover_image_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="font-mono text-[10px] text-black/20">No art</span>
                      </div>
                    )}
                    <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer flex items-center justify-center">
                      <Upload className="w-5 h-5 text-white" />
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleProjectImageUpload(f, project.id); }}
                      />
                    </label>
                  </div>

                  {/* Fields */}
                  <div className="flex-1 space-y-3">
                    <input
                      type="text"
                      value={project.project_name}
                      onChange={(e) => updateProject(project.id, { project_name: e.target.value })}
                      className="w-full border border-black/20 px-3 py-2 font-mono text-sm font-bold focus:border-accent focus:outline-none"
                      placeholder="Project name"
                    />
                    <div className="flex gap-3">
                      <input
                        type="text"
                        value={project.project_type}
                        onChange={(e) => updateProject(project.id, { project_type: e.target.value })}
                        className="w-32 border border-black/20 px-3 py-2 font-mono text-xs focus:border-accent focus:outline-none"
                        placeholder="Type (Single, EP...)"
                      />
                      <input
                        type="url"
                        value={project.link || ''}
                        onChange={(e) => updateProject(project.id, { link: e.target.value })}
                        className="flex-1 border border-black/20 px-3 py-2 font-mono text-xs focus:border-accent focus:outline-none"
                        placeholder="Link (Spotify, Apple Music, etc.)"
                      />
                    </div>
                    <textarea
                      value={project.description}
                      onChange={(e) => updateProject(project.id, { description: e.target.value })}
                      rows={2}
                      className="w-full border border-black/20 px-3 py-2 font-mono text-xs focus:border-accent focus:outline-none resize-vertical"
                      placeholder="Description (optional)"
                    />
                    <div className="flex items-center justify-between">
                      <div className="flex gap-2">
                        <button
                          onClick={() => saveProject(project)}
                          className="font-mono text-[10px] font-bold uppercase tracking-wider bg-black text-white px-3 py-1.5 hover:bg-black/80 transition-colors"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => deleteProject(project.id)}
                          className="font-mono text-[10px] font-bold uppercase tracking-wider text-red-500 border border-red-300 px-3 py-1.5 hover:bg-red-50 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={project.is_public}
                          onChange={(e) => { updateProject(project.id, { is_public: e.target.checked }); }}
                          className="accent-accent"
                        />
                        <span className="font-mono text-[10px] text-black/40 uppercase tracking-wider">Public</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
