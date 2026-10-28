import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { AnimatedBackground } from './components/theme/AnimatedBackground';
import { Navbar } from './components/portfolio/Navbar';
import { HeroSection } from './components/portfolio/HeroSection';
import { ProjectsGallery } from './components/portfolio/ProjectsGallery';
import { AboutSkillsSection } from './components/portfolio/AboutSkillsSection';
import { CertificatesSection } from './components/portfolio/CertificatesSection';
import { ContactSection } from './components/portfolio/ContactSection';
import { Footer } from './components/portfolio/Footer';
import { LoginPage } from './components/auth/LoginPage';
import { AdminLayout } from './components/admin/AdminLayout';
import { Profile, Project } from './types';
import { api } from './services/api';

type AppView = 'portfolio' | 'login' | 'admin';

function MainApp() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { theme } = useTheme();
  const [currentView, setCurrentView] = useState<AppView>('portfolio');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(true);

  // Sync with browser URL / hash
  useEffect(() => {
    const handleLocation = () => {
      const path = window.location.pathname;
      const hash = window.location.hash;

      if (path.startsWith('/admin') || hash === '#admin') {
        setCurrentView('admin');
      } else if (path.startsWith('/login') || hash === '#login') {
        setCurrentView('login');
      } else {
        setCurrentView('portfolio');
      }
    };

    handleLocation();
    window.addEventListener('popstate', handleLocation);
    window.addEventListener('hashchange', handleLocation);
    return () => {
      window.removeEventListener('popstate', handleLocation);
      window.removeEventListener('hashchange', handleLocation);
    };
  }, []);

  // Protected route enforcement
  useEffect(() => {
    if (!authLoading) {
      if (currentView === 'admin' && !isAuthenticated) {
        // Redirect unauthorized users to /login
        setCurrentView('login');
        window.history.replaceState(null, '', '/login');
      }
    }
  }, [currentView, isAuthenticated, authLoading]);

  // Load public portfolio data
  const loadPortfolioData = useCallback(async () => {
    setIsLoadingData(true);
    try {
      const [profileData, projectsData] = await Promise.all([
        api.profile.get().catch(() => null),
        api.projects.getPublished().catch(() => [])
      ]);

      setProfile(profileData);
      setProjects(projectsData);
    } catch (err) {
      console.error('Error fetching public portfolio data:', err);
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  useEffect(() => {
    loadPortfolioData();
  }, [loadPortfolioData]);

  const navigateTo = (view: AppView) => {
    setCurrentView(view);
    const path = view === 'portfolio' ? '/' : `/${view}`;
    window.history.pushState(null, '', path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // If loading auth state on initial mount, display a minimal loading spinner
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs text-zinc-500 font-medium">Initializing portfolio...</span>
        </div>
      </div>
    );
  }

  // Admin View (Protected)
  if (currentView === 'admin') {
    if (!isAuthenticated) {
      return (
        <div className={`relative min-h-screen ${theme.bodyBg}`}>
          <AnimatedBackground />
          <LoginPage
            onSuccess={() => navigateTo('admin')}
            onBackToPortfolio={() => navigateTo('portfolio')}
          />
        </div>
      );
    }

    return (
      <div className={`relative min-h-screen ${theme.bodyBg}`}>
        <AnimatedBackground />
        <AdminLayout
          onNavigateToPortfolio={() => {
            loadPortfolioData();
            navigateTo('portfolio');
          }}
        />
      </div>
    );
  }

  // Login View
  if (currentView === 'login') {
    return (
      <div className={`relative min-h-screen ${theme.bodyBg}`}>
        <AnimatedBackground />
        <LoginPage
          onSuccess={() => navigateTo('admin')}
          onBackToPortfolio={() => navigateTo('portfolio')}
        />
      </div>
    );
  }

  // Public Portfolio View
  return (
    <div
      className={`relative min-h-screen ${theme.bodyBg} ${theme.textPrimary} flex flex-col transition-colors duration-500 selection:bg-pink-500 selection:text-white`}
    >
      <AnimatedBackground />

      <Navbar
        profile={profile}
        onNavigate={navigateTo}
        currentView={currentView}
      />

      <main className="flex-1 z-10">
        <HeroSection
          profile={profile}
          onExploreClick={() => {
            const el = document.getElementById('projects');
            el?.scrollIntoView({ behavior: 'smooth' });
          }}
          onContactClick={() => {
            const el = document.getElementById('contact');
            el?.scrollIntoView({ behavior: 'smooth' });
          }}
        />

        <ProjectsGallery
          projects={projects}
          isLoading={isLoadingData}
        />

        <AboutSkillsSection
          profile={profile}
        />

        <CertificatesSection profile={profile} />

        <ContactSection
          profile={profile}
        />
      </main>

      <Footer
        profile={profile}
        onNavigate={navigateTo}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </ThemeProvider>
  );
}
