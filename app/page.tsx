'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/navigation';

interface Project {
  id: string;
  title: string;
  description: string;
  tech_stack: string;
  demo_url: string;
  translations?: Record<string, { title: string; description: string; tech_stack: string }>;
}

interface PersonalBranding {
  photoBase64: string | null;
  description: string;
  isMultiLanguage: boolean;
  secondaryLang: string;
}

export default function DashboardAdmin() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [techStack, setTechStack] = useState('');
  const [demoUrl, setDemoUrl] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'manage' | 'tutorial' | 'branding'>('manage');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // State Personal Branding (LocalStorage)
  const [branding, setBranding] = useState<PersonalBranding>({
    photoBase64: null,
    description: '',
    isMultiLanguage: false,
    secondaryLang: 'en',
  });

  // State Translations
  const [transTitle, setTransTitle] = useState('');
  const [transDesc, setTransDesc] = useState('');
  const [transTech, setTransTech] = useState('');

  const router = useRouter();

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login-admin');
      } else {
        fetchProjects();
        loadLocalBranding();
      }
    };
    init();
  }, [router]);

  // --- LOCAL STORAGE LOGIC (BASE64 SUPPORT) ---
  const loadLocalBranding = () => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('user_personal_branding');
      if (saved) {
        try {
          setBranding(JSON.parse(saved));
        } catch (e) {
          console.error('Failed to parse branding', e);
        }
      }
    }
  };

  const saveLocalBranding = (newData: Partial<PersonalBranding>) => {
    const updated = { ...branding, ...newData };
    setBranding(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('user_personal_branding', JSON.stringify(updated));
    }
  };

  // Konversi File ke Base64 agar tersimpan permanen di LocalStorage
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validasi ukuran max 500KB agar LocalStorage tidak penuh
    if (file.size > 512000) {
      alert('Ukuran foto terlalu besar! Maksimal 500KB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      saveLocalBranding({ photoBase64: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  const removePhoto = () => {
    saveLocalBranding({ photoBase64: null });
  };

  // --- PROJECT CRUD LOGIC ---
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
    const projectData: any = { title, description, tech_stack: techStack, demo_url: demoUrl };

    if (branding.isMultiLanguage && (transTitle || transDesc)) {
      projectData.translations = {
        [branding.secondaryLang]: {
          title: transTitle || title,
          description: transDesc || description,
          tech_stack: transTech || techStack,
        },
      };
    }

    if (editingId) {
      await supabase.from('projects').update(projectData).eq('id', editingId);
      setEditingId(null);
    } else {
      await supabase.from('projects').insert([projectData]);
    }
    resetForm();
    fetchProjects();
  };

  const resetForm = () => {
    setTitle(''); setDescription(''); setTechStack(''); setDemoUrl('');
    setTransTitle(''); setTransDesc(''); setTransTech('');
  };

  const startEdit = (project: Project) => {
    setEditingId(project.id);
    setTitle(project.title);
    setDescription(project.description);
    setTechStack(project.tech_stack);
    setDemoUrl(project.demo_url);

    const t = project.translations?.[branding.secondaryLang];
    setTransTitle(t?.title || '');
    setTransDesc(t?.description || '');
    setTransTech(t?.tech_stack || '');
    setActiveTab('manage');
  };

  const handleDelete = async (id: string) => {
    if (confirm('Yakin mau hapus projek ini?')) {
      await supabase.from('projects').delete().eq('id', id);
      fetchProjects();
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login-admin');
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const pluginCode = `document.addEventListener("DOMContentLoaded", function() {
    const urlParams = new URLSearchParams(window.location.search);
    const currentRole = urlParams.get('role');
    if (!currentRole) return;
    const credentials = {
        'marketing':   { username: 'marketing', pass: 'marketing123' },
        'engineering': { username: 'engineering', pass: 'marketing123' },
        'direktur':    { username: 'direktur', pass: 'marketing123' },
        'purchasing':  { username: 'purchasing', pass: 'marketing123' }
    };
    const activeAccount = credentials[currentRole.toLowerCase()];
    if (!activeAccount) return;
    setTimeout(() => {
        const userInput = document.querySelector('input[type="email"]') || document.querySelector('input[name*="user"]');
        const passwordInput = document.querySelector('input[type="password"]');
        if (userInput && passwordInput) {
            userInput.value = activeAccount.username;
            passwordInput.value = activeAccount.pass;
            userInput.dispatchEvent(new Event('input', { bubbles: true }));
            passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
            setTimeout(() => {
                const btn = document.querySelector('button[type="submit"]');
                if (btn) btn.click();
            }, 1500);
        }
    }, 1000);
});`;

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-teal-400 font-mono">MEMUAT SISTEM...</div>;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* HEADER */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-teal-400 tracking-tight">Admin Panel</h1>
            <p className="text-sm text-slate-500 mt-1">Kelola portofolio & personal branding lokal.</p>
          </div>
          <button onClick={handleLogout} className="px-5 py-2 bg-red-950/30 border border-red-900/50 hover:bg-red-900/50 text-red-400 text-xs font-bold rounded-lg transition-all">
            LOGOUT
          </button>
        </header>

        {/* TABS */}
        <nav className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-900/50 p-2 rounded-xl border border-slate-800">
          {[
            { id: 'manage', label: '📦 KELOLA PROJEK', color: 'teal' },
            { id: 'branding', label: '👤 PERSONAL BRANDING', color: 'purple' },
            { id: 'tutorial', label: '⚙️ PANDUAN PLUGIN', color: 'emerald' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3 text-xs font-bold rounded-lg transition-all duration-200 ${
                activeTab === tab.id
                  ? `bg-${tab.color}-500 text-slate-950 shadow-lg scale-[1.02]`
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {/* CONTENT: MANAGE PROJECTS */}
        {activeTab === 'manage' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* FORM */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl sticky top-6">
                <h2 className="text-sm font-bold text-slate-300 mb-5 flex items-center gap-2">
                  {editingId ? '⚡ Edit Projek' : '➕ Tambah Projek'}
                </h2>
                
                {branding.isMultiLanguage && (
                  <div className="mb-4 p-3 bg-purple-900/20 border border-purple-500/30 rounded-lg">
                    <p className="text-[10px] text-purple-300 font-bold">🌍 Mode Multi-Bahasa Aktif ({branding.secondaryLang.toUpperCase()})</p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Judul</label>
                    <input required value={title} onChange={(e) => setTitle(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-sm focus:border-teal-500 outline-none transition-colors" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Deskripsi</label>
                    <textarea required value={description} onChange={(e) => setDescription(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-sm h-24 resize-none focus:border-teal-500 outline-none transition-colors" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Tech Stack</label>
                    <input required value={techStack} onChange={(e) => setTechStack(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-sm focus:border-teal-500 outline-none transition-colors" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-emerald-500 uppercase">URL Demo (Roles)</label>
                    <input required value={demoUrl} onChange={(e) => setDemoUrl(e.target.value)} placeholder="https://web.com?roles=a,b" className="w-full bg-slate-950 border border-emerald-900/50 rounded-lg px-4 py-2.5 text-sm text-emerald-100 focus:border-emerald-500 outline-none transition-colors" />
                  </div>

                  {branding.isMultiLanguage && (
                    <div className="pt-4 border-t border-slate-800 space-y-3">
                      <p className="text-[10px] font-bold text-purple-400 uppercase">Terjemahan ({branding.secondaryLang})</p>
                      <input value={transTitle} onChange={(e) => setTransTitle(e.target.value)} placeholder="Judul..." className="w-full bg-slate-950 border border-purple-900/30 rounded-lg px-3 py-2 text-xs text-purple-100 outline-none focus:border-purple-500" />
                      <textarea value={transDesc} onChange={(e) => setTransDesc(e.target.value)} placeholder="Deskripsi..." className="w-full bg-slate-950 border border-purple-900/30 rounded-lg px-3 py-2 text-xs text-purple-100 h-16 resize-none outline-none focus:border-purple-500" />
                    </div>
                  )}

                  <button type="submit" className="w-full bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold py-3 rounded-lg text-sm mt-2 transition-colors">
                    {editingId ? 'Simpan Perubahan' : 'Publish Projek'}
                  </button>
                  {editingId && (
                    <button type="button" onClick={() => { setEditingId(null); resetForm(); }} className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 rounded-lg text-xs transition-colors">
                      Batal
                    </button>
                  )}
                </form>
              </div>
            </div>

            {/* LIST */}
            <div className="lg:col-span-8 space-y-4">
              <h2 className="text-sm font-bold text-slate-400 mb-2">Daftar Projek ({projects.length})</h2>
              {projects.length === 0 ? (
                <div className="border border-dashed border-slate-800 rounded-2xl p-12 text-center text-slate-600 text-sm">Belum ada data.</div>
              ) : (
                projects.map((p) => (
                  <div key={p.id} className="bg-slate-900 border border-slate-800 p-5 rounded-xl flex flex-col md:flex-row gap-4 hover:border-teal-900/50 transition-colors group">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-teal-300 truncate">{p.title}</h3>
                        {p.translations && <span className="text-[9px] bg-purple-900/40 text-purple-300 px-1.5 py-0.5 rounded border border-purple-800/50">MULTI</span>}
                      </div>
                      <p className="text-slate-500 text-xs line-clamp-2 mb-2">{p.description}</p>
                      <code className="text-[10px] text-emerald-600 bg-emerald-950/30 px-2 py-1 rounded block truncate">{p.demo_url}</code>
                    </div>
                    <div className="flex md:flex-col gap-2 shrink-0">
                      <button onClick={() => startEdit(p)} className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg transition-colors">Edit</button>
                      <button onClick={() => handleDelete(p.id)} className="flex-1 px-4 py-2 bg-red-950/20 hover:bg-red-950/40 text-red-400 text-xs rounded-lg transition-colors">Hapus</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* CONTENT: PERSONAL BRANDING */}
        {activeTab === 'branding' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* SETTINGS */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl sticky top-6">
                <h2 className="text-sm font-bold text-purple-400 mb-6">Pengaturan Profil Lokal</h2>
                
                {/* PHOTO UPLOAD (BASE64) */}
                <div className="mb-6 flex flex-col items-center">
                  <div className="relative group w-32 h-32 mb-3">
                    {branding.photoBase64 ? (
                      <img src={branding.photoBase64} alt="Profile" className="w-full h-full rounded-full object-cover border-4 border-purple-500/20 shadow-xl" />
                    ) : (
                      <div className="w-full h-full rounded-full bg-slate-800 border-2 border-dashed border-slate-700 flex items-center justify-center text-slate-600 text-xs">No Photo</div>
                    )}
                    <label className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                      <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                      <span className="text-white text-xs font-bold">Ganti Foto</span>
                    </label>
                    {branding.photoBase64 && (
                      <button onClick={removePhoto} className="absolute -bottom-1 -right-1 bg-red-500 text-white w-8 h-8 rounded-full flex items-center justify-center text-xs shadow-lg hover:bg-red-600">✕</button>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500 text-center">Disimpan di browser (Max 500KB)</p>
                </div>

                {/* BIO */}
                <div className="mb-6 space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Deskripsi Diri</label>
                  <textarea 
                    value={branding.description} 
                    onChange={(e) => saveLocalBranding({ description: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-sm h-32 resize-none focus:border-purple-500 outline-none transition-colors"
                    placeholder="Tulis bio singkat..."
                  />
                </div>

                {/* LANGUAGE TOGGLE */}
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300">Aktifkan Multi-Bahasa?</span>
                    <button 
                      onClick={() => saveLocalBranding({ isMultiLanguage: !branding.isMultiLanguage })}
                      className={`w-11 h-6 rounded-full relative transition-colors ${branding.isMultiLanguage ? 'bg-purple-500' : 'bg-slate-700'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${branding.isMultiLanguage ? 'left-6' : 'left-1'}`} />
                    </button>
                  </div>
                  
                  {branding.isMultiLanguage && (
                    <select 
                      value={branding.secondaryLang}
                      onChange={(e) => saveLocalBranding({ secondaryLang: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-300 outline-none focus:border-purple-500"
                    >
                      <option value="en">English</option>
                      <option value="jp">Japanese</option>
                      <option value="cn">Chinese</option>
                      <option value="ar">Arabic</option>
                    </select>
                  )}
                </div>
              </div>
            </div>

            {/* PREVIEW */}
            <div className="lg:col-span-7">
              <div className="bg-gradient-to-br from-slate-900 to-purple-950/10 border border-purple-900/20 p-8 rounded-2xl min-h-[400px] flex flex-col items-center justify-center text-center space-y-6">
                {branding.photoBase64 ? (
                  <img src={branding.photoBase64} className="w-40 h-40 rounded-full object-cover border-4 border-purple-500/30 shadow-2xl" alt="Preview" />
                ) : (
                  <div className="w-40 h-40 rounded-full bg-slate-800/50 border-2 border-dashed border-slate-700" />
                )}
                
                <div className="max-w-md space-y-2">
                  <h3 className="text-2xl font-bold text-white">About Me</h3>
                  <p className="text-slate-400 text-sm leading-relaxed whitespace-pre-wrap">
                    {branding.description || "Bio Anda akan muncul di sini..."}
                  </p>
                </div>

                {branding.isMultiLanguage && (
                  <div className="px-4 py-1.5 bg-purple-900/30 border border-purple-700/30 rounded-full text-xs text-purple-200 font-medium">
                    🌐 Available in {branding.secondaryLang.toUpperCase()}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* CONTENT: TUTORIAL */}
        {activeTab === 'tutorial' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-2xl font-bold text-emerald-400 mb-6">Panduan Autoplay Plugin</h2>
            <div className="space-y-8">
              <div className="space-y-3">
                <h3 className="font-bold text-slate-200 flex items-center gap-2"><span className="bg-emerald-900/50 text-emerald-400 w-6 h-6 rounded-full flex items-center justify-center text-xs">1</span> Copy Script</h3>
                <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
                  <div className="flex justify-between items-center px-4 py-2 bg-slate-900 border-b border-slate-800">
                    <span className="text-[10px] text-slate-500 font-mono">autoplay-plugin.js</span>
                    <button onClick={() => handleCopy(pluginCode, 't1')} className="text-[10px] text-emerald-400 hover:text-emerald-300">{copiedId === 't1' ? '✓ Copied' : 'Copy'}</button>
                  </div>
                  <pre className="p-4 text-xs font-mono text-slate-400 overflow-x-auto max-h-48">{pluginCode}</pre>
                </div>
              </div>
              
              <div className="space-y-3">
                <h3 className="font-bold text-slate-200 flex items-center gap-2"><span className="bg-emerald-900/50 text-emerald-400 w-6 h-6 rounded-full flex items-center justify-center text-xs">2</span> Format URL Roles</h3>
                <div className="grid gap-2 text-xs font-mono">
                  <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-slate-400">
                    <span className="text-emerald-400 block mb-1">4 Layar (Grid):</span>
                    ?roles=marketing,engineering,direktur,purchasing
                  </div>
                  <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-slate-400">
                    <span className="text-blue-400 block mb-1">1 Layar (Normal):</span>
                    ?role=marketing
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}