'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Project {
  id: string;
  title: string;
  description: string;
  tech_stack: string;
  demo_url: string;
}

export default function DashboardAdmin() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [techStack, setTechStack] = useState('');
  const [demoUrl, setDemoUrl] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
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
  }, [router]);

  const fetchProjects = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) setProjects(data);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validasi dasar biar nggak nembak data kosong ke database
    if (!title || !demoUrl) {
      alert('Judul sama URL Demo wajib diisi, Bro!');
      return;
    }

    const projectData = {
      title,
      description,
      tech_stack: techStack,
      demo_url: demoUrl,
    };

    try {
      if (editingId) {
        // PROSES UPDATE/EDIT
        const { error } = await supabase.from('projects').update(projectData).eq('id', editingId);
        if (error) throw error; // Lempar error kalau Supabase nolak
        
        alert('Data berhasil diubah!');
        setEditingId(null);
      } else {
        // PROSES TAMBAH BARU
        const { error } = await supabase.from('projects').insert([projectData]);
        if (error) throw error;
        
        alert('Projek baru sukses mengangkasa!');
      }

      // Bersihin form kalau sukses
      setTitle('');
      setDescription('');
      setTechStack('');
      setDemoUrl('');
      
      // Ambil data terbaru
      fetchProjects();

    } catch (err: any) {
      // PENGAMAN: Kalau koneksi putus, tampilkan ini dan jangan rusak layout
      console.error("Gagal ngobrol sama Supabase:", err.message);
      alert(`Gagal nyimpen data Bro: ${err.message}. Coba cek koneksi atau cek status Supabase lu (jangan-jangan tidur).`);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Yakin mau hapus projek ini dari portofolio?')) {
      await supabase.from('projects').delete().eq('id', id);
      fetchProjects();
    }
  };

  const startEdit = (project: Project) => {
    setEditingId(project.id);
    setTitle(project.title);
    setDescription(project.description);
    setTechStack(project.tech_stack);
    setDemoUrl(project.demo_url);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login-admin');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-teal-400 font-mono">
        MEMUAT SISTEM ADMIN...
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-6 font-sans relative pb-24">
      <div className="max-w-6xl mx-auto">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center border-b border-slate-800 pb-5 mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-teal-400">Admin Control Panel</h1>
            <p className="text-sm text-slate-500 mt-1">Sistem manajemen portofolio interaktif.</p>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-950/40 border border-red-900/50 hover:bg-red-900 text-red-400 text-sm rounded-xl transition-colors self-start md:self-auto"
          >
            Logout
          </button>
        </div>

        {/* KONTEN CRUD UTAMA */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 animate-fadeIn">
          {/* Form Input Data */}
          <div className="lg:col-span-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl h-fit sticky top-6 shadow-xl">
            <h2 className="text-sm font-bold text-slate-300 mb-6 border-b border-slate-800 pb-3">
              {editingId ? '⚡ Mode Edit Projek' : '➕ Tambah Projek Baru'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs text-slate-400 mb-1">JUDUL APLIKASI</label>
                <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-teal-500 transition-colors" />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">DESKRIPSI SINGKAT</label>
                <textarea required value={description} onChange={(e) => setDescription(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-teal-500 h-28 resize-none transition-colors" />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">TEKNOLOGI (Pisahkan koma)</label>
                <input type="text" required value={techStack} onChange={(e) => setTechStack(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-teal-500 transition-colors" />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1 font-bold text-emerald-400">URL DEMO & SETTING LAYAR</label>
                <input type="text" required value={demoUrl} onChange={(e) => setDemoUrl(e.target.value)} className="w-full bg-slate-950 border border-emerald-900/50 rounded-xl px-4 py-3 text-sm text-emerald-100 focus:outline-none focus:border-emerald-500 transition-colors" placeholder="https://web.com/login?roles=marketing,direktur" />
              </div>
              <button type="submit" className="w-full bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold py-3 rounded-xl text-sm transition-colors mt-4">
                {editingId ? 'Simpan Perubahan' : 'Publish Projek'}
              </button>
              {editingId && (
                <button type="button" onClick={() => { setEditingId(null); setTitle(''); setDescription(''); setTechStack(''); setDemoUrl(''); }} className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 py-3 rounded-xl text-xs transition-colors mt-2">
                  Batal Edit
                </button>
              )}
            </form>
          </div>

          {/* List Database */}
          <div className="lg:col-span-8 space-y-4">
            <h2 className="text-sm font-bold text-slate-300 mb-6 border-b border-slate-800 pb-3">
              Daftar Projek Aktif ({projects.length})
            </h2>
            {projects.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 border-dashed p-10 text-center rounded-2xl">
                <p className="text-slate-500 text-sm">Belum ada projek di database.</p>
              </div>
            ) : (
              projects.map((proj) => (
                <div key={proj.id} className="bg-slate-900 border border-slate-700 p-5 rounded-2xl flex flex-col justify-between md:flex-row md:items-start gap-4 hover:border-teal-900 transition-colors shadow-lg">
                  <div className="space-y-2 flex-1">
                    <h3 className="font-bold text-teal-300 text-lg">{proj.title}</h3>
                    <p className="text-slate-400 text-sm line-clamp-2">{proj.description}</p>
                    <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 mt-2 overflow-hidden">
                      <p className="text-emerald-500 text-[11px] font-mono truncate">{proj.demo_url}</p>
                    </div>
                  </div>
                  <div className="flex md:flex-col gap-2 shrink-0">
                    <button onClick={() => startEdit(proj)} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 text-xs rounded-xl transition-colors w-full text-center">Ubah</button>
                    <button onClick={() => handleDelete(proj.id)} className="px-4 py-2 bg-red-950/40 hover:bg-red-900/60 border border-red-900/50 text-red-400 text-xs rounded-xl transition-colors w-full text-center">Hapus</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* FLOATING BUTTON MENUJU KE HALAMAN TUTORIAL (A HREF LOGIC)      */}
      {/* ============================================================== */}
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