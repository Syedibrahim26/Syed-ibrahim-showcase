import React from 'react';
import { Github, Linkedin, Twitter, Mail, Globe, ArrowDown, FileText, Sparkles, CheckCircle2 } from 'lucide-react';
import { Profile } from '../../types';
import { useTheme } from '../../context/ThemeContext';

interface HeroSectionProps {
  profile: Profile | null;
  onExploreClick: () => void;
  onContactClick: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ profile, onExploreClick, onContactClick }) => {
  const { theme, animationsEnabled } = useTheme();
  const name = profile?.name || 'Alex Rivera';
  const title = profile?.title || 'Senior CS Student & Full-Stack Engineer';
  const bio =
    profile?.bio ||
    'Computer Science undergraduate passionate about building high-performance web systems, distributed architectures, and intuitive developer tools. Experienced in modern JavaScript/TypeScript, cloud-native deployments, and database optimization.';
  const avatarUrl =
    profile?.avatar_url ||
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80';

  const isLight = theme.id === 'clean-vibrant';

  return (
    <section id="hero" className="relative pt-32 pb-16 md:pt-40 md:pb-24 overflow-hidden z-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-8 md:gap-12">
          {/* Avatar & Status Column with Animated Glowing Gradient Border */}
          <div className="flex-shrink-0 flex flex-col items-center">
            <div className="relative group">
              {/* Outer Radiant Glow */}
              <div
                className={`absolute -inset-1.5 rounded-3xl bg-gradient-to-r ${theme.accentGradient} opacity-60 blur-lg transition-all duration-700 group-hover:opacity-90 ${
                  animationsEnabled ? 'animate-gradient-flow' : ''
                }`}
              />

              {/* Animated Gradient Border Ring */}
              <div
                className={`relative p-1 rounded-3xl bg-gradient-to-tr ${theme.accentGradient} ${
                  animationsEnabled ? 'animate-gradient-flow' : ''
                } shadow-2xl transition-transform duration-300 group-hover:scale-[1.02]`}
              >
                <div className={`w-40 h-40 sm:w-48 sm:h-48 rounded-[26px] overflow-hidden ${isLight ? 'bg-zinc-100' : 'bg-zinc-900'} relative`}>
                  <img
                    src={avatarUrl}
                    alt={name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                </div>
              </div>

              {/* Active Badge */}
              <div
                className={`absolute -bottom-2 -right-2 px-3 py-1 rounded-full border shadow-lg flex items-center gap-1.5 text-[11px] font-semibold ${
                  isLight
                    ? 'bg-white/95 border-emerald-200 text-emerald-700'
                    : 'bg-zinc-900/95 border-emerald-500/40 text-emerald-400'
                } backdrop-blur-md`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping absolute" />
                <span className="w-2 h-2 rounded-full bg-emerald-500 relative" />
                <span>Available</span>
              </div>
            </div>

            {/* Quick Resume Link under avatar */}
            {profile?.resume_url && profile.resume_url !== '#' && (
              <a
                href={profile.resume_url}
                target="_blank"
                rel="noopener noreferrer"
                className={`mt-6 inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-xl transition-all border backdrop-blur-md shadow-xs ${
                  isLight
                    ? 'bg-white/80 hover:bg-white text-zinc-700 border-zinc-200'
                    : 'bg-white/10 hover:bg-white/20 text-zinc-200 border-white/15'
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-violet-400" />
                <span>View Resume</span>
              </a>
            )}
          </div>

          {/* Text Content Column */}
          <div className="flex-1 text-center md:text-left">
            {/* Status Pill with Animated Gradient Accent */}
            <div
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold mb-4 border backdrop-blur-md shadow-xs ${
                isLight
                  ? 'bg-white/80 border-violet-200 text-violet-900'
                  : 'bg-white/10 border-white/15 text-zinc-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin-slow" />
              <span>Seeking 2026 Full-Time & Internship Opportunities</span>
            </div>

            {/* Main Headline with Animated Gradient Flow */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
              <span className={isLight ? 'text-zinc-900' : 'text-white'}>Hi, I'm </span>
              <span
                className={`bg-gradient-to-r ${theme.accentGradient} bg-clip-text text-transparent ${
                  animationsEnabled ? 'animate-gradient-flow' : ''
                }`}
              >
                {name}
              </span>
            </h1>

            <p
              className={`mt-2.5 text-lg sm:text-xl font-semibold tracking-tight ${
                isLight ? 'text-zinc-700' : 'text-zinc-200'
              }`}
            >
              {title}
            </p>

            <p
              className={`mt-4 text-sm sm:text-base leading-relaxed max-w-2xl font-normal ${
                isLight ? 'text-zinc-600' : 'text-zinc-300'
              }`}
            >
              {bio}
            </p>

            {/* Social Links with glowing hover accents */}
            <div className="mt-6 flex flex-wrap items-center justify-center md:justify-start gap-2.5">
              {profile?.github_url && (
                <a
                  href={profile.github_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`p-2.5 rounded-xl border backdrop-blur-md transition-all shadow-xs hover:scale-110 active:scale-95 ${
                    isLight
                      ? 'bg-white/80 text-zinc-800 border-zinc-200 hover:border-violet-300'
                      : 'bg-white/10 text-zinc-200 border-white/15 hover:border-violet-400 hover:text-white hover:bg-white/20'
                  }`}
                  aria-label="GitHub Profile"
                  title="GitHub"
                >
                  <Github className="w-4 h-4" />
                </a>
              )}
              {profile?.linkedin_url && (
                <a
                  href={profile.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`p-2.5 rounded-xl border backdrop-blur-md transition-all shadow-xs hover:scale-110 active:scale-95 ${
                    isLight
                      ? 'bg-white/80 text-zinc-800 border-zinc-200 hover:border-cyan-300'
                      : 'bg-white/10 text-zinc-200 border-white/15 hover:border-cyan-400 hover:text-white hover:bg-white/20'
                  }`}
                  aria-label="LinkedIn Profile"
                  title="LinkedIn"
                >
                  <Linkedin className="w-4 h-4" />
                </a>
              )}
              {profile?.twitter_url && (
                <a
                  href={profile.twitter_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`p-2.5 rounded-xl border backdrop-blur-md transition-all shadow-xs hover:scale-110 active:scale-95 ${
                    isLight
                      ? 'bg-white/80 text-zinc-800 border-zinc-200 hover:border-sky-300'
                      : 'bg-white/10 text-zinc-200 border-white/15 hover:border-sky-400 hover:text-white hover:bg-white/20'
                  }`}
                  aria-label="Twitter / X Profile"
                  title="Twitter / X"
                >
                  <Twitter className="w-4 h-4" />
                </a>
              )}
              {profile?.website_url && (
                <a
                  href={profile.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`p-2.5 rounded-xl border backdrop-blur-md transition-all shadow-xs hover:scale-110 active:scale-95 ${
                    isLight
                      ? 'bg-white/80 text-zinc-800 border-zinc-200 hover:border-emerald-300'
                      : 'bg-white/10 text-zinc-200 border-white/15 hover:border-emerald-400 hover:text-white hover:bg-white/20'
                  }`}
                  aria-label="Personal Website"
                  title="Website"
                >
                  <Globe className="w-4 h-4" />
                </a>
              )}
              {profile?.email && (
                <a
                  href={`mailto:${profile.email}`}
                  className={`p-2.5 rounded-xl border backdrop-blur-md transition-all shadow-xs hover:scale-110 active:scale-95 ${
                    isLight
                      ? 'bg-white/80 text-zinc-800 border-zinc-200 hover:border-fuchsia-300'
                      : 'bg-white/10 text-zinc-200 border-white/15 hover:border-fuchsia-400 hover:text-white hover:bg-white/20'
                  }`}
                  aria-label="Email Alex"
                  title="Email"
                >
                  <Mail className="w-4 h-4" />
                </a>
              )}
            </div>

            {/* CTAs */}
            <div className="mt-8 flex flex-wrap items-center justify-center md:justify-start gap-3.5">
              <button
                onClick={onExploreClick}
                className={`px-6 py-3 rounded-xl font-bold text-sm text-white shadow-xl ${theme.glowColor} transition-all cursor-pointer bg-gradient-to-r ${theme.accentGradient} ${
                  animationsEnabled ? 'animate-gradient-flow' : ''
                } hover:scale-105 active:scale-95 flex items-center gap-2`}
              >
                <span>Explore Projects</span>
                <ArrowDown className="w-4 h-4" />
              </button>

              <button
                onClick={onContactClick}
                className={`px-5 py-3 rounded-xl font-semibold text-sm border backdrop-blur-md transition-all cursor-pointer shadow-xs hover:scale-105 active:scale-95 ${
                  isLight
                    ? 'bg-white/80 hover:bg-white text-zinc-800 border-zinc-300 hover:border-zinc-400'
                    : 'bg-white/10 hover:bg-white/20 text-white border-white/20 hover:border-white/30'
                }`}
              >
                Get in Touch
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
