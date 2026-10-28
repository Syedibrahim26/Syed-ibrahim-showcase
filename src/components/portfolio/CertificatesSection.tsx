import React from 'react';
import { Award, ExternalLink } from 'lucide-react';
import { Profile } from '../../types';
import { useTheme } from '../../context/ThemeContext';

interface CertificatesSectionProps {
  profile: Profile | null;
}

export const CertificatesSection: React.FC<CertificatesSectionProps> = ({ profile }) => {
  const { theme, animationsEnabled } = useTheme();
  const certificates = profile?.certificates || [];
  const isLight = theme.id === 'clean-vibrant';

  if (!certificates.length) return null;

  return (
    <section
      id="certificates"
      className={`relative py-16 md:py-20 z-10 border-t ${
        isLight ? 'bg-white/80 border-zinc-200/80' : 'bg-black/20 border-white/10'
      }`}
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="mb-8">
          <div className={`text-xs font-bold uppercase tracking-wider mb-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border ${
            isLight ? 'bg-violet-100/80 border-violet-200 text-violet-800' : 'bg-white/10 border-white/15 text-zinc-300'
          }`}>
            <Award className="w-3.5 h-3.5 text-amber-400" />
            <span>Achievements</span>
          </div>
          <h2 className={`text-3xl sm:text-4xl font-extrabold tracking-tight ${isLight ? 'text-zinc-900' : 'text-white'}`}>
            Certificates
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {certificates.map((certificate, index) => (
            <article
              key={`${certificate.title}-${index}`}
              className={`rounded-2xl border p-5 backdrop-blur-xl transition-transform hover:-translate-y-1 ${
                isLight ? 'bg-white border-zinc-200 shadow-sm' : 'bg-white/[0.05] border-white/10'
              } ${animationsEnabled ? 'animate-in fade-in' : ''}`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white bg-gradient-to-tr ${theme.accentGradient}`}>
                <Award className="w-5 h-5" />
              </div>
              <h3 className={`mt-4 font-bold text-base ${isLight ? 'text-zinc-900' : 'text-white'}`}>
                {certificate.title}
              </h3>
              {(certificate.issuer || certificate.year) && (
                <p className={`mt-1 text-xs ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
                  {[certificate.issuer, certificate.year].filter(Boolean).join(' • ')}
                </p>
              )}
              {certificate.description && (
                <p className={`mt-3 text-sm leading-relaxed ${isLight ? 'text-zinc-600' : 'text-zinc-300'}`}>
                  {certificate.description}
                </p>
              )}
              {certificate.credential_url && (
                <a
                  href={certificate.credential_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 mt-4 text-xs font-semibold text-violet-400 hover:underline"
                >
                  View certificate <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};
