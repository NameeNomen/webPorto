'use client';

import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';

export default function HomePage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [lang, setLang] = useState<'native' | 'alt'>('native');
  
  const [profile, setProfile] = useState({
    name: 'Siti Nur Fatimah',
    photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Siti&backgroundColor=0f172a',
    about_native: 'Efficiency-Driven Full-Stack Developer...',
    about_alt: '',
    alt_lang_name: 'English'
  });

  useEffect(() => {
    const fetchData = async () => {
      const { data } = await supabase.from('projects').select('*');
      if (data) setProjects(data);
    };
    fetchData();

    const savedName = localStorage.getItem('porto_name');
    const savedPhoto = localStorage.getItem('porto_photo');
    if (savedName || savedPhoto) {
      setProfile({
        name: savedName || profile.name,
        photo: savedPhoto || profile.photo,
        about_native: localStorage.getItem('porto_about') || profile.about_native,
        about_alt: localStorage.getItem('porto_about_alt') || '',
        alt_lang_name: localStorage.getItem('porto_alt_lang_name') || 'English'
      });
    }
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-12">
        
        {/* TOMBOL SWITCH BAHASA */}
        {profile.alt_lang_name && profile.about_alt && (
          <div className="flex justify-end">
            <div className="bg-slate-900 border border-slate-800 rounded-full p-1 flex gap-1">
              <button 
                onClick={() => setLang('native')}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${lang === 'native' ? 'bg-teal-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}
              >
                ID
              </button>
              <button 
                onClick={() => setLang('alt')}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${lang === 'alt' ? 'bg-teal-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}
              >
                {profile.alt_lang_name.toUpperCase()}
              </button>
            </div>
          </div>
        )}

        {/* HERO SECTION */}
        <section className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl flex flex-col md:flex-row items-center gap-8">
          <div className="shrink-0 z-10">
            <img src={profile.photo} alt="Profile" className="w-32 h-32 rounded-full object-cover border-4 border-teal-500/30" />
          </div>
          <div className="text-center md:text-left z-10">
            <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-4">{profile.name}</h1>
            <p className="text-slate-400 text-sm md:text-base leading-relaxed">
              {lang === 'native' ? profile.about_native : (profile.about_alt || profile.about_native)}
            </p>
          </div>
        </section>

        {/* PROJECTS SECTION */}
        <div className="space-y-8">
          <h2 className="text-2xl font-bold text-teal-400 border-b border-slate-800 pb-2">
            {lang === 'native' ? 'Projek Pilihan' : 'Selected Works'}
          </h2>
          
          {projects.map((project) => {
            const roles = project.demo_url?.match(/[?&]roles=([^&]+)/)?.[1].split(',') || ['admin'];
            const baseUrl = project.demo_url.split('?')[0];

            // Tentukan data mana yang mau ditampilin berdasarkan state 'lang'
            const displayTitle = lang === 'alt' && project.title_alt ? project.title_alt : project.title;
            const displayDesc = lang === 'alt' && project.description_alt ? project.description_alt : project.description;

            return (
              <div key={project.id} className="w-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
                <div className="px-6 py-5 border-b border-slate-800 flex flex-col md:flex-row md:justify-between md:items-center bg-slate-950/50 gap-4">
                  <div>
                    <h3 className="text-xl font-bold text-white">{displayTitle}</h3>
                    <p className="text-slate-400 text-sm mt-1">{displayDesc}</p>
                  </div>
                </div>

                <div className="w-full bg-slate-950 flex flex-col">
                  {roles.map((role: string) => (
                    <div key={`${project.id}-${role}`} className="relative w-full border-b border-slate-800">
                      <div className="absolute top-4 left-4 z-20 bg-slate-900/90 backdrop-blur px-3 py-1.5 rounded-lg text-xs text-teal-300 font-bold border border-slate-700 shadow-lg">
                        ROLE: {role.toUpperCase()}
                      </div>
                      <div className="relative w-full aspect-video overflow-hidden bg-slate-900">
                        <div className="absolute top-0 left-0 w-[133.33%] h-[133.33%] origin-top-left scale-[0.75]">
                          <iframe src={`${baseUrl}?role=${role}`} className="w-full h-full border-none" loading="lazy" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <Link
          href="/tutorial"
          className="fixed bottom-6 right-6 bg-emerald-600 hover:bg-emerald-500 text-white p-4 rounded-full shadow-2xl shadow-emerald-900/40 flex items-center gap-3 group transition-all duration-300 z-50 border border-emerald-400"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337z" />
          </svg>
          <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-[200px] transition-all duration-500 ease-in-out font-bold text-sm tracking-wide">
            Buka Bot Tutorial
          </span>
        </Link>
    </main>
  );
}