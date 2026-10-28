import React from 'react';
import { GraduationCap, Cpu, Sparkles, CheckCircle2 } from 'lucide-react';
import { Profile } from '../../types';
import { useTheme } from '../../context/ThemeContext';

interface AboutSkillsSectionProps {
  profile: Profile | null;
}

export const AboutSkillsSection: React.FC<AboutSkillsSectionProps> = ({ profile }) => {
  const { theme, animationsEnabled } = useTheme();
  const skills = profile?.skills || [
    'TypeScript',
    'React',
    'Node.js',
    'Express',
    'Tailwind CSS',
    'PostgreSQL',
    'SQLite',
    'Python',
    'Git',
    'REST APIs'
  ];

  const isLight = theme.id === 'clean-vibrant';

  return (
    <section
      id="about"
      className={`relative py-20 md:py-28 z-10 transition-colors ${
        isLight ? 'bg-white/80' : 'bg-transparent'
      }`}
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-start">
          {/* Left Column: Background & Academics */}
          <div className="md:col-span-6 space-y-6">
            <div>
              <div
                className={`text-xs font-bold uppercase tracking-wider mb-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border ${
                  isLight
                    ? 'bg-violet-100/80 border-violet-200 text-violet-800'
                    : 'bg-white/10 border-white/15 text-zinc-300'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Background</span>
              </div>
              <h2
                className={`text-3xl sm:text-4xl font-extrabold tracking-tight ${
                  isLight ? 'text-zinc-900' : 'text-white'
                }`}
              >
                Education & Journey
              </h2>
            </div>

            <p
              className={`text-sm sm:text-base leading-relaxed ${
                isLight ? 'text-zinc-600' : 'text-zinc-300'
              }`}
            >
              I am a dedicated Computer Science student committed to continuous learning and building reliable, user-centric software. My projects range from client-side visualizers to distributed backends with robust database architectures.
            </p>

            {(profile?.education || []).map((entry, index) => (
              <div
                key={`${entry.degree}-${index}`}
                className={`relative p-[1.5px] rounded-2xl bg-gradient-to-tr ${theme.accentGradient} ${
                  animationsEnabled ? 'animate-gradient-flow' : ''
                } shadow-lg`}
              >
                <div className={`p-5 rounded-[15px] backdrop-blur-xl ${isLight ? 'bg-white/95' : 'bg-zinc-950/90'}`}>
                  <div className="flex items-start gap-3.5">
                    <div className={`p-2.5 rounded-xl text-white shadow-md bg-gradient-to-tr ${theme.accentGradient}`}>
                      <GraduationCap className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className={`font-bold text-base leading-snug ${isLight ? 'text-zinc-900' : 'text-white'}`}>
                        {entry.degree}
                      </h3>
                      {entry.institution && (
                        <div className={`text-xs mt-0.5 ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
                          {entry.institution}
                        </div>
                      )}
                      {(entry.period || entry.details) && (
                        <div className="text-xs font-semibold text-emerald-400 mt-2 inline-flex items-center gap-1.5 flex-wrap">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {entry.period && <span>{entry.period}</span>}
                          {entry.period && entry.details && <span>•</span>}
                          {entry.details && <span>{entry.details}</span>}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Focus areas */}
            <div className="space-y-2.5 pt-2">
              <div
                className={`text-xs font-bold uppercase tracking-wider ${
                  isLight ? 'text-zinc-500' : 'text-zinc-400'
                }`}
              >
                Core Competencies
              </div>
              <div className="grid grid-cols-2 gap-2.5 text-xs font-semibold">
                <div
                  className={`flex items-center gap-2 p-2.5 rounded-xl border backdrop-blur-md ${
                    isLight
                      ? 'bg-zinc-50 border-zinc-200 text-zinc-800'
                      : 'bg-white/[0.04] border-white/10 text-zinc-200'
                  }`}
                >
                  <div className="w-2 h-2 rounded-full bg-violet-400 animate-pulse"></div>
                  Full-Stack Web Application
                </div>
                <div
                  className={`flex items-center gap-2 p-2.5 rounded-xl border backdrop-blur-md ${
                    isLight
                      ? 'bg-zinc-50 border-zinc-200 text-zinc-800'
                      : 'bg-white/[0.04] border-white/10 text-zinc-200'
                  }`}
                >
                  <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></div>
                  Algorithms & Complexity
                </div>
                <div
                  className={`flex items-center gap-2 p-2.5 rounded-xl border backdrop-blur-md ${
                    isLight
                      ? 'bg-zinc-50 border-zinc-200 text-zinc-800'
                      : 'bg-white/[0.04] border-white/10 text-zinc-200'
                  }`}
                >
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                  Relational & Document DBs
                </div>
                <div
                  className={`flex items-center gap-2 p-2.5 rounded-xl border backdrop-blur-md ${
                    isLight
                      ? 'bg-zinc-50 border-zinc-200 text-zinc-800'
                      : 'bg-white/[0.04] border-white/10 text-zinc-200'
                  }`}
                >
                  <div className="w-2 h-2 rounded-full bg-pink-400 animate-pulse"></div>
                  REST & Cloud APIs
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Skills Pills / Interactive Grid */}
          <div id="skills" className="md:col-span-6 space-y-6">
            <div>
              <div
                className={`text-xs font-bold uppercase tracking-wider mb-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border ${
                  isLight
                    ? 'bg-violet-100/80 border-violet-200 text-violet-800'
                    : 'bg-white/10 border-white/15 text-zinc-300'
                }`}
              >
                <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                <span>Toolbox</span>
              </div>
              <h3
                className={`text-3xl sm:text-4xl font-extrabold tracking-tight ${
                  isLight ? 'text-zinc-900' : 'text-white'
                }`}
              >
                Skills & Technologies
              </h3>
            </div>

            <p
              className={`text-sm sm:text-base leading-relaxed ${
                isLight ? 'text-zinc-600' : 'text-zinc-300'
              }`}
            >
              Technologies and frameworks I actively use to engineer applications from concept to deployment:
            </p>

            <div className="flex flex-wrap gap-2.5 pt-2">
              {skills.map((skill, index) => (
                <div
                  key={index}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold border backdrop-blur-md transition-all duration-200 shadow-xs flex items-center gap-2 group hover:scale-105 hover:-translate-y-0.5 cursor-default ${
                    isLight
                      ? 'bg-white/90 border-zinc-200 text-zinc-800 hover:border-violet-400 hover:shadow-md'
                      : 'bg-white/[0.06] border-white/10 text-zinc-100 hover:border-violet-400/80 hover:bg-white/10 hover:shadow-lg'
                  }`}
                >
                  <div
                    className={`w-2 h-2 rounded-full bg-gradient-to-r ${theme.accentGradient} group-hover:scale-125 transition-transform`}
                  />
                  <span>{skill}</span>
                </div>
              ))}
            </div>

            <div className="space-y-2 pt-2">
              <div className={`text-xs font-bold uppercase tracking-wider ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
                Key Strengths
              </div>
              <p className={`text-sm leading-relaxed ${isLight ? 'text-zinc-700' : 'text-zinc-300'}`}>
                Strong Communication <span className="text-violet-400">•</span> Quick Learner <span className="text-violet-400">•</span> Problem Solving <span className="text-violet-400">•</span> Team Collaboration <span className="text-violet-400">•</span> Self-Motivated <span className="text-violet-400">•</span> Adaptability
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
