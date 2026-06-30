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
  id?: string;
  photo_url: string | null;
  description: string;
  is_multi_language: boolean;
  secondary_lang: string;
}

interface SkillsData {
  hard: string[];
  soft: string[];
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
  const [darkMode, setDarkMode] = useState(false);

  // State Personal Branding
  const [branding, setBranding] = useState<PersonalBranding>({
    photo_url: null,
    description: '',
    is_multi_language: false,
    secondary_lang: 'en',
  });
  const [uploading, setUploading] = useState(false);

  // State Skills (LocalStorage)
  const [skills, setSkills] = useState<SkillsData>({ hard: [], soft: [] });
  const [newHardSkill, setNewHardSkill] = useState('');
  const [newSoftSkill, setNewSoftSkill] = useState('');

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
        fetchBranding();
        loadSkills();
        
        // Cek preferensi dark mode
        const savedTheme = localStorage.getItem('porto_theme');
        if (savedTheme === 'dark') setDarkMode(true);
      }
    };
    init();
  }, [router]);

  // --- THEME LOGIC ---
  const toggleTheme = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('porto_theme', newMode ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', newMode);
  };

  // --- SUPABASE LOGIC ---
  const fetchProjects = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
    if (!error && data) setProjects(data);
    setLoading(false);
  };

  const fetchBranding = async () => {
    const { data, error } = await supabase.from('personal_branding').select('*').maybeSingle();
    if (!error && data) setBranding(data);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploading(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `branding/${fileName}`;

    try {
      const { error: uploadError } = await supabase.storage.from('branding-photos').upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('branding-photos').getPublicUrl(filePath);
      await saveBrandingToDb({ ...branding, photo_url: publicUrl });
    } catch (error: any) {
      alert(`Gagal upload: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = async () => {
    await saveBrandingToDb({ ...branding, photo_url: null });
  };

  const saveBrandingToDb = async (data: PersonalBranding) => {
    setUploading(true);
    try {
      if (branding.id) {
        await supabase.from('personal_branding').update(data).eq('id', branding.id);
      } else {
        const { data: inserted } = await supabase.from('personal_branding').insert([data]).select().single();
        if (inserted) setBranding(inserted);
      }
      setBranding(data);
    } catch (error) {
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  // --- SKILLS LOGIC (LOCALSTORAGE) ---
  const loadSkills = () => {
    const saved = localStorage.getItem('porto_skills');
    if (saved) setSkills(JSON.parse(saved));
  };

  const saveSkills = (newSkills: SkillsData) => {
    setSkills(newSkills);
    localStorage.setItem('porto_skills', JSON.stringify(newSkills));
  };

  const addHardSkill = () => {
    if (newHardSkill.trim() && !skills.hard.includes(newHardSkill.trim())) {
      saveSkills({ ...skills, hard: [...skills.hard, newHardSkill.trim()] });
      setNewHardSkill('');
    }
  };

  const addSoftSkill = () => {
    if (newSoftSkill.trim() && !skills.soft.includes(newSoftSkill.trim())) {
      saveSkills({ ...skills, soft: [...skills.soft, newSoftSkill.trim()] });
      setNewSoftSkill('');
    }
  };

  const removeHardSkill = (skill: string) => {
    saveSkills({ ...skills, hard: skills.hard.filter(s => s !== skill) });
  };

  const removeSoftSkill = (skill: string) => {
    saveSkills({ ...skills, soft: skills.soft.filter(s => s !== skill) });
  };

  // --- PROJECT CRUD ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const projectData: any = { title, description, tech_stack: techStack, demo_url: demoUrl };

    if (branding.is_multi_language && (transTitle || transDesc)) {
      projectData.translations = {
        [branding.secondary_lang]: {
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
    const t = project.translations?.[branding.secondary_lang];
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
    <main className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-slate-950 text-slate-100' : 'bg-gray-50 text-gray-900'} p-4 md:p-8 font-sans`}>
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* HEADER */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800/20 pb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-teal-500 tracking-tight">Admin Control Panel</h1>
            <p className={`text-sm mt-1 ${darkMode ? 'text-slate-500' : 'text-gray-500'}`}>Kelola portofolio, branding & skills.</p>
          </div>
          <div className="flex gap-3">
            <button onClick={toggleTheme} className={`px-4 py-2 rounded-lg text-xs font-bold border transition-all ${darkMode ? 'bg-slate-800 border-slate-700 text-yellow-400' : 'bg-white border-gray-200 text-gray-700'}`}>
              {darkMode ? '☀️ Light' : ' Dark'}
            </button>
            <button onClick={handleLogout} className="px-5 py-2 bg-red-950/30 border border-red-900/50 hover:bg-red-900/50 text-red-500 text-xs font-bold rounded-lg transition-all">
              LOGOUT
            </button>
          </div>
        </header>

        {/* TABS */}
        <nav className={`grid grid-cols-1 md:grid-cols-3 gap-3 p-2 rounded-xl border ${darkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-gray-200 shadow-sm'}`}>
          {[
            { id: 'manage', label: '📦 KELOLA PROJEK', color: 'teal' },
            { id: 'branding', label: '👤 BRANDING & SKILL', color: 'purple' },
            { id: 'tutorial', label: '⚙️ PANDUAN PLUGIN', color: 'emerald' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3 text-xs font-bold rounded-lg transition-all duration-200 ${
                activeTab === tab.id
                  ? `bg-${tab.color}-500 text-white shadow-lg scale-[1.02]`
                  : `${darkMode ? 'text-slate-400 hover:bg-slate-800' : 'text-gray-500 hover:bg-gray-100'}`
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {/* CONTENT: MANAGE PROJECTS */}
        {activeTab === 'manage' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="lg:col-span-4 space-y-6">
              <div className={`p-6 rounded-2xl sticky top-6 border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200 shadow-sm'}`}>
                <h2 className="text-sm font-bold mb-5 flex items-center gap-2">
                  {editingId ? '⚡ Edit Projek' : '➕ Tambah Projek'}
                </h2>
                
                {branding.is_multi_language && (
                  <div className="mb-4 p-3 bg-purple-900/20 border border-purple-500/30 rounded-lg">
                    <p className="text-[10px] text-purple-400 font-bold">🌍 Multi-Bahasa: {branding.secondary_lang.toUpperCase()}</p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase opacity-70">Judul</label>
                    <input required value={title} onChange={(e) => setTitle(e.target.value)} className={`w-full rounded-lg px-4 py-2.5 text-sm outline-none transition-colors border ${darkMode ? 'bg-slate-950 border-slate-700 focus:border-teal-500' : 'bg-gray-50 border-gray-300 focus:border-teal-500'}`} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase opacity-70">Deskripsi</label>
                    <textarea required value={description} onChange={(e) => setDescription(e.target.value)} className={`w-full rounded-lg px-4 py-2.5 text-sm h-24 resize-none outline-none transition-colors border ${darkMode ? 'bg-slate-950 border-slate-700 focus:border-teal-500' : 'bg-gray-50 border-gray-300 focus:border-teal-500'}`} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase opacity-70">Tech Stack</label>
                    <input required value={techStack} onChange={(e) => setTechStack(e.target.value)} className={`w-full rounded-lg px-4 py-2.5 text-sm outline-none transition-colors border ${darkMode ? 'bg-slate-950 border-slate-700 focus:border-teal-500' : 'bg-gray-50 border-gray-300 focus:border-teal-500'}`} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-emerald-500 uppercase">URL Demo</label>
                    <input required value={demoUrl} onChange={(e) => setDemoUrl(e.target.value)} placeholder="?roles=a,b" className={`w-full rounded-lg px-4 py-2.5 text-sm outline-none transition-colors border ${darkMode ? 'bg-slate-950 border-emerald-900/50 text-emerald-100 focus:border-emerald-500' : 'bg-gray-50 border-emerald-200 text-emerald-800 focus:border-emerald-500'}`} />
                  </div>

                  {branding.is_multi_language && (
                    <div className="pt-4 border-t border-slate-800/20 space-y-3">
                      <p className="text-[10px] font-bold text-purple-400 uppercase">Terjemahan ({branding.secondary_lang})</p>
                      <input value={transTitle} onChange={(e) => setTransTitle(e.target.value)} placeholder="Judul..." className={`w-full rounded-lg px-3 py-2 text-xs outline-none border ${darkMode ? 'bg-slate-950 border-purple-900/30 text-purple-100' : 'bg-purple-50 border-purple-200 text-purple-900'}`} />
                      <textarea value={transDesc} onChange={(e) => setTransDesc(e.target.value)} placeholder="Deskripsi..." className={`w-full rounded-lg px-3 py-2 text-xs h-16 resize-none outline-none border ${darkMode ? 'bg-slate-950 border-purple-900/30 text-purple-100' : 'bg-purple-50 border-purple-200 text-purple-900'}`} />
                    </div>
                  )}

                  <button type="submit" className="w-full bg-teal-500 hover:bg-teal-400 text-white font-bold py-3 rounded-lg text-sm mt-2 transition-colors">
                    {editingId ? 'Simpan Perubahan' : 'Publish Projek'}
                  </button>
                  {editingId && (
                    <button type="button" onClick={() => { setEditingId(null); resetForm(); }} className={`w-full py-2 rounded-lg text-xs transition-colors ${darkMode ? 'bg-slate-800 hover:bg-slate-700' : 'bg-gray-200 hover:bg-gray-300'}`}>
                      Batal
                    </button>
                  )}
                </form>
              </div>
            </div>

            <div className="lg:col-span-8 space-y-4">
              <h2 className="text-sm font-bold opacity-70 mb-2">Daftar Projek ({projects.length})</h2>
              {projects.length === 0 ? (
                <div className={`border border-dashed rounded-2xl p-12 text-center text-sm ${darkMode ? 'border-slate-800 text-slate-600' : 'border-gray-300 text-gray-400'}`}>Belum ada data.</div>
              ) : (
                projects.map((p) => (
                  <div key={p.id} className={`p-5 rounded-xl flex flex-col md:flex-row gap-4 transition-colors border ${darkMode ? 'bg-slate-900 border-slate-800 hover:border-teal-900/50' : 'bg-white border-gray-200 hover:border-teal-200 shadow-sm'}`}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-teal-500 truncate">{p.title}</h3>
                        {p.translations && <span className="text-[9px] bg-purple-900/40 text-purple-300 px-1.5 py-0.5 rounded border border-purple-800/50">MULTI</span>}
                      </div>
                      <p className={`text-xs line-clamp-2 mb-2 ${darkMode ? 'text-slate-500' : 'text-gray-500'}`}>{p.description}</p>
                      <code className={`text-[10px] px-2 py-1 rounded block truncate ${darkMode ? 'text-emerald-400 bg-emerald-950/30' : 'text-emerald-700 bg-emerald-50'}`}>{p.demo_url}</code>
                    </div>
                    <div className="flex md:flex-col gap-2 shrink-0">
                      <button onClick={() => startEdit(p)} className={`flex-1 px-4 py-2 text-xs rounded-lg transition-colors ${darkMode ? 'bg-slate-800 hover:bg-slate-700' : 'bg-gray-100 hover:bg-gray-200'}`}>Edit</button>
                      <button onClick={() => handleDelete(p.id)} className="flex-1 px-4 py-2 bg-red-950/20 hover:bg-red-950/40 text-red-500 text-xs rounded-lg transition-colors">Hapus</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* CONTENT: BRANDING & SKILLS */}
        {activeTab === 'branding' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="lg:col-span-5 space-y-6">
              <div className={`p-6 rounded-2xl sticky top-6 border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200 shadow-sm'}`}>
                <h2 className="text-sm font-bold text-purple-500 mb-6">Pengaturan Profil & Skills</h2>
                
                {/* PHOTO UPLOAD */}
                <div className="mb-6 flex flex-col items-center">
                  <div className="relative group w-32 h-32 mb-3">
                    {branding.photo_url ? (
                      <img src={branding.photo_url} alt="Profile" className="w-full h-full rounded-full object-cover border-4 border-purple-500/20 shadow-xl" />
                    ) : (
                      <div className={`w-full h-full rounded-full border-2 border-dashed flex items-center justify-center text-xs ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-gray-100 border-gray-300'}`}>No Photo</div>
                    )}
                    <label className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                      <input type="file" accept="image/*" onChange={handlePhotoUpload} disabled={uploading} className="hidden" />
                      <span className="text-white text-xs font-bold">{uploading ? 'Uploading...' : 'Ganti Foto'}</span>
                    </label>
                    {branding.photo_url && !uploading && (
                      <button onClick={removePhoto} className="absolute -bottom-1 -right-1 bg-red-500 text-white w-8 h-8 rounded-full flex items-center justify-center text-xs shadow-lg hover:bg-red-600">✕</button>
                    )}
                  </div>
                  <p className="text-[10px] opacity-60 text-center">Disimpan di Supabase Storage</p>
                </div>

                {/* BIO */}
                <div className="mb-6 space-y-2">
                  <label className="text-[10px] font-bold uppercase opacity-70">Deskripsi Diri</label>
                  <textarea 
                    value={branding.description} 
                    onChange={(e) => setBranding({...branding, description: e.target.value})}
                    onBlur={() => saveBrandingToDb(branding)}
                    className={`w-full rounded-lg px-4 py-3 text-sm h-32 resize-none outline-none transition-colors border ${darkMode ? 'bg-slate-950 border-slate-700 focus:border-purple-500' : 'bg-gray-50 border-gray-300 focus:border-purple-500'}`}
                    placeholder="Tulis bio singkat..."
                  />
                </div>

                {/* LANGUAGE TOGGLE */}
                <div className={`p-4 rounded-xl border mb-6 space-y-4 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold">Aktifkan Multi-Bahasa?</span>
                    <button 
                      onClick={() => {
                        const newData = {...branding, is_multi_language: !branding.is_multi_language};
                        setBranding(newData);
                        saveBrandingToDb(newData);
                      }}
                      className={`w-11 h-6 rounded-full relative transition-colors ${branding.is_multi_language ? 'bg-purple-500' : 'bg-gray-400'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${branding.is_multi_language ? 'left-6' : 'left-1'}`} />
                    </button>
                  </div>
                  {branding.is_multi_language && (
                    <select 
                      value={branding.secondary_lang}
                      onChange={(e) => {
                        const newData = {...branding, secondary_lang: e.target.value};
                        setBranding(newData);
                        saveBrandingToDb(newData);
                      }}
                      className={`w-full rounded-lg px-3 py-2 text-xs outline-none border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-300'}`}
                    >
                      <option value="en">English</option>
                      <option value="jp">Japanese</option>
                      <option value="cn">Chinese</option>
                    </select>
                  )}
                </div>

                {/* SKILLS MANAGER */}
                <div className={`p-4 rounded-xl border space-y-4 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-gray-50 border-gray-200'}`}>
                  <h3 className="text-xs font-bold uppercase opacity-70">Manajemen Skills</h3>
                  
                  {/* Hard Skills */}
                  <div>
                    <label className="text-[10px] font-bold text-teal-500 uppercase mb-1 block">Hard Skills</label>
                    <div className="flex gap-2 mb-2">
                      <input value={newHardSkill} onChange={(e) => setNewHardSkill(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addHardSkill()} placeholder="Contoh: React, Figma..." className={`flex-1 rounded-lg px-3 py-1.5 text-xs outline-none border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-300'}`} />
                      <button onClick={addHardSkill} className="bg-teal-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold">+</button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {skills.hard.map(s => (
                        <span key={s} className="inline-flex items-center gap-1 bg-teal-900/30 text-teal-400 border border-teal-800/50 px-2 py-0.5 rounded text-[10px]">
                          {s} <button onClick={() => removeHardSkill(s)} className="hover:text-red-400">×</button>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Soft Skills */}
                  <div>
                    <label className="text-[10px] font-bold text-purple-500 uppercase mb-1 block">Soft Skills</label>
                    <div className="flex gap-2 mb-2">
                      <input value={newSoftSkill} onChange={(e) => setNewSoftSkill(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addSoftSkill()} placeholder="Contoh: Leadership..." className={`flex-1 rounded-lg px-3 py-1.5 text-xs outline-none border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-300'}`} />
                      <button onClick={addSoftSkill} className="bg-purple-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold">+</button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {skills.soft.map(s => (
                        <span key={s} className="inline-flex items-center gap-1 bg-purple-900/30 text-purple-400 border border-purple-800/50 px-2 py-0.5 rounded text-[10px]">
                          {s} <button onClick={() => removeSoftSkill(s)} className="hover:text-red-400">×</button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* PREVIEW */}
            <div className="lg:col-span-7">
              <div className={`p-8 rounded-2xl min-h-[400px] flex flex-col items-center justify-center text-center space-y-6 border ${darkMode ? 'bg-gradient-to-br from-slate-900 to-purple-950/10 border-purple-900/20' : 'bg-gradient-to-br from-white to-purple-50 border-purple-200'}`}>
                {branding.photo_url ? (
                  <img src={branding.photo_url} className="w-40 h-40 rounded-full object-cover border-4 border-purple-500/30 shadow-2xl" alt="Preview" />
                ) : (
                  <div className={`w-40 h-40 rounded-full border-2 border-dashed flex items-center justify-center ${darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-gray-100 border-gray-300'}`} />
                )}
                
                <div className="max-w-md space-y-2">
                  <h3 className="text-2xl font-bold">About Me</h3>
                  <p className={`text-sm leading-relaxed whitespace-pre-wrap ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                    {branding.description || "Bio Anda akan muncul di sini..."}
                  </p>
                </div>

                {/* Preview Skills */}
                {(skills.hard.length > 0 || skills.soft.length > 0) && (
                  <div className="w-full max-w-md pt-4 border-t border-slate-800/20 space-y-3">
                    {skills.hard.length > 0 && (
                      <div>
                        <p className="text-[10px] font-bold text-teal-500 uppercase mb-1.5">Hard Skills</p>
                        <div className="flex flex-wrap justify-center gap-1.5">
                          {skills.hard.map(s => <span key={s} className="bg-teal-900/30 text-teal-400 border border-teal-800/50 px-2 py-0.5 rounded text-[10px]">{s}</span>)}
                        </div>
                      </div>
                    )}
                    {skills.soft.length > 0 && (
                      <div>
                        <p className="text-[10px] font-bold text-purple-500 uppercase mb-1.5">Soft Skills</p>
                        <div className="flex flex-wrap justify-center gap-1.5">
                          {skills.soft.map(s => <span key={s} className="bg-purple-900/30 text-purple-400 border border-purple-800/50 px-2 py-0.5 rounded text-[10px]">{s}</span>)}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* CONTENT: TUTORIAL */}
        {activeTab === 'tutorial' && (
          <div className={`rounded-2xl p-8 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200 shadow-sm'}`}>
            <h2 className="text-2xl font-bold text-emerald-500 mb-6">Panduan Autoplay Plugin</h2>
            <div className="space-y-8">
              <div className="space-y-3">
                <h3 className="font-bold flex items-center gap-2"><span className="bg-emerald-900/50 text-emerald-400 w-6 h-6 rounded-full flex items-center justify-center text-xs">1</span> Copy Script</h3>
                <div className={`rounded-xl border overflow-hidden ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-gray-50 border-gray-200'}`}>
                  <div className={`flex justify-between items-center px-4 py-2 border-b ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-gray-100 border-gray-200'}`}>
                    <span className="text-[10px] font-mono opacity-60">autoplay-plugin.js</span>
                    <button onClick={() => handleCopy(pluginCode, 't1')} className="text-[10px] text-emerald-500 hover:text-emerald-400">{copiedId === 't1' ? '✓ Copied' : 'Copy'}</button>
                  </div>
                  <pre className={`p-4 text-xs font-mono overflow-x-auto max-h-48 ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>{pluginCode}</pre>
                </div>
              </div>
              
              <div className="space-y-3">
                <h3 className="font-bold flex items-center gap-2"><span className="bg-emerald-900/50 text-emerald-400 w-6 h-6 rounded-full flex items-center justify-center text-xs">2</span> Format URL Roles</h3>
                <div className={`grid gap-2 text-xs font-mono p-4 rounded-xl border ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-gray-50 border-gray-200 text-gray-600'}`}>
                  <div><span className="text-emerald-500 block mb-1">4 Layar:</span> ?roles=marketing,engineering,direktur,purchasing</div>
                  <div><span className="text-blue-500 block mb-1">1 Layar:</span> ?role=marketing</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}