'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Project {
  id: string;
  title: string;
  title_alt?: string;
  description: string;
  description_alt?: string;
  tech_stack: string;
  demo_url: string;
}

export default function DashboardAdmin() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [title, setTitle] = useState('');
  const [titleAlt, setTitleAlt] = useState('');
  const [description, setDescription] = useState('');
  const [descriptionAlt, setDescriptionAlt] = useState('');
  const [techStack, setTechStack] = useState('');
  const [demoUrl, setDemoUrl] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // State Personal Branding (Local Storage)
  const [profileName, setProfileName] = useState('');
  const [profilePhoto, setProfilePhoto] = useState('');
  const [profileAbout, setProfileAbout] = useState('');
  
  // State Bahasa Alternatif (Local Storage)
  const [altLangName, setAltLangName] = useState(''); // cth: 'English'
  const [profileAboutAlt, setProfileAboutAlt] = useState('');

  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login-admin');
      } else {
        fetchProjects();
      }
    };
    checkUser();

    // Load data dari Local Storage
    setProfileName(localStorage.getItem('porto_name') || '');
    setProfilePhoto(localStorage.getItem('porto_photo') || '');
    setProfileAbout(localStorage.getItem('porto_about') || '');
    setAltLangName(localStorage.getItem('porto_alt_lang_name') || '');
    setProfileAboutAlt(localStorage.getItem('porto_about_alt') || '');
  }, [router]);

  const fetchProjects = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
    if (!error && data) setProjects(data);
    setLoading(false);
  };

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('porto_name', profileName);
    localStorage.setItem('porto_photo', profilePhoto);
    localStorage.setItem('porto_about', profileAbout);
    localStorage.setItem('porto_alt_lang_name', altLangName);
    localStorage.setItem('porto_about_alt', profileAboutAlt);
    alert('Personal Branding (Bilingual) berhasil disimpan!');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !demoUrl) return alert('Judul utama dan URL wajib diisi!');

    const projectData = { 
      title, 
      title_alt: titleAlt,
      description, 
      description_alt: descriptionAlt,
      tech_stack: techStack, 
      demo_url: demoUrl 
    };

    try {
      if (editingId) {
        const { error } = await supabase.from('projects').update(projectData).eq('id', editingId);
        if (error) throw error;
        setEditingId(null);
      } else {
        const { error } = await supabase.from('projects').insert([projectData]);
        if (error) throw error;
      }
      resetProjectForm();
      fetchProjects();
      alert('Projek berhasil disimpan!');
    } catch (err: any) {
      alert(`Gagal nyimpen: ${err.message}. Udah nambahin kolom title_alt & description_alt belum di Supabase?!`);
    }
  };

  const resetProjectForm = () => {
    setTitle(''); setTitleAlt(''); setDescription(''); setDescriptionAlt('');
    setTechStack(''); setDemoUrl(''); setEditingId(null);
  };

  const startEdit = (project: Project) => {
    setEditingId(project.id); setTitle(project.title); setTitleAlt(project.title_alt || '');
    setDescription(project.description); setDescriptionAlt(project.description_alt || '');
    setTechStack(project.tech_stack); setDemoUrl(project.demo_url);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Yakin mau hapus?')) {
      await supabase.from('projects').delete().eq('id', id);
      fetchProjects();
    }
  };

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-teal-400">MEMUAT SISTEM...</div>;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans pb-24">
      <div className="max-w-7xl mx-auto space-y-8">
        <h1 className="text-3xl font-extrabold text-teal-400 border-b border-slate-800 pb-5">Admin Control Panel</h1>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 space-y-8">
            
            {/* FORM PERSONAL BRANDING */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
              <h2 className="text-sm font-bold text-emerald-400 mb-4 border-b border-slate-800 pb-2">👤 Personal Branding</h2>
              <form onSubmit={handleProfileSave} className="space-y-4">
                <input type="text" value={profileName} onChange={(e) => setProfileName(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white" placeholder="Nama Keren" />
                <input type="text" value={profilePhoto} onChange={(e) => setProfilePhoto(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white" placeholder="URL Foto Profil" />
                
                <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-800">
                  <label className="text-xs text-slate-400">Bahasa Utama (Indo)</label>
                  <textarea value={profileAbout} onChange={(e) => setProfileAbout(e.target.value)} className="w-full bg-slate-900 mt-1 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white h-20" placeholder="Deskripsi diri..." />
                </div>

                <div className="bg-teal-950/20 p-3 rounded-lg border border-teal-900/30">
                  <label className="text-xs text-teal-400 font-bold mb-1 block">🌐 Setup Bahasa Kedua</label>
                  <input type="text" value={altLangName} onChange={(e) => setAltLangName(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white mb-2" placeholder="Nama Bahasa (cth: English)" />
                  <textarea value={profileAboutAlt} onChange={(e) => setProfileAboutAlt(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white h-20" placeholder="Terjemahan deskripsi diri..." />
                </div>
                
                <button type="submit" className="w-full bg-emerald-500/20 text-emerald-400 font-bold py-2 rounded-xl text-sm">Simpan di Browser</button>
              </form>
            </div>

            {/* FORM CRUD PROJECT */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
              <h2 className="text-sm font-bold text-teal-400 mb-4 border-b border-slate-800 pb-2">{editingId ? '⚡ Edit Projek' : '➕ Tambah Projek'}</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Bahasa Utama */}
                <div className="space-y-2">
                  <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white" placeholder="Judul (Indo)" />
                  <textarea required value={description} onChange={(e) => setDescription(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white h-16" placeholder="Deskripsi (Indo)" />
                </div>

                {/* Bahasa Kedua */}
                <div className="space-y-2 p-3 bg-teal-950/20 border border-teal-900/30 rounded-lg">
                  <p className="text-xs text-teal-400 font-bold">Terjemahan Projek (Opsional)</p>
                  <input type="text" value={titleAlt} onChange={(e) => setTitleAlt(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white" placeholder="Judul (Bhs Kedua)" />
                  <textarea value={descriptionAlt} onChange={(e) => setDescriptionAlt(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white h-16" placeholder="Deskripsi (Bhs Kedua)" />
                </div>

                <input type="text" required value={techStack} onChange={(e) => setTechStack(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white" placeholder="Tech Stack" />
                <input type="text" required value={demoUrl} onChange={(e) => setDemoUrl(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white" placeholder="URL Demo" />
                
                <button type="submit" className="w-full bg-teal-500 text-slate-950 font-bold py-2 rounded-xl text-sm">{editingId ? 'Update' : 'Publish'}</button>
                {editingId && <button type="button" onClick={resetProjectForm} className="w-full bg-slate-800 text-white py-2 rounded-xl text-xs mt-2">Batal</button>}
              </form>
            </div>
          </div>

          <div className="lg:col-span-8 space-y-4">
            {/* List map sama kayak sebelumnya, cuma lu tambah tampilin logic hapus/edit */}
             {projects.map((proj) => (
                <div key={proj.id} className="bg-slate-900 border border-slate-700 p-5 rounded-2xl flex justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-teal-300">{proj.title} {proj.title_alt && <span className="text-xs text-slate-500">| {proj.title_alt}</span>}</h3>
                    <p className="text-slate-400 text-sm mt-1">{proj.description}</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button onClick={() => startEdit(proj)} className="px-3 py-1 bg-slate-800 text-xs rounded-lg">Edit</button>
                    <button onClick={() => handleDelete(proj.id)} className="px-3 py-1 bg-red-900/50 text-red-400 text-xs rounded-lg">Hapus</button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </main>
  );
}