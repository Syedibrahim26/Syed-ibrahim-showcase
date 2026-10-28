import React, { useState, useEffect } from 'react';
import { X, Upload, Globe, Github, Sparkles, Layers, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { Project } from '../../types';
import { api } from '../../services/api';

interface ProjectModalProps {
  project: Project | null; // null means create mode
  isOpen: boolean;
  onClose: () => void;
  onSaved: (project: Project) => void;
}

const SAMPLE_PROJECT_IMAGES = [
  'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop&q=80'
];

export const ProjectModal: React.FC<ProjectModalProps> = ({ project, isOpen, onClose, onSaved }) => {
  const [title, setTitle] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [detailedDescription, setDetailedDescription] = useState('');
  const [techStackInput, setTechStackInput] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [liveDemoUrl, setLiveDemoUrl] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [isPublished, setIsPublished] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [displayOrder, setDisplayOrder] = useState(0);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');

  useEffect(() => {
    if (project) {
      setTitle(project.title || '');
      setShortDescription(project.short_description || '');
      setDetailedDescription(project.detailed_description || '');
      setTechStackInput(project.tech_stack ? project.tech_stack.join(', ') : '');
      setImageUrl(project.image_url || '');
      setLiveDemoUrl(project.live_demo_url || '');
      setGithubUrl(project.github_url || '');
      setIsPublished(project.is_published);
      setIsFeatured(project.is_featured);
      setDisplayOrder(project.display_order || 0);
    } else {
      setTitle('');
      setShortDescription('');
      setDetailedDescription('');
      setTechStackInput('React, TypeScript, Tailwind CSS');
      setImageUrl(SAMPLE_PROJECT_IMAGES[0]);
      setLiveDemoUrl('');
      setGithubUrl('');
      setIsPublished(true);
      setIsFeatured(false);
      setDisplayOrder(0);
    }
    setError(null);
  }, [project, isOpen]);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size < 5MB
    if (file.size > 5 * 1024 * 1024) {
      setError('Image file is too large (must be under 5MB).');
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64 = reader.result as string;
        const res = await api.upload.uploadImage(base64, file.name);
        setImageUrl(res.url);
      } catch (err: any) {
        setError('Failed to upload image: ' + err.message);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('Project title is required.');
      return;
    }
    if (!shortDescription.trim()) {
      setError('Short description is required.');
      return;
    }

    const techArray = techStackInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    setIsSubmitting(true);
    try {
      const payload: Partial<Project> = {
        title: title.trim(),
        short_description: shortDescription.trim(),
        detailed_description: detailedDescription.trim(),
        tech_stack: techArray,
        image_url: imageUrl.trim(),
        live_demo_url: liveDemoUrl.trim(),
        github_url: githubUrl.trim(),
        is_published: isPublished,
        is_featured: isFeatured,
        display_order: Number(displayOrder) || 0
      };

      if (project) {
        const res = await api.projects.update(project.id, payload);
        onSaved(res.project);
      } else {
        const res = await api.projects.create(payload);
        onSaved(res.project);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save project.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-zinc-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-zinc-200 overflow-hidden z-10 my-8 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 bg-zinc-50/70">
          <div>
            <h2 className="text-lg font-bold text-zinc-900">
              {project ? 'Edit Project' : 'Add New Project'}
            </h2>
            <p className="text-xs text-zinc-500">
              {project ? `Updating project ID #${project.id}` : 'Create a showcase project for your portfolio'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-5 flex-1">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Title & Short Description */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label htmlFor="project-title" className="block text-xs font-medium text-zinc-700 mb-1">
                Project Title <span className="text-red-500">*</span>
              </label>
              <input
                id="project-title"
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. AlgoCraft Visualizer"
                className="w-full px-3.5 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900"
              />
            </div>

            <div>
              <label htmlFor="project-order" className="block text-xs font-medium text-zinc-700 mb-1">
                Display Order
              </label>
              <input
                id="project-order"
                type="number"
                value={displayOrder}
                onChange={(e) => setDisplayOrder(parseInt(e.target.value, 10) || 0)}
                className="w-full px-3.5 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900"
              />
            </div>
          </div>

          <div>
            <label htmlFor="project-short-desc" className="block text-xs font-medium text-zinc-700 mb-1">
              Short Description (Summary for cards) <span className="text-red-500">*</span>
            </label>
            <textarea
              id="project-short-desc"
              rows={2}
              required
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              placeholder="A concise 1-2 sentence overview of the project's purpose and key achievement."
              className="w-full px-3.5 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900 resize-none"
            />
          </div>

          {/* Tech Stack */}
          <div>
            <label htmlFor="project-tech-stack" className="block text-xs font-medium text-zinc-700 mb-1">
              Tech Stack (Comma-separated)
            </label>
            <div className="relative">
              <Layers className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                id="project-tech-stack"
                type="text"
                value={techStackInput}
                onChange={(e) => setTechStackInput(e.target.value)}
                placeholder="React, TypeScript, Node.js, Express, Tailwind CSS"
                className="w-full pl-9 pr-3.5 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900"
              />
            </div>
            <div className="mt-1.5 flex flex-wrap gap-1">
              {techStackInput
                .split(',')
                .map((t) => t.trim())
                .filter(Boolean)
                .map((t, idx) => (
                  <span key={idx} className="px-2 py-0.5 rounded text-[11px] bg-zinc-100 text-zinc-700 border border-zinc-200">
                    {t}
                  </span>
                ))}
            </div>
          </div>

          {/* Image URL & Upload */}
          <div className="space-y-2">
            <label htmlFor="project-image-url" className="block text-xs font-medium text-zinc-700">
              Project Thumbnail / Cover Image
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <ImageIcon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  id="project-image-url"
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://... or /uploads/..."
                  className="w-full pl-9 pr-3.5 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900"
                />
              </div>

              {/* Upload button */}
              <label className="px-3.5 py-2 rounded-xl border border-zinc-200 bg-white text-zinc-700 text-xs font-medium hover:bg-zinc-50 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs">
                <Upload className="w-3.5 h-3.5" />
                <span>Upload</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp,image/avif,image/bmp"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
              {imageUrl && (
                <button
                  type="button"
                  onClick={() => setImageUrl('')}
                  className="px-3.5 py-2 rounded-xl border border-red-200 bg-white text-red-600 text-xs font-medium hover:bg-red-50 transition-colors"
                >
                  Remove
                </button>
              )}
            </div>

            {/* Quick preset images selector */}
            <div className="flex items-center gap-2 overflow-x-auto pt-1 pb-1">
              <span className="text-[11px] text-zinc-400 whitespace-nowrap">Sample presets:</span>
              {SAMPLE_PROJECT_IMAGES.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setImageUrl(img)}
                  className={`w-10 h-7 rounded-md overflow-hidden border flex-shrink-0 transition-transform ${
                    imageUrl === img ? 'ring-2 ring-zinc-900 scale-105' : 'border-zinc-200 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="Preset" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>

            {/* Preview */}
            {imageUrl && (
              <div className="mt-2 w-full h-36 rounded-xl overflow-hidden bg-zinc-100 border border-zinc-200">
                <img
                  src={imageUrl}
                  alt="Preview"
                  className="w-full h-full object-cover"
                  onError={() => setError('Image URL could not be loaded.')}
                />
              </div>
            )}
          </div>

          {/* Links: Live Demo & GitHub */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="project-demo-url" className="block text-xs font-medium text-zinc-700 mb-1">
                Live Demo URL
              </label>
              <div className="relative">
                <Globe className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  id="project-demo-url"
                  type="url"
                  value={liveDemoUrl}
                  onChange={(e) => setLiveDemoUrl(e.target.value)}
                  placeholder="https://my-app.vercel.app"
                  className="w-full pl-9 pr-3.5 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900"
                />
              </div>
            </div>

            <div>
              <label htmlFor="project-github-url" className="block text-xs font-medium text-zinc-700 mb-1">
                GitHub Repository URL
              </label>
              <div className="relative">
                <Github className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  id="project-github-url"
                  type="url"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  placeholder="https://github.com/username/repo"
                  className="w-full pl-9 pr-3.5 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900"
                />
              </div>
            </div>
          </div>

          {/* Detailed Markdown / Story */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="project-detailed-desc" className="block text-xs font-medium text-zinc-700">
                Detailed Description (Markdown / Formatted Story)
              </label>
              <div className="flex gap-1 text-[11px]">
                <button
                  type="button"
                  onClick={() => setActiveTab('edit')}
                  className={`px-2 py-0.5 rounded font-medium ${
                    activeTab === 'edit' ? 'bg-zinc-900 text-white' : 'text-zinc-500 hover:text-zinc-800'
                  }`}
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('preview')}
                  className={`px-2 py-0.5 rounded font-medium ${
                    activeTab === 'preview' ? 'bg-zinc-900 text-white' : 'text-zinc-500 hover:text-zinc-800'
                  }`}
                >
                  Preview
                </button>
              </div>
            </div>

            {activeTab === 'edit' ? (
              <textarea
                id="project-detailed-desc"
                rows={5}
                value={detailedDescription}
                onChange={(e) => setDetailedDescription(e.target.value)}
                placeholder="## Overview&#10;Write about the architecture, algorithms, challenges, and outcomes..."
                className="w-full px-3.5 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900 font-mono text-xs"
              />
            ) : (
              <div className="min-h-[120px] p-3 rounded-xl border border-zinc-200 bg-zinc-50 text-xs text-zinc-700 whitespace-pre-line leading-relaxed">
                {detailedDescription || 'No detailed description provided yet.'}
              </div>
            )}
          </div>

          {/* Visibility & Featured Toggles */}
          <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-zinc-900 block">Publish Status</span>
                <span className="text-[11px] text-zinc-500">
                  {isPublished ? 'Live on public portfolio' : 'Saved as private draft (hidden from public view)'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsPublished(!isPublished)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                  isPublished ? 'bg-emerald-600' : 'bg-zinc-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isPublished ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between border-t border-zinc-200/80 pt-3">
              <div>
                <span className="text-xs font-semibold text-zinc-900 block">Featured Project</span>
                <span className="text-[11px] text-zinc-500">Highlighted with a badge in public gallery</span>
              </div>
              <button
                type="button"
                onClick={() => setIsFeatured(!isFeatured)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                  isFeatured ? 'bg-amber-500' : 'bg-zinc-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isFeatured ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </form>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-zinc-100 bg-zinc-50 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/60 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-5 py-2 rounded-xl bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-800 disabled:opacity-50 transition-colors shadow-xs flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Saving...</span>
              </>
            ) : (
              <span>{project ? 'Update Project' : 'Publish Project'}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
