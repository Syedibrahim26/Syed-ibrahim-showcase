import React, { useState } from 'react';
import { Mail, Send, CheckCircle2, AlertCircle, MessageSquare, MapPin, Clock, Sparkles, Phone } from 'lucide-react';
import { Profile } from '../../types';
import { api } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';

interface ContactSectionProps {
  profile: Profile | null;
}

export const ContactSection: React.FC<ContactSectionProps> = ({ profile }) => {
  const { theme, animationsEnabled } = useTheme();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isLight = theme.id === 'clean-vibrant';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      setErrorMessage('Please fill in your name, email, and message.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.messages.submit(formData);
      setSubmitted(true);
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to send message. Please try again or reach out directly.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section
      id="contact"
      className={`relative py-20 md:py-28 z-10 transition-colors border-t ${
        isLight
          ? 'bg-zinc-100/70 border-zinc-200/80'
          : 'bg-black/25 backdrop-blur-md border-white/10'
      }`}
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
          {/* Left Column: Contact info */}
          <div className="md:col-span-5 space-y-6">
            <div>
              <div
                className={`text-xs font-bold uppercase tracking-wider mb-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border ${
                  isLight
                    ? 'bg-violet-100/80 border-violet-200 text-violet-800'
                    : 'bg-white/10 border-white/15 text-zinc-300'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Get In Touch</span>
              </div>
              <h2
                className={`text-3xl sm:text-4xl font-extrabold tracking-tight ${
                  isLight ? 'text-zinc-900' : 'text-white'
                }`}
              >
                Let's Build Together
              </h2>
              <p
                className={`mt-3 text-sm sm:text-base leading-relaxed ${
                  isLight ? 'text-zinc-600' : 'text-zinc-300'
                }`}
              >
                Whether you have an internship opening, full-time role, collaborative project, or simply want to connect, feel free to send a message!
              </p>
            </div>

            <div className="space-y-4 pt-2">
              <div
                className={`flex items-center gap-3.5 p-3 rounded-2xl border backdrop-blur-md transition-all hover:scale-[1.02] ${
                  isLight
                    ? 'bg-white/80 border-zinc-200 text-zinc-700'
                    : 'bg-white/[0.04] border-white/10 text-zinc-200'
                }`}
              >
                <div
                  className={`p-2.5 rounded-xl text-white shadow-md bg-gradient-to-r ${theme.accentGradient}`}
                >
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <div className={`text-xs font-semibold ${isLight ? 'text-zinc-400' : 'text-zinc-400'}`}>
                    Direct Email
                  </div>
                  <a
                    href={`mailto:${profile?.email || 'alex.rivera@university.edu'}`}
                    className={`font-semibold text-sm hover:underline ${
                      isLight ? 'text-zinc-900' : 'text-white'
                    }`}
                  >
                    {profile?.email || 'alex.rivera@university.edu'}
                  </a>
                </div>
              </div>

              <div
                className={`flex items-center gap-3.5 p-3 rounded-2xl border backdrop-blur-md transition-all hover:scale-[1.02] ${
                  isLight
                    ? 'bg-white/80 border-zinc-200 text-zinc-700'
                    : 'bg-white/[0.04] border-white/10 text-zinc-200'
                }`}
              >
                <div
                  className={`p-2.5 rounded-xl text-white shadow-md bg-gradient-to-r ${theme.accentGradient}`}
                >
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <div className={`text-xs font-semibold ${isLight ? 'text-zinc-400' : 'text-zinc-400'}`}>
                    Location
                  </div>
                  <div className={`font-semibold text-sm ${isLight ? 'text-zinc-900' : 'text-white'}`}>
                    Tamil Nadu,India • Open to Remote
                  </div>
                </div>
              </div>

              <div
                className={`flex items-center gap-3.5 p-3 rounded-2xl border backdrop-blur-md transition-all hover:scale-[1.02] ${
                  isLight
                    ? 'bg-white/80 border-zinc-200 text-zinc-700'
                    : 'bg-white/[0.04] border-white/10 text-zinc-200'
                }`}
              >
                <div
                  className={`p-2.5 rounded-xl text-white shadow-md bg-gradient-to-r ${theme.accentGradient}`}
                >
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <div className={`text-xs font-semibold ${isLight ? 'text-zinc-400' : 'text-zinc-400'}`}>
                    Response Time
                  </div>
                  <div className={`font-semibold text-sm ${isLight ? 'text-zinc-900' : 'text-white'}`}>
                    Typically replies within 24 hours
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Contact Form */}
          <div className="md:col-span-7">
            <div
              className={`rounded-3xl p-6 sm:p-8 border shadow-xl backdrop-blur-2xl ${
                isLight
                  ? 'bg-white/95 border-zinc-200/90'
                  : 'bg-zinc-950/70 border-white/15'
              }`}
            >
              {submitted ? (
                <div className="text-center py-8 space-y-4 animate-in fade-in">
                  <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto shadow-lg">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3
                    className={`text-xl font-extrabold ${isLight ? 'text-zinc-900' : 'text-white'}`}
                  >
                    Message Sent Successfully!
                  </h3>
                  <p
                    className={`text-sm max-w-sm mx-auto leading-relaxed ${
                      isLight ? 'text-zinc-600' : 'text-zinc-300'
                    }`}
                  >
                    Thank you for reaching out. Your message has been delivered to the portfolio inbox and email.
                  </p>
                  <button
                    onClick={() => setSubmitted(false)}
                    className={`mt-4 px-6 py-2.5 text-xs font-bold text-white rounded-xl shadow-md transition-all cursor-pointer bg-gradient-to-r ${theme.accentGradient} hover:scale-105`}
                  >
                    Send Another Note
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div
                    className={`text-base font-bold mb-3 flex items-center gap-2 ${
                      isLight ? 'text-zinc-900' : 'text-white'
                    }`}
                  >
                    <MessageSquare className="w-4 h-4 text-violet-400" />
                    <span>Send a Direct Message</span>
                  </div>

                  {errorMessage && (
                    <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="contact-name"
                        className={`block text-xs font-semibold mb-1.5 ${
                          isLight ? 'text-zinc-700' : 'text-zinc-300'
                        }`}
                      >
                        Your Name <span className="text-pink-500">*</span>
                      </label>
                      <input
                        id="contact-name"
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Your Name"
                        className={`w-full px-3.5 py-2.5 text-sm rounded-xl border focus:outline-none transition-all shadow-xs backdrop-blur-md ${
                          isLight
                            ? 'bg-white border-zinc-300 text-zinc-900 placeholder:text-zinc-400 focus:ring-2 focus:ring-violet-500'
                            : 'bg-white/10 border-white/15 text-white placeholder:text-zinc-500 focus:ring-2 focus:ring-violet-400 focus:border-transparent'
                        }`}
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="contact-email"
                        className={`block text-xs font-semibold mb-1.5 ${
                          isLight ? 'text-zinc-700' : 'text-zinc-300'
                        }`}
                      >
                        Your Email <span className="text-pink-500">*</span>
                      </label>
                      <input
                        id="contact-email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="yourmail@example.com"
                        className={`w-full px-3.5 py-2.5 text-sm rounded-xl border focus:outline-none transition-all shadow-xs backdrop-blur-md ${
                          isLight
                            ? 'bg-white border-zinc-300 text-zinc-900 placeholder:text-zinc-400 focus:ring-2 focus:ring-violet-500'
                            : 'bg-white/10 border-white/15 text-white placeholder:text-zinc-500 focus:ring-2 focus:ring-violet-400 focus:border-transparent'
                        }`}
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="contact-phone"
                      className={`block text-xs font-semibold mb-1.5 ${
                        isLight ? 'text-zinc-700' : 'text-zinc-300'
                      }`}
                    >
                      Phone (optional)
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                      <input
                        id="contact-phone"
                        type="tel"
                        maxLength={40}
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="Your phone number"
                        className={`w-full pl-9 pr-3.5 py-2.5 text-sm rounded-xl border focus:outline-none transition-all shadow-xs backdrop-blur-md ${
                          isLight
                            ? 'bg-white border-zinc-300 text-zinc-900 placeholder:text-zinc-400 focus:ring-2 focus:ring-violet-500'
                            : 'bg-white/10 border-white/15 text-white placeholder:text-zinc-500 focus:ring-2 focus:ring-violet-400 focus:border-transparent'
                        }`}
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="contact-subject"
                      className={`block text-xs font-semibold mb-1.5 ${
                        isLight ? 'text-zinc-700' : 'text-zinc-300'
                      }`}
                    >
                      Subject
                    </label>
                    <input
                      id="contact-subject"
                      type="text"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      placeholder="Opportunity / Collaboration Inquiry"
                      className={`w-full px-3.5 py-2.5 text-sm rounded-xl border focus:outline-none transition-all shadow-xs backdrop-blur-md ${
                        isLight
                          ? 'bg-white border-zinc-300 text-zinc-900 placeholder:text-zinc-400 focus:ring-2 focus:ring-violet-500'
                          : 'bg-white/10 border-white/15 text-white placeholder:text-zinc-500 focus:ring-2 focus:ring-violet-400 focus:border-transparent'
                      }`}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="contact-message"
                      className={`block text-xs font-semibold mb-1.5 ${
                        isLight ? 'text-zinc-700' : 'text-zinc-300'
                      }`}
                    >
                      Message <span className="text-pink-500">*</span>
                    </label>
                    <textarea
                      id="contact-message"
                      rows={4}
                      required
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Hello Syed, I came across your portfolio and wanted to discuss..."
                      className={`w-full px-3.5 py-2.5 text-sm rounded-xl border focus:outline-none transition-all shadow-xs backdrop-blur-md resize-none ${
                        isLight
                          ? 'bg-white border-zinc-300 text-zinc-900 placeholder:text-zinc-400 focus:ring-2 focus:ring-violet-500'
                          : 'bg-white/10 border-white/15 text-white placeholder:text-zinc-500 focus:ring-2 focus:ring-violet-400 focus:border-transparent'
                      }`}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full py-3 px-4 rounded-xl text-sm font-bold text-white shadow-xl ${
                      theme.glowColor
                    } transition-all cursor-pointer bg-gradient-to-r ${theme.accentGradient} ${
                      animationsEnabled ? 'animate-gradient-flow' : ''
                    } hover:scale-[1.02] active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2`}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Sending Message...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Send Message</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
