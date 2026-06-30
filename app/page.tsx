'use client';

import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import Link from 'next/link';

// Definisi tipe data agar lebih aman dan rapi
interface Project {
  id: string;
  title: string;
  description: string;
  tech_stack: string;
  demo_url: string;
  translations?: {
    [key: string]: {
      title: string;
      description: string;
      tech_stack: string;
    };
  };
}

interface BrandingData {
  photoUrl: string | null;
  description: string;
  isMultiLanguage: boolean;
  secondaryLang: string;
}

export default function HomePage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  
  // State Bahasa: 'native' (Indonesia) atau 'alt' (Bahasa Kedua)
  const [lang, setLang] = useState<'native' | 'alt'>('native');
  
  // State Personal Branding (Diambil dari LocalStorage Dashboard Admin)
  const [branding, setBranding] = useState<BrandingData>({
    photoUrl: null,
    description: '',
    isMultiLanguage: false,
    secondaryLang: 'en'
  });

  useEffect(() => {
    const fetchData = async () => {
      // 1. Ambil Data Projek dari Supabase
      const { data } = await supabase.from('projects').select('*');
      if (data) setProjects(data as Project[]);
      
      // 2. Ambil Data Personal Branding dari LocalStorage (Sinkronisasi dengan Dashboard)
      const savedBranding = localStorage.getItem('user_personal_branding');
      if (savedBranding) {
        try {
          const parsed = JSON.parse(savedBranding);
          setBranding(parsed);
          
          // Jika ada bahasa kedua dan kontennya tersedia, aktifkan mode alt
          if (parsed.isMultiLanguage && parsed.secondaryLang) {
            // Cek apakah ada projek yang punya terjemahan untuk memastikan tombol muncul
            const hasTranslation = data?.some((p: any) => 
              p.translations && p.translations[parsed.secondaryLang]
            );
            if (hasTranslation) {
              // Default tetap native, user bisa switch manual
            }
          }
        } catch (e) {
          console.error("Gagal memuat data branding", e);
        }
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  // Helper untuk mendapatkan teks berdasarkan bahasa
  const getText = (project: Project, field: 'title' | 'description' | 'tech_stack') => {
    if (lang === 'alt' && branding.isMultiLanguage && project.translations?.[branding.secondaryLang]) {
      return project.translations[branding.secondaryLang][field] || project[field];
    }
    return project[field];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFE9EC] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#65001E] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#FFE9EC] text-[#2B2B2B] font-sans selection:bg-[#FFBACF] selection:text-[#65001E]">
      <div className="max-w-5xl mx-auto px-6 py-12 md:py-20 space-y-20">
        
        {/* HEADER & LANGUAGE SWITCHER */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h2 className="text-sm font-bold tracking-widest text-[#B05D76] uppercase mb-1">Portfolio</h2>
            <h1 className="text-4xl md:text-5xl font-extrabold text-[#65001E] leading-tight">
              {branding.description ? 'Creative Developer' : 'My Works'}
            </h1>
          </div>

          {/* Language Toggle - Hanya muncul jika Multi-Language aktif di Dashboard */}
          {branding.isMultiLanguage && branding.secondaryLang && (
            <div className="bg-white/60 backdrop-blur-md border border-[#B05D76]/20 rounded-full p-1.5 flex gap-1 shadow-sm">
              <button 
                onClick={() => setLang('native')}
                className={`px-5 py-2 rounded-full text-xs font-bold transition-all duration-300 ${
                  lang === 'native' 
                    ? 'bg-[#65001E] text-[#FFE9EC] shadow-md' 
                    : 'text-[#B05D76] hover:bg-[#FFBACF]/30'
                }`}
              >
                ID
              </button>
              <button 
                onClick={() => setLang('alt')}
                className={`px-5 py-2 rounded-full text-xs font-bold transition-all duration-300 ${
                  lang === 'alt' 
                    ? 'bg-[#65001E] text-[#FFE9EC] shadow-md' 
                    : 'text-[#B05D76] hover:bg-[#FFBACF]/30'
                }`}
              >
                {branding.secondaryLang.toUpperCase()}
              </button>
            </div>
          )}
        </header>

        {/* HERO SECTION - PERSONAL BRANDING */}
        <section className="relative bg-white rounded-[2.5rem] p-8 md:p-12 shadow-[0_20px_50px_-12px_rgba(101,0,30,0.1)] border border-[#FFBACF]/30 overflow-hidden">
          {/* Decorative Background Element */}
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-[#FFBACF]/20 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-10 text-center md:text-left">
            <div className="shrink-0 group">
              <div className="w-40 h-40 md:w-48 md:h-48 rounded-full overflow-hidden border-4 border-white shadow-xl ring-1 ring-[#B05D76]/20 relative">
                {branding.photoUrl ? (
                  <img 
                    src={branding.photoUrl} 
                    alt="Profile" 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                  />
                ) : (
                  <div className="w-full h-full bg-[#FFE9EC] flex items-center justify-center text-[#B05D76]">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex-1 space-y-6">
              <div>
                <h3 className="text-2xl md:text-3xl font-bold text-[#2B2B2B] mb-3">
                  {lang === 'native' ? 'Tentang Saya' : 'About Me'}
                </h3>
                <p className="text-[#2B2B2B]/80 text-base md:text-lg leading-relaxed max-w-2xl">
                  {branding.description || "Seorang pengembang yang berdedikasi menciptakan solusi digital yang efisien dan elegan. Jelajahi projek-projek pilihan saya di bawah ini."}
                </p>
              </div>
              
              {/* Tech Stack Badge (Optional - Bisa diambil dari projek terakhir atau hardcoded) */}
              <div className="flex flex-wrap justify-center md:justify-start gap-2 pt-2">
                {['React', 'Next.js', 'TypeScript', 'Supabase'].map((tech) => (
                  <span key={tech} className="px-3 py-1 bg-[#FFE9EC] text-[#65001E] text-xs font-bold rounded-lg border border-[#FFBACF]/50">
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* PROJECTS GALLERY */}
        <div className="space-y-10">
          <div className="flex items-end justify-between border-b border-[#B05D76]/20 pb-4">
            <h2 className="text-3xl font-bold text-[#65001E]">
              {lang === 'native' ? 'Projek Pilihan' : 'Selected Works'}
            </h2>
            <span className="text-sm text-[#B05D76] font-medium hidden md:block">
              {projects.length} {lang === 'native' ? 'Projek' : 'Projects'}
            </span>
          </div>
          
          <div className="grid gap-12">
            {projects.map((project) => {
              const roles = project.demo_url?.match(/[?&]roles=([^&]+)/)?.[1].split(',') || ['admin'];
              const baseUrl = project.demo_url.split('?')[0];
              const displayTitle = getText(project, 'title');
              const displayDesc = getText(project, 'description');
              const displayTech = getText(project, 'tech_stack');

              return (
                <article key={project.id} className="group bg-white rounded-[2rem] overflow-hidden shadow-lg border border-[#FFBACF]/20 hover:shadow-[0_20px_40px_-10px_rgba(101,0,30,0.15)] transition-all duration-300">
                  {/* Content Header */}
                  <div className="p-8 md:p-10 border-b border-[#FFE9EC]">
                    <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-6">
                      <div>
                        <h3 className="text-2xl font-bold text-[#2B2B2B] mb-2 group-hover:text-[#65001E] transition-colors">
                          {displayTitle}
                        </h3>
                        <p className="text-[#2B2B2B]/70 leading-relaxed max-w-3xl">
                          {displayDesc}
                        </p>
                      </div>
                      <div className="shrink-0">
                         <span className="inline-block px-4 py-1.5 bg-[#2B2B2B] text-[#FFE9EC] text-xs font-bold rounded-full">
                           {displayTech}
                         </span>
                      </div>
                    </div>
                  </div>

                  {/* Interactive Grid Preview */}
                  <div className="bg-[#2B2B2B] p-4 md:p-6 space-y-4">
                    {roles.map((role: string) => (
                      <div key={`${project.id}-${role}`} className="relative rounded-xl overflow-hidden border border-[#65001E]/30 shadow-inner bg-black/20">
                        {/* Role Label */}
                        <div className="absolute top-4 left-4 z-20 bg-[#65001E]/90 backdrop-blur px-3 py-1.5 rounded-lg text-[10px] text-[#FFE9EC] font-bold tracking-wider border border-[#B05D76]/30 shadow-lg">
                          ROLE: {role.toUpperCase()}
                        </div>
                        
                        {/* Iframe Container with Scaling Trick */}
                        <div className="relative w-full aspect-video overflow-hidden bg-[#1a1a1a]">
                          <div className="absolute top-0 left-0 w-[133.33%] h-[133.33%] origin-top-left scale-[0.75] pointer-events-none">
                            <iframe 
                              src={`${baseUrl}?role=${role}`} 
                              className="w-full h-full border-none" 
                              loading="lazy" 
                              title={`Preview ${role}`}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        {/* FOOTER */}
        <footer className="pt-12 border-t border-[#B05D76]/20 text-center">
          <p className="text-[#B05D76] text-sm font-medium">
            © {new Date().getFullYear()} Portfolio. Built with precision and passion.
          </p>
        </footer>
      </div>
    </main>
  );
}