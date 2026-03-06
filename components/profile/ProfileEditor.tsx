'use client';

import { useState, useEffect } from 'react';
import { Save, ExternalLink, Upload } from 'lucide-react';

interface Profile {
  display_name: string;
  bio: string;
  profile_picture_url: string | null;
  social_links: Record<string, string>;
}

export default function ProfileEditor({ userId, profileSlug }: { userId: string; profileSlug: string }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Form state
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [profilePicUrl, setProfilePicUrl] = useState('');
  const [instagram, setInstagram] = useState('');
  const [twitter, setTwitter] = useState('');
  const [spotify, setSpotify] = useState('');
  const [soundcloud, setSoundcloud] = useState('');
  const [youtube, setYoutube] = useState('');

  useEffect(() => {
    fetch('/api/profile')
      .then((r) => r.json())
      .then((data) => {
        if (data.profile) {
          const p = data.profile;
          setProfile(p);
          setDisplayName(p.display_name || '');
          setBio(p.bio || '');
          setProfilePicUrl(p.profile_picture_url || '');
          const links = p.social_links || {};
          setInstagram(links.instagram || '');
          setTwitter(links.twitter || '');
          setSpotify(links.spotify || '');
          setSoundcloud(links.soundcloud || '');
          setYoutube(links.youtube || '');
        }
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    setSaved(false);

    const socialLinks: Record<string, string> = {};
    if (instagram) socialLinks.instagram = instagram;
    if (twitter) socialLinks.twitter = twitter;
    if (spotify) socialLinks.spotify = spotify;
    if (soundcloud) socialLinks.soundcloud = soundcloud;
    if (youtube) socialLinks.youtube = youtube;

    const res = await fetch('/api/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        display_name: displayName,
        bio,
        social_links: socialLinks,
      }),
    });

    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
    setSaving(false);
  }

  async function handlePhotoUpload(file: File) {
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch('/api/profile/photo', { method: 'POST', body: formData });
    const data = await res.json();
    if (data.url) {
      setProfilePicUrl(data.url);
    }
    setUploading(false);
  }

  if (loading) {
    return <p className="font-mono text-sm text-black/40">Loading profile...</p>;
  }

  return (
    <div className="space-y-8">
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
              {uploading ? 'Uploading...' : 'Upload Photo'}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handlePhotoUpload(file);
                }}
                disabled={uploading}
              />
            </label>
            <p className="font-mono text-[10px] text-black/30 mt-2">JPG or PNG, max 5MB</p>
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
          {[
            { label: 'Instagram', value: instagram, set: setInstagram, placeholder: 'https://instagram.com/...' },
            { label: 'Twitter / X', value: twitter, set: setTwitter, placeholder: 'https://x.com/...' },
            { label: 'Spotify', value: spotify, set: setSpotify, placeholder: 'https://open.spotify.com/artist/...' },
            { label: 'SoundCloud', value: soundcloud, set: setSoundcloud, placeholder: 'https://soundcloud.com/...' },
            { label: 'YouTube', value: youtube, set: setYoutube, placeholder: 'https://youtube.com/...' },
          ].map((field) => (
            <div key={field.label} className="flex items-center gap-3">
              <span className="font-mono text-xs text-black/50 w-24 flex-shrink-0">{field.label}</span>
              <input
                type="url"
                value={field.value}
                onChange={(e) => field.set(e.target.value)}
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

      {/* Save */}
      <button
        onClick={handleSave}
        disabled={saving || !displayName.trim()}
        className="w-full bg-accent text-black font-mono text-base font-bold uppercase tracking-wider py-4 hover:bg-accent/90 transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2"
      >
        <Save className="w-4 h-4" />
        {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Profile'}
      </button>
    </div>
  );
}
