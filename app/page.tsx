'use client';

import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';

export default function HomePage() {
  const [projects, setProjects] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const { data } = await supabase.from('projects').select('*');
      if (data) setProjects(data);
    };
    fetchData();
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 w-full p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {projects.map((project) => {
          const roles = project.demo_url?.match(/[?&]roles=([^&]+)/)?.[1].split(',') || ['admin'];
          const baseUrl = project.demo_url.split('?')[0];

          return (
            <div key={project.id} className="w-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
              {/* Header Info */}
              <div className="px-6 py-5 border-b border-slate-800 flex flex-wrap justify-between items-center bg-slate-950/50">
                <div>
                  <h2 className="text-xl font-bold text-teal-400">{project.title}</h2>
                  <p className="text-slate-400 text-xs mt-1">{project.description}</p>
                </div>
                <div className="flex gap-2 mt-2 md:mt-0">
                  {project.tech_stack?.split(',').map((tech: string) => (
                    <span key={tech} className="px-2.5 py-1 bg-slate-900 border border-slate-700 text-[10px] rounded text-teal-500 font-mono">
                      {tech.trim()}
                    </span>
                  ))}
                </div>
              </div>

              {/* AREA IFRAME - GRID 1 KOLOM */}
              <div className="w-full bg-slate-900 flex flex-col">
                {roles.map((role: string) => (
                  <div 
                    key={`${project.id}-${role}`} 
                    className="relative w-full border-b border-slate-800 last:border-b-0"
                  >
                    {/* Label Role */}
                    <div className="absolute top-4 left-4 z-20 bg-black/70 backdrop-blur px-3 py-1 rounded-md text-[11px] text-teal-300 font-bold font-mono border border-slate-700/50">
                      {role.toUpperCase()}
                    </div>

                    {/* Wrapper Iframe - Rasio 16:9 dengan Padding-Top Trick */}
                    <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
                      <div className="absolute top-0 left-0 w-[300%] h-[300%] origin-top-left scale-[0.333333]">
                        <iframe 
                          src={`${baseUrl}?role=${role}`} 
                          className="absolute top-0 left-0 w-full h-full border-none pointer-events-none" 
                          title={role}
                          sandbox="allow-scripts allow-forms allow-same-origin"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}