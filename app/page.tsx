'use client';
import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';

interface Project {
  id: string;
  title: string;
  description: string;
  tech_stack: string;
  demo_url: string;
  translations?: Record<string, { title: string; description: string; tech_stack: string }>;
}

interface BrandingData {
  photo_url: string | null;
  description: string;
  is_multi_language: boolean;
  secondary_lang: string;
}

interface SkillsData {
  hard: string[];
  soft: string[];
}

// ══════════════════════════════════════════════════════════════════════════
// KOMPONEN KHUSUS: Mengurus perputaran iframe otomatis (Dinamis dari Database)
// ══════════════════════════════════════════════════════════════════════════
const ProjectItem = ({ project, darkMode, colors, lang, branding, getText }: any) => {
  // Ambil data dinamis dari database. Kalau ga ada parameter ?roles=, fallback ke ['admin']
  const roles = project.demo_url?.match(/[?&]roles=([^&]+)/)?.[1].split(',') || ['admin'];
  console.log("Raw demo_url dari Supabase:", project.demo_url);
  const baseUrl = project.demo_url.split('?')[0];
  
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    // Kalau rolenya cuma 1, timer ga usah dijalanin.
    if (roles.length <= 1) return;
    
    // Timer 40 Detik buat ganti giliran.
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % roles.length);
    }, 40000); 

    return () => clearInterval(timer);
  }, [roles.length]);

  const activeRole = roles[currentIndex];
  const displayTitle = getText(project, 'title');
  const displayDesc = getText(project, 'description');
  const displayTech = getText(project, 'tech_stack');

  return (
    <article className={`group rounded-[2rem] overflow-hidden shadow-lg border transition-all duration-300 ${darkMode ? 'bg-slate-900 border-slate-800 hover:border-teal-900/50' : 'bg-white border-[#FFBACF]/20 hover:shadow-[0_20px_40px_-10px_rgba(101,0,30,0.15)]'}`}>
      <div className={`p-8 md:p-10 border-b ${darkMode ? 'border-slate-800' : 'border-[#FFE9EC]'}`}>
        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-6">
          <div className="flex-1">
            <h3 className={`text-[16px] font-bold mb-2 group-hover:text-teal-400 transition-colors leading-[1.5] ${darkMode ? 'text-white' : 'text-[#2B2B2B]'}`}>
              {displayTitle}
            </h3>
            <p className={`text-[12px] md:text-[14px] leading-[1.5] text-justify font-['Poppins'] ${colors.muted}`}>
              {displayDesc}
            </p>
          </div>
          
          <div className="shrink-0 mt-3 md:mt-0 flex flex-wrap gap-2 justify-start md:justify-end">
            {displayTech.split(',').map((tech: string, index: number) => (
               <span key={index} className={`inline-block px-3 py-1 text-[12px] md:text-[14px] font-bold rounded-full leading-[1.5] ${darkMode ? 'bg-slate-800 text-slate-300' : 'bg-[#2B2B2B] text-[#FFE9EC]'}`}>
                 {tech.trim()}
               </span>
            ))}
          </div>
        </div>
      </div>

      <div className={`p-4 md:p-6 space-y-4 ${darkMode ? 'bg-black/40' : 'bg-[#2B2B2B]'}`}>
        <div className="relative rounded-xl overflow-hidden border border-[#65001E]/30 shadow-inner bg-black/20 transform-gpu">
          
          <div className="absolute top-4 left-4 z-20 bg-[#65001E]/90 backdrop-blur px-3 py-1.5 rounded-lg text-[12px] text-[#FFE9EC] font-bold tracking-wider border border-[#B05D76]/30 shadow-lg leading-[1.5] flex items-center gap-2">
            <span>ROLE: {activeRole.toUpperCase()}</span>
            {roles.length > 1 && (
                <span className="opacity-60 text-[10px] bg-black/30 px-2 py-0.5 rounded-full">
                    ({currentIndex + 1}/{roles.length})
                </span>
            )}
          </div>
          
          <div className="relative w-full aspect-video overflow-hidden bg-[#1a1a1a]">
            {/* OVERLAY GAIB BUAT NGEBLOK KLIK */}
            <div className="absolute inset-0 z-10 w-full h-full"></div>
            
            <div className="absolute top-0 left-0 w-[133.33%] h-[133.33%] origin-top-left scale-[0.75] will-change-transform transform-gpu transition-opacity duration-300">
              {/* DI SINI CUMA ADA 1 IFRAME! Ganti URL-nya otomatis tiap 40 detik */}
              <iframe 
                key={activeRole} 
                src={`${baseUrl}?current_role=${activeRole}`} 
                className="w-full h-full border-none" 
                title={`Preview ${activeRole}`}
                sandbox="allow-scripts allow-same-origin allow-forms"
              />
            </div>
          </div>
        </div>
      </div>
    </article>
  );
};


// ══════════════════════════════════════════════════════════════════════════
// HALAMAN UTAMA (HOME PAGE)
// ══════════════════════════════════════════════════════════════════════════
export default function HomePage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState<'native' | 'alt'>('native');
  const [darkMode, setDarkMode] = useState(false);
 
  const [branding, setBranding] = useState<BrandingData>({
    photo_url: null,
    description: '',
    is_multi_language: false,
    secondary_lang: 'en'
  });
  
  const [skills, setSkills] = useState<SkillsData>({ hard: [], soft: [] });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: projData } = await supabase.from('projects').select('*');
        if (projData) setProjects(projData as Project[]);

        const { data: brandData } = await supabase.from('personal_branding').select('*').maybeSingle();
        if (brandData) setBranding(brandData);

        const savedSkills = localStorage.getItem('porto_skills');
        if (savedSkills) setSkills(JSON.parse(savedSkills));

        const savedTheme = localStorage.getItem('porto_theme');
        if (savedTheme === 'dark') {
          setDarkMode(true);
          document.documentElement.classList.add('dark');
        }
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const toggleTheme = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('porto_theme', newMode ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', newMode);
  };

  const getText = (project: Project, field: 'title' | 'description' | 'tech_stack') => {
    if (lang === 'alt' && branding.is_multi_language && project.translations?.[branding.secondary_lang]) {
      return project.translations[branding.secondary_lang][field] || project[field];
    }
    return project[field];
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center font-['Poppins'] ${darkMode ? 'bg-slate-950' : 'bg-[#FFE9EC]'}`}>
        <div className={`w-8 h-8 border-4 border-t-transparent rounded-full animate-spin ${darkMode ? 'border-teal-500' : 'border-[#65001E]'}`}></div>
      </div>
    );
  }

  const colors = darkMode ? {
    bg: 'bg-slate-950', text: 'text-slate-100', card: 'bg-slate-900', border: 'border-slate-800',
    primary: 'text-teal-400', accent: 'text-purple-400', muted: 'text-slate-400',
    badgeBg: 'bg-slate-800', badgeBorder: 'border-slate-700'
  } : {
    bg: 'bg-[#FFE9EC]', text: 'text-[#2B2B2B]', card: 'bg-white', border: 'border-[#FFBACF]/30',
    primary: 'text-[#65001E]', accent: 'text-[#B05D76]', muted: 'text-[#2B2B2B]/70',
    badgeBg: 'bg-[#FFE9EC]', badgeBorder: 'border-[#FFBACF]/50'
  };

  return (
    <main className={`min-h-screen transition-colors duration-300 ${colors.bg} ${colors.text} font-['Poppins'] selection:bg-[#FFBACF] selection:text-[#65001E]`}>
      <div className="max-w-5xl mx-auto pt-4 pr-4 pb-3 pl-3 md:pt-6 md:pr-6 md:pb-5 md:pl-5 space-y-16">
        
        {/* HEADER */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h2 className={`text-[12px] md:text-[14px] font-bold tracking-widest uppercase mb-1 leading-[1.5] ${colors.accent}`}>Portfolio</h2>
            <h1 className={`text-[16px] font-extrabold leading-[1.5] ${colors.primary}`}>
              {branding.description ? 'Creative Developer' : 'My Works'}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={toggleTheme} className={`p-2 rounded-full border transition-all ${darkMode ? 'bg-slate-800 border-slate-700 text-yellow-400' : 'bg-white/60 border-[#B05D76]/20 text-[#65001E]'}`}>
              {darkMode ? '☀️' : '🌙'}
            </button>
            {branding.is_multi_language && branding.secondary_lang && (
              <div className={`backdrop-blur-md rounded-full p-1.5 flex gap-1 shadow-sm border ${darkMode ? 'bg-slate-800/60 border-slate-700' : 'bg-white/60 border-[#B05D76]/20'}`}>
                <button onClick={() => setLang('native')} className={`px-5 py-2 rounded-full text-[12px] md:text-[14px] font-bold transition-all duration-300 leading-[1.5] ${lang === 'native' ? (darkMode ? 'bg-teal-500 text-slate-950' : 'bg-[#65001E] text-[#FFE9EC]') : (darkMode ? 'text-slate-400 hover:bg-slate-700' : 'text-[#B05D76] hover:bg-[#FFBACF]/30')}`}>ID</button>
                <button onClick={() => setLang('alt')} className={`px-5 py-2 rounded-full text-[12px] md:text-[14px] font-bold transition-all duration-300 leading-[1.5] ${lang === 'alt' ? (darkMode ? 'bg-teal-500 text-slate-950' : 'bg-[#65001E] text-[#FFE9EC]') : (darkMode ? 'text-slate-400 hover:bg-slate-700' : 'text-[#B05D76] hover:bg-[#FFBACF]/30')}`}>{branding.secondary_lang.toUpperCase()}</button>
              </div>
            )}
          </div>
        </header>

        {/* HERO SECTION */}
        <section className={`relative rounded-[2.5rem] p-8 md:p-12 border overflow-hidden shadow-lg ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-[#FFBACF]/30 shadow-[0_20px_50px_-12px_rgba(101,0,30,0.1)]'}`}>
          {!darkMode && <div className="absolute -top-20 -right-20 w-64 h-64 bg-[#FFBACF]/20 rounded-full blur-3xl pointer-events-none"></div>}
          
          <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-10 text-center md:text-left">
            <div className="shrink-0 group">
              <div className={`w-40 h-40 md:w-48 md:h-48 rounded-full overflow-hidden border-4 shadow-xl ring-1 relative ${darkMode ? 'border-slate-700 ring-slate-600' : 'border-white ring-[#B05D76]/20'}`}>
                {branding.photo_url ? (
                  <img src={branding.photo_url} alt="Profile" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                ) : (
                  <div className={`w-full h-full flex items-center justify-center ${darkMode ? 'bg-slate-800 text-slate-600' : 'bg-[#FFE9EC] text-[#B05D76]'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex-1 space-y-6">
              <div>
                <h3 className={`text-[16px] font-bold mb-3 leading-[1.5] ${darkMode ? 'text-white' : 'text-[#2B2B2B]'}`}>
                  {lang === 'native' ? 'Tentang Saya' : 'About Me'}
                </h3>
                <p className={`text-[12px] md:text-[14px] leading-[1.5] text-justify font-['Poppins'] ${colors.muted}`}>
                  {branding.description || "Seorang pengembang yang berdedikasi menciptakan solusi digital yang efisien dan elegan."}
                </p>
              </div>
              
              {/* SKILLS DISPLAY */}
              {(skills.hard.length > 0 || skills.soft.length > 0) && (
                <div className="space-y-3 pt-2">
                  {skills.hard.length > 0 && (
                    <div className="flex flex-wrap justify-center md:justify-start gap-2">
                      {skills.hard.map((tech) => (
                        <span key={tech} className={`px-3 py-1 text-[12px] md:text-[14px] font-bold rounded-lg border leading-[1.5] ${darkMode ? 'bg-teal-900/30 text-teal-400 border-teal-800/50' : 'bg-[#FFE9EC] text-[#65001E] border-[#FFBACF]/50'}`}>
                          {tech}
                        </span>
                      ))}
                    </div>
                  )}
                  {skills.soft.length > 0 && (
                    <div className="flex flex-wrap justify-center md:justify-start gap-2">
                      {skills.soft.map((skill) => (
                        <span key={skill} className={`px-3 py-1 text-[12px] md:text-[14px] font-bold rounded-lg border leading-[1.5] ${darkMode ? 'bg-purple-900/30 text-purple-400 border-purple-800/50' : 'bg-purple-50 text-[#B05D76] border-purple-200'}`}>
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* PROJECTS GALLERY */}
        <div className="space-y-10">
          <div className={`flex items-end justify-between pb-4 border-b ${darkMode ? 'border-slate-800' : 'border-[#B05D76]/20'}`}>
            <h2 className={`text-[16px] font-bold leading-[1.5] ${colors.primary}`}>
              {lang === 'native' ? 'Projek Pilihan' : 'Selected Works'}
            </h2>
            <span className={`text-[12px] md:text-[14px] font-medium hidden md:block leading-[1.5] ${colors.accent}`}>
              {projects.length} {lang === 'native' ? 'Projek' : 'Projects'}
            </span>
          </div>
          
          <div className="grid gap-12">
            {projects.map((project) => (
              <ProjectItem 
                key={project.id} 
                project={project} 
                darkMode={darkMode} 
                colors={colors} 
                lang={lang} 
                branding={branding} 
                getText={getText} 
              />
            ))}
          </div>
        </div>

        {/* FOOTER */}
        <footer className={`pt-12 text-center border-t ${darkMode ? 'border-slate-800 text-slate-500' : 'border-[#B05D76]/20 text-[#B05D76]'}`}>
          <p className="text-[12px] md:text-[14px] font-medium leading-[1.5]">
            © {new Date().getFullYear()} Portfolio. Built with precision and passion.
          </p>
        </footer>
      </div>
    </main>
  );
}