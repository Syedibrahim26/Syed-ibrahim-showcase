import React, { useState, useEffect } from 'react';
import { User as UserIcon, Mail, Globe, Github, Linkedin, Twitter, FileText, Upload, Plus, X, CheckCircle2, AlertCircle, GraduationCap, Award, Trash2, ExternalLink } from 'lucide-react';
import { Certificate, EducationEntry, Profile } from '../../types';
import { api } from '../../services/api';

interface ProfileSettingsProps {
  profile: Profile | null;
  onProfileUpdated: (profile: Profile) => void;
}

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80'
];

const readFileAsDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') resolve(reader.result);
      else reject(new Error('Could not read the selected file.'));
    };
    reader.onerror = () => reject(new Error('Could not read the selected file.'));
    reader.readAsDataURL(file);
  });

export const ProfileSettings: React.FC<ProfileSettingsProps> = ({ profile, onProfileUpdated }) => {
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [email, setEmail] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [twitterUrl, setTwitterUrl] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [resumeUrl, setResumeUrl] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkillInput, setNewSkillInput] = useState('');
  const [education, setEducation] = useState<EducationEntry[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setTitle(profile.title || '');
      setBio(profile.bio || '');
      setAvatarUrl(profile.avatar_url || '');
      setEmail(profile.email || '');
      setGithubUrl(profile.github_url || '');
      setLinkedinUrl(profile.linkedin_url || '');
      setTwitterUrl(profile.twitter_url || '');
      setWebsiteUrl(profile.website_url || '');
      setResumeUrl(profile.resume_url || '');
      setSkills(profile.skills || []);
      setEducation(profile.education || []);
      setCertificates(profile.certificates || []);
    }
  }, [profile]);

  const handleAddSkill = (e: React.KeyboardEvent<HTMLInputElement> | React.MouseEvent<HTMLButtonElement>) => {
    if ('key' in e) {
      if (e.key !== 'Enter') return;
      e.preventDefault();
    }
    const trimmed = newSkillInput.trim();
    if (!trimmed) return;
    setSkills((current) => current.some((skill) => skill.toLowerCase() === trimmed.toLowerCase())
      ? current
      : [...current, trimmed]);
    setNewSkillInput('');
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills((current) => current.filter((skill) => skill !== skillToRemove));
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg('Image file must be under 10MB.');
      return;
    }

    try {
      setErrorMsg(null);
      const res = await api.upload.uploadImage(await readFileAsDataUrl(file), file.name);
      setAvatarUrl(res.url);
    } catch (err) {
      setErrorMsg('Failed to upload image: ' + (err instanceof Error ? err.message : 'Unknown error.'));
    }
  };

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (file.type !== 'application/pdf' || !file.name.toLowerCase().endsWith('.pdf')) {
      setErrorMsg('Choose a PDF file for your resume.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg('Resume PDF must be under 10MB.');
      return;
    }

    try {
      setErrorMsg(null);
      const res = await api.upload.uploadResume(await readFileAsDataUrl(file));
      setResumeUrl(res.url);
    } catch (err) {
      setErrorMsg('Failed to upload resume: ' + (err instanceof Error ? err.message : 'Unknown error.'));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!name.trim()) {
      setErrorMsg('Student name is required.');
      return;
    }
    if (!title.trim()) {
      setErrorMsg('Professional headline / title is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.profile.update({
        name: name.trim(),
        title: title.trim(),
        bio: bio.trim(),
        avatar_url: avatarUrl.trim(),
        email: email.trim(),
        github_url: githubUrl.trim(),
        linkedin_url: linkedinUrl.trim(),
        twitter_url: twitterUrl.trim(),
        website_url: websiteUrl.trim(),
        resume_url: resumeUrl.trim(),
        skills,
        education,
        certificates
      });

      setSuccessMsg('Student profile updated successfully!');
      onProfileUpdated(res.profile);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update student profile.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight">Student Profile Settings</h1>
        <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
          Update the personal bio, headline, avatar, social media links, and technical skills shown on your public portfolio.
        </p>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs sm:text-sm flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-zinc-200 p-6 sm:p-8 space-y-6 shadow-2xs">
        {/* Avatar Section */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 pb-6 border-b border-zinc-100">
          <div className="w-32 h-32 rounded-2xl bg-zinc-100 border-2 border-zinc-200 overflow-hidden flex-shrink-0 shadow-2xs">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-zinc-400">
                <UserIcon className="w-8 h-8" />
              </div>
            )}
          </div>

          <div className="flex-1 space-y-2">
            <label htmlFor="profile-avatar-url" className="block text-xs font-semibold text-zinc-700">
              Avatar Image URL or Upload
            </label>
            <div className="flex gap-2">
              <input
                id="profile-avatar-url"
                type="text"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://... or /uploads/..."
                className="flex-1 px-3 py-1.5 text-xs sm:text-sm bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900"
              />
              <label className="px-3 py-1.5 rounded-xl border border-zinc-200 bg-white text-zinc-700 text-xs font-medium hover:bg-zinc-50 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs">
                <Upload className="w-3.5 h-3.5" />
                <span>Upload</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp,image/avif,image/bmp"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </label>
              {avatarUrl && (
                <button
                  type="button"
                  onClick={() => setAvatarUrl('')}
                  className="px-3 py-1.5 rounded-xl border border-red-200 bg-white text-red-600 text-xs font-medium hover:bg-red-50 transition-colors"
                >
                  Remove
                </button>
              )}
            </div>

            {/* Presets */}
            <div className="flex items-center gap-2 pt-1">
              <span className="text-[11px] text-zinc-400">Quick avatars:</span>
              {PRESET_AVATARS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setAvatarUrl(preset)}
                  className={`w-7 h-7 rounded-full overflow-hidden border ${
                    avatarUrl === preset ? 'ring-2 ring-zinc-900' : 'border-zinc-200 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={preset} alt="Preset" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Basic Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="profile-name" className="block text-xs font-semibold text-zinc-700 mb-1">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              id="profile-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Alex Rivera"
              className="w-full px-3.5 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900"
            />
          </div>

          <div>
            <label htmlFor="profile-title" className="block text-xs font-semibold text-zinc-700 mb-1">
              Headline / Title <span className="text-red-500">*</span>
            </label>
            <input
              id="profile-title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Senior CS Student & Full-Stack Engineer"
              className="w-full px-3.5 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900"
            />
          </div>
        </div>

        {/* Bio */}
        <div>
          <label htmlFor="profile-bio" className="block text-xs font-semibold text-zinc-700 mb-1">
            About / Bio
          </label>
          <textarea
            id="profile-bio"
            rows={4}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell your story, academic achievements, research, or interests..."
            className="w-full px-3.5 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900 resize-none leading-relaxed"
          />
        </div>

        <section className="space-y-4 border-t border-zinc-100 pt-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                <GraduationCap className="w-4 h-4" /> Education & Journey
              </h3>
              <p className="text-xs text-zinc-500 mt-1">Edit the education cards shown on your portfolio.</p>
            </div>
            <button
              type="button"
              onClick={() => setEducation((current) => [...current, { degree: '', institution: '', period: '', details: '' }])}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-semibold"
            >
              <Plus className="w-3.5 h-3.5" /> Add Education
            </button>
          </div>
          {education.map((entry, index) => (
            <article key={index} className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input aria-label="Degree or qualification" value={entry.degree} onChange={(e) => setEducation((items) => items.map((item, i) => i === index ? { ...item, degree: e.target.value } : item))} placeholder="Degree or qualification" className="w-full px-3 py-2 text-sm bg-white border border-zinc-200 rounded-lg" />
                <input aria-label="School or institution" value={entry.institution} onChange={(e) => setEducation((items) => items.map((item, i) => i === index ? { ...item, institution: e.target.value } : item))} placeholder="School or institution" className="w-full px-3 py-2 text-sm bg-white border border-zinc-200 rounded-lg" />
                <input aria-label="Period or graduation date" value={entry.period} onChange={(e) => setEducation((items) => items.map((item, i) => i === index ? { ...item, period: e.target.value } : item))} placeholder="Period or graduation date" className="w-full px-3 py-2 text-sm bg-white border border-zinc-200 rounded-lg" />
                <input aria-label="Achievement or detail" value={entry.details} onChange={(e) => setEducation((items) => items.map((item, i) => i === index ? { ...item, details: e.target.value } : item))} placeholder="Achievement or detail" className="w-full px-3 py-2 text-sm bg-white border border-zinc-200 rounded-lg" />
              </div>
              <button type="button" onClick={() => setEducation((items) => items.filter((_, i) => i !== index))} className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-700">
                <Trash2 className="w-3.5 h-3.5" /> Remove education
              </button>
            </article>
          ))}
        </section>

        {/* Skills Tag Manager */}
        <div>
          <label htmlFor="profile-new-skill" className="block text-xs font-semibold text-zinc-700 mb-1">
            Technical Skills & Tools
          </label>
          <div className="flex gap-2 mb-2">
            <input
              id="profile-new-skill"
              type="text"
              value={newSkillInput}
              onChange={(e) => setNewSkillInput(e.target.value)}
              onKeyDown={handleAddSkill}
              placeholder="Type a skill and press Enter or Add Skill"
              className="flex-1 px-3.5 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900"
            />
            <button
              type="button"
              onClick={handleAddSkill}
              className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            >
              Add Skill
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5 p-3 rounded-xl bg-zinc-50 border border-zinc-200 min-h-[44px]">
            {skills.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-white text-zinc-800 border border-zinc-200 shadow-2xs"
              >
                <span>{skill}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveSkill(skill)}
                  className="text-zinc-400 hover:text-red-500 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>

        <section className="space-y-4 border-t border-zinc-100 pt-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                <Award className="w-4 h-4" /> Certificates
              </h3>
              <p className="text-xs text-zinc-500 mt-1">Add, edit, or remove certificates shown on your portfolio.</p>
            </div>
            <button
              type="button"
              onClick={() => setCertificates((current) => [...current, { title: '', issuer: '', year: '', description: '', credential_url: '' }])}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-semibold"
            >
              <Plus className="w-3.5 h-3.5" /> Add Certificate
            </button>
          </div>
          {certificates.map((certificate, index) => (
            <article key={index} className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input aria-label="Certificate title" value={certificate.title} onChange={(e) => setCertificates((items) => items.map((item, i) => i === index ? { ...item, title: e.target.value } : item))} placeholder="Certificate title" className="w-full px-3 py-2 text-sm bg-white border border-zinc-200 rounded-lg" />
                <input aria-label="Issuing organization" value={certificate.issuer} onChange={(e) => setCertificates((items) => items.map((item, i) => i === index ? { ...item, issuer: e.target.value } : item))} placeholder="Issuing organization" className="w-full px-3 py-2 text-sm bg-white border border-zinc-200 rounded-lg" />
                <input aria-label="Certificate year" value={certificate.year} onChange={(e) => setCertificates((items) => items.map((item, i) => i === index ? { ...item, year: e.target.value } : item))} placeholder="Year" className="w-full px-3 py-2 text-sm bg-white border border-zinc-200 rounded-lg" />
                <input aria-label="Certificate verification URL" type="url" value={certificate.credential_url} onChange={(e) => setCertificates((items) => items.map((item, i) => i === index ? { ...item, credential_url: e.target.value } : item))} placeholder="Certificate URL (optional)" className="w-full px-3 py-2 text-sm bg-white border border-zinc-200 rounded-lg" />
                <textarea aria-label="Certificate description" rows={2} value={certificate.description} onChange={(e) => setCertificates((items) => items.map((item, i) => i === index ? { ...item, description: e.target.value } : item))} placeholder="Description (optional)" className="sm:col-span-2 w-full px-3 py-2 text-sm bg-white border border-zinc-200 rounded-lg resize-y" />
              </div>
              <button type="button" onClick={() => setCertificates((items) => items.filter((_, i) => i !== index))} className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-700">
                <Trash2 className="w-3.5 h-3.5" /> Remove certificate
              </button>
            </article>
          ))}
        </section>

        {/* Social Links & Resume */}
        <div className="pt-4 border-t border-zinc-100 space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Social Links & Contact Info</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="profile-email" className="block text-xs font-medium text-zinc-700 mb-1">
                Public Contact Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  id="profile-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@university.edu"
                  className="w-full pl-9 pr-3.5 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900"
                />
              </div>
            </div>

            <div>
              <label htmlFor="profile-resume" className="block text-xs font-medium text-zinc-700 mb-1">
                Resume PDF
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <FileText className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    id="profile-resume"
                    type="text"
                    value={resumeUrl}
                    onChange={(e) => setResumeUrl(e.target.value)}
                    placeholder="Upload a PDF or paste a resume URL"
                    className="w-full pl-9 pr-3.5 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900"
                  />
                </div>
                <label className="px-3 py-2 rounded-xl border border-zinc-200 bg-white text-zinc-700 text-xs font-medium hover:bg-zinc-50 transition-colors flex items-center gap-1.5 cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload PDF</span>
                  <input type="file" accept="application/pdf,.pdf" onChange={handleResumeUpload} className="hidden" />
                </label>
                {resumeUrl && (
                  <>
                    <a href={resumeUrl} target="_blank" rel="noopener noreferrer" aria-label="Preview resume" className="px-3 py-2 rounded-xl border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                    <button type="button" onClick={() => setResumeUrl('')} className="px-3 py-2 rounded-xl border border-red-200 bg-white text-red-600 hover:bg-red-50" aria-label="Remove resume">
                      <X className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
              <p className="mt-1 text-[11px] text-zinc-500">PDF only, up to 10MB. Visitors can open it with the View Resume button.</p>
            </div>

            <div>
              <label htmlFor="profile-github" className="block text-xs font-medium text-zinc-700 mb-1">
                GitHub URL
              </label>
              <div className="relative">
                <Github className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  id="profile-github"
                  type="url"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  placeholder="https://github.com/username"
                  className="w-full pl-9 pr-3.5 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900"
                />
              </div>
            </div>

            <div>
              <label htmlFor="profile-linkedin" className="block text-xs font-medium text-zinc-700 mb-1">
                LinkedIn URL
              </label>
              <div className="relative">
                <Linkedin className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  id="profile-linkedin"
                  type="url"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  placeholder="https://linkedin.com/in/username"
                  className="w-full pl-9 pr-3.5 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900"
                />
              </div>
            </div>

            <div>
              <label htmlFor="profile-twitter" className="block text-xs font-medium text-zinc-700 mb-1">
                Twitter / X URL
              </label>
              <div className="relative">
                <Twitter className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  id="profile-twitter"
                  type="url"
                  value={twitterUrl}
                  onChange={(e) => setTwitterUrl(e.target.value)}
                  placeholder="https://twitter.com/username"
                  className="w-full pl-9 pr-3.5 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900"
                />
              </div>
            </div>

            <div>
              <label htmlFor="profile-website" className="block text-xs font-medium text-zinc-700 mb-1">
                Personal Website / Domain
              </label>
              <div className="relative">
                <Globe className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  id="profile-website"
                  type="url"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="https://alexrivera.dev"
                  className="w-full pl-9 pr-3.5 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-4 border-t border-zinc-100 flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-zinc-900 text-white rounded-xl text-sm font-semibold hover:bg-zinc-800 disabled:opacity-50 transition-colors shadow-xs flex items-center gap-2 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Saving Changes...</span>
              </>
            ) : (
              <span>Save Profile</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
