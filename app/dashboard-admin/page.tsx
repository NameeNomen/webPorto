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
  translations?: {
    en?: { title: string; description: string; tech_stack: string };
  };
}

interface PersonalBranding {
  photoUrl: string | null;
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
  
  // State untuk Personal Branding (LocalStorage)
  const [branding, setBranding] = useState<PersonalBranding>({
    photoUrl: null,
    description: '',
    isMultiLanguage: false,
    secondaryLang: 'en'
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // State untuk Edit Translations (Bahasa Lain)
  const [transTitle, setTransTitle] = useState('');
  const [transDesc, setTransDesc] = useState('');
  const [transTech, setTransTech] = useState('');

  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login-admin');
      } else {
        fetchProjects();
        loadLocalBranding();
      }
    };
    checkUser();
  }, [router]);

  // --- LOGIKA LOCAL STORAGE BRANDING ---
  const loadLocalBranding = () => {
    const saved = localStorage.getItem('user_personal_branding');
    if (saved) {
      setBranding(JSON.parse(saved));
    }
  };

  const saveLocalBranding = (newData: Partial<PersonalBranding>) => {
    const updated = { ...branding, ...newData };
    setBranding(updated);
    localStorage.setItem('user_personal_branding', JSON.stringify(updated));
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // Preview sementara menggunakan URL object
      const objectUrl = URL.createObjectURL(file);
      saveLocalBranding({ photoUrl: objectUrl });
    }
  };

  const removePhoto = () => {
    saveLocalBranding({ photoUrl: null });
    setSelectedFile(null);
  };

  // --- LOGIKA DATABASE PROJEK ---
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
    
    // Siapkan data dasar
    const projectData: any = {
      title,
      description,
      tech_stack: techStack,
      demo_url: demoUrl,
    };

    // Jika mode multi-language aktif dan sedang edit/tambah dengan terjemahan
    if (branding.isMultiLanguage && (transTitle || transDesc)) {
      projectData.translations = {
        [branding.secondaryLang]: {
          title: transTitle || title,
          description: transDesc || description,
          tech_stack: transTech || techStack
        }
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
    setTitle('');
    setDescription('');
    setTechStack('');
    setDemoUrl('');
    setTransTitle('');
    setTransDesc('');
    setTransTech('');
  };

  const handleDelete = async (id: string) => {
    if (confirm('Yakin mau hapus projek ini?')) {
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
    
    // Load translations jika ada
    if (project.translations && project.translations[branding.secondaryLang]) {
      const t = project.translations[branding.secondaryLang];
      setTransTitle(t.title);
      setTransDesc(t.description);
      setTransTech(t.tech_stack);
    } else {
      setTransTitle('');
      setTransDesc('');
      setTransTech('');
    }
    
    setActiveTab('manage');
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

  // Plugin Code Constants (Tetap sama seperti sebelumnya)
  const pluginCode = `document.addEventListener("DOMContentLoaded", function() {
    const urlParams = new URLSearchParams(window.location.search);
    const currentRole = urlParams.get('role');
    if (!currentRole) return;
    console.log("Autoplay Active for Role: " + currentRole);
    const credentials = {
        'marketing':   { username: 'marketing', pass: 'marketing123' },
        'engineering': { username: 'engineering', pass: 'marketing123' },
        'direktur':    { username: 'direktur', pass: 'marketing123' },
        'purchasing':  { username: 'purchasing', pass: 'marketing123' }
    };
    const activeAccount = credentials[currentRole.toLowerCase()];
    if (!activeAccount) return;
    setTimeout(() => {
        const userInput = document.querySelector('input[type="email"]') ||
                          document.querySelector('input[name*="user"]') ||
                          document.querySelector('input[name*="email"]') ||
                          document.querySelector('input[type="text"]');
        const passwordInput = document.querySelector('input[type="password"]') ||
                              document.querySelector('input[name*="pass"]');
        const loginForm = document.querySelector('form');
        const submitButton = document.querySelector('button[type="submit"]') ||
                             document.querySelector('input[type="submit"]');
        if (userInput && passwordInput) {
            userInput.value = activeAccount.username;
            passwordInput.value = activeAccount.pass;
            userInput.dispatchEvent(new Event('input', { bubbles: true }));
            passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
            setTimeout(() => {
                localStorage.setItem('autoplay_role', currentRole);
                if (submitButton) {
                    submitButton.click();
                } else if (loginForm) {
                    loginForm.submit();
                }
            }, 1500);
        }
    }, 1000);
});`;

  const htmlCode = `    <script src="autoplay-plugin.js"></script>
</body>`;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-teal-400 font-mono">
        MEMUAT SISTEM ADMIN...
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-6 font-sans">
      <div className="max-w-7xl mx-auto">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center border-b border-slate-800 pb-5 mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-teal-400">Admin Control Panel</h1>
            <p className="text-sm text-slate-500 mt-1">Sistem manajemen portofolio & personal branding.</p>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-950/40 border border-red-900/50 hover:bg-red-900 text-red-400 text-sm rounded-xl transition-colors self-start md:self-auto"
          >
            Logout
          </button>
        </div>

        {/* MENU TAB */}
        <div className="flex flex-col md:flex-row gap-4 mb-10 bg-slate-900/50 p-3 rounded-2xl w-full border-2 border-dashed border-slate-700">
          <button
            onClick={() => setActiveTab('manage')}
            className={`flex-1 py-4 text-sm font-bold rounded-xl transition-all duration-300 ${
              activeTab === 'manage'
                ? 'bg-teal-500 text-slate-950 shadow-[0_0_15px_rgba(20,184,166,0.4)] scale-[1.02]'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            📦 KELOLA DATA PROJEK
          </button>
          <button
            onClick={() => setActiveTab('branding')}
            className={`flex-1 py-4 text-sm font-bold rounded-xl transition-all duration-300 ${
              activeTab === 'branding'
                ? 'bg-purple-500 text-slate-950 shadow-[0_0_15px_rgba(168,85,247,0.4)] scale-[1.02]'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            👤 PERSONAL BRANDING
          </button>
          <button
            onClick={() => setActiveTab('tutorial')}
            className={`flex-1 py-4 text-sm font-bold rounded-xl transition-all duration-300 ${
              activeTab === 'tutorial'
                ? 'bg-emerald-500 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.4)] scale-[1.02]'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            ⚙️ PANDUAN INTEGRASI PLUGIN
          </button>
        </div>

        {/* KONTEN */}
        {activeTab === 'manage' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 animate-fadeIn">
            {/* Form Input Data */}
            <div className="lg:col-span-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl h-fit sticky top-6">
              <h2 className="text-sm font-bold text-slate-300 mb-6 border-b border-slate-800 pb-3">
                {editingId ? '⚡ Mode Edit Projek' : '➕ Tambah Projek Baru'}
              </h2>
              
              {/* Toggle Multi-Language Info */}
              {branding.isMultiLanguage && (
                <div className="mb-4 p-3 bg-purple-900/20 border border-purple-500/30 rounded-xl">
                  <p className="text-xs text-purple-300 font-bold mb-1">🌍 Mode Multi-Bahasa Aktif ({branding.secondaryLang.toUpperCase()})</p>
                  <p className="text-[10px] text-slate-400">Isi form di bawah dengan bahasa utama, lalu isi kolom terjemahan di bagian bawah form.</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">JUDUL APLIKASI</label>
                  <input
                    type="text" required value={title} onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-teal-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">DESKRIPSI SINGKAT</label>
                  <textarea
                    required value={description} onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-teal-500 h-28 resize-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">TEKNOLOGI (Pisahkan koma)</label>
                  <input
                    type="text" required value={techStack} onChange={(e) => setTechStack(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-teal-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1 font-bold text-emerald-400">URL DEMO & SETTING LAYAR</label>
                  <input
                    type="text" required value={demoUrl} onChange={(e) => setDemoUrl(e.target.value)}
                    className="w-full bg-slate-950 border border-emerald-900/50 rounded-xl px-4 py-3 text-sm text-emerald-100 focus:outline-none focus:border-emerald-500 transition-colors"
                    placeholder="https://web.com/login?roles=marketing,direktur"
                  />
                </div>

                {/* Bagian Terjemahan (Muncul jika Multi-language aktif) */}
                {branding.isMultiLanguage && (
                  <div className="pt-4 border-t border-slate-800 space-y-4">
                    <h3 className="text-xs font-bold text-purple-400 uppercase tracking-wider">Terjemahan ({branding.secondaryLang.toUpperCase()})</h3>
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-1">Judul ({branding.secondaryLang})</label>
                      <input
                        type="text" value={transTitle} onChange={(e) => setTransTitle(e.target.value)}
                        className="w-full bg-slate-950 border border-purple-900/50 rounded-xl px-4 py-2 text-sm text-purple-100 focus:outline-none focus:border-purple-500 transition-colors"
                        placeholder={`Translate title to ${branding.secondaryLang}`}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-1">Deskripsi ({branding.secondaryLang})</label>
                      <textarea
                        value={transDesc} onChange={(e) => setTransDesc(e.target.value)}
                        className="w-full bg-slate-950 border border-purple-900/50 rounded-xl px-4 py-2 text-sm text-purple-100 focus:outline-none focus:border-purple-500 h-20 resize-none transition-colors"
                        placeholder={`Translate description to ${branding.secondaryLang}`}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-1">Teknologi ({branding.secondaryLang})</label>
                      <input
                        type="text" value={transTech} onChange={(e) => setTransTech(e.target.value)}
                        className="w-full bg-slate-950 border border-purple-900/50 rounded-xl px-4 py-2 text-sm text-purple-100 focus:outline-none focus:border-purple-500 transition-colors"
                        placeholder={`Translate tech stack to ${branding.secondaryLang}`}
                      />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold py-3 rounded-xl text-sm transition-colors mt-4"
                >
                  {editingId ? 'Simpan Perubahan' : 'Publish Projek'}
                </button>
                {editingId && (
                  <button
                    type="button" onClick={() => { setEditingId(null); resetForm(); }}
                    className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 py-3 rounded-xl text-xs transition-colors mt-2"
                  >
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
                  <div key={proj.id} className="bg-slate-900 border border-slate-700 p-5 rounded-2xl flex flex-col justify-between md:flex-row md:items-start gap-4 hover:border-teal-900 transition-colors">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-teal-300 text-lg">{proj.title}</h3>
                        {proj.translations && Object.keys(proj.translations).length > 0 && (
                          <span className="bg-purple-900/50 text-purple-300 text-[10px] px-2 py-0.5 rounded-full border border-purple-700/50">
                            Multi-lang
                          </span>
                        )}
                      </div>
                      <p className="text-slate-400 text-sm line-clamp-2">{proj.description}</p>
                      <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 mt-2 overflow-hidden">
                        <p className="text-emerald-500 text-[11px] font-mono truncate">{proj.demo_url}</p>
                      </div>
                    </div>
                    <div className="flex md:flex-col gap-2 shrink-0">
                      <button
                        onClick={() => startEdit(proj)}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 text-xs rounded-xl transition-colors w-full text-center"
                      >
                        Ubah
                      </button>
                      <button
                        onClick={() => handleDelete(proj.id)}
                        className="px-4 py-2 bg-red-950/40 hover:bg-red-900/60 border border-red-900/50 text-red-400 text-xs rounded-xl transition-colors w-full text-center"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : activeTab === 'branding' ? (
          /* ==================== PERSONAL BRANDING SECTION ==================== */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 animate-fadeIn">
            {/* Form Personal Branding */}
            <div className="lg:col-span-5 bg-slate-900 border border-slate-800 p-6 rounded-2xl h-fit sticky top-6">
              <h2 className="text-sm font-bold text-purple-400 mb-6 border-b border-slate-800 pb-3">
                👤 Kelola Personal Branding
              </h2>
              
              {/* Photo Upload Section */}
              <div className="mb-8">
                <label className="block text-xs text-slate-400 mb-2">FOTO PROFIL (Local Storage)</label>
                <div className="flex flex-col items-center gap-4">
                  <div className="relative group">
                    {branding.photoUrl ? (
                      <img 
                        src={branding.photoUrl} 
                        alt="Profile Preview" 
                        className="w-32 h-32 rounded-full object-cover border-4 border-purple-500/30 shadow-lg"
                      />
                    ) : (
                      <div className="w-32 h-32 rounded-full bg-slate-800 border-2 border-dashed border-slate-600 flex items-center justify-center">
                        <span className="text-slate-500 text-xs">No Photo</span>
                      </div>
                    )}
                    
                    {/* Overlay Controls */}
                    <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity gap-2">
                      <label className="cursor-pointer bg-white/20 hover:bg-white/40 p-2 rounded-full backdrop-blur-sm">
                        <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                      </label>
                      {branding.photoUrl && (
                        <button onClick={removePhoto} className="bg-red-500/80 hover:bg-red-600 p-2 rounded-full backdrop-blur-sm">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-500 text-center max-w-[200px]">
                    Foto disimpan di browser ini saja. Tidak diupload ke server.
                  </p>
                </div>
              </div>

              {/* Description */}
              <div className="mb-6">
                <label className="block text-xs text-slate-400 mb-1">DESKRIPSI DIRI</label>
                <textarea
                  value={branding.description}
                  onChange={(e) => saveLocalBranding({ description: e.target.value })}
                  placeholder="Ceritakan tentang diri Anda..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-purple-500 h-32 resize-none transition-colors"
                />
              </div>

              {/* Language Settings */}
              <div className="mb-6 p-4 bg-slate-950 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between mb-4">
                  <label className="text-xs font-bold text-slate-300">AKTIFKAN MULTI-BAHASA?</label>
                  <button 
                    onClick={() => saveLocalBranding({ isMultiLanguage: !branding.isMultiLanguage })}
                    className={`w-12 h-6 rounded-full transition-colors relative ${branding.isMultiLanguage ? 'bg-purple-500' : 'bg-slate-700'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${branding.isMultiLanguage ? 'left-7' : 'left-1'}`}></div>
                  </button>
                </div>

                {branding.isMultiLanguage && (
                  <div className="animate-fadeIn">
                    <label className="block text-[10px] text-slate-500 mb-1">PILIH BAHASA TAMBAHAN</label>
                    <select 
                      value={branding.secondaryLang}
                      onChange={(e) => saveLocalBranding({ secondaryLang: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-purple-500"
                    >
                      <option value="en">English (Inggris)</option>
                      <option value="jp">Japanese (Jepang)</option>
                      <option value="cn">Chinese (Mandarin)</option>
                      <option value="ar">Arabic (Arab)</option>
                    </select>
                    <p className="text-[10px] text-purple-400 mt-2">
                      ℹ️ Saat aktif, form tambah/edit projek akan memiliki kolom tambahan untuk menerjemahkan konten.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Preview Section */}
            <div className="lg:col-span-7 space-y-4">
              <h2 className="text-sm font-bold text-slate-300 mb-6 border-b border-slate-800 pb-3">
                Preview Tampilan Publik
              </h2>
              
              <div className="bg-gradient-to-br from-slate-900 to-purple-950/20 border border-purple-800/30 p-8 rounded-2xl">
                <div className="flex flex-col md:flex-row gap-6 items-start">
                  {/* Profile Photo Preview */}
                  <div className="shrink-0">
                    {branding.photoUrl ? (
                      <img 
                        src={branding.photoUrl} 
                        alt="Profile" 
                        className="w-40 h-40 rounded-full object-cover border-4 border-purple-500/40 shadow-2xl"
                      />
                    ) : (
                      <div className="w-40 h-40 rounded-full bg-slate-800 border-2 border-dashed border-slate-600 flex items-center justify-center">
                        <span className="text-slate-500">Upload Foto</span>
                      </div>
                    )}
                  </div>

                  {/* Info Preview */}
                  <div className="flex-1 space-y-4">
                    <div>
                      <h3 className="text-2xl font-bold text-purple-300 mb-2">About Me</h3>
                      <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                        {branding.description || 'Belum ada deskripsi. Silakan tambahkan deskripsi diri Anda di panel sebelah kiri.'}
                      </p>
                    </div>

                    {/* Language Badge Preview */}
                    {branding.isMultiLanguage && (
                      <div className="inline-flex items-center gap-2 bg-purple-900/30 border border-purple-700/40 px-3 py-1.5 rounded-full">
                        <span className="text-xs text-purple-200">🌐 Available in: <span className="font-bold uppercase">{branding.secondaryLang}</span></span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Info Card */}
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
                <h4 className="text-sm font-bold text-slate-300 mb-3">ℹ️ Informasi Penyimpanan</h4>
                <ul className="text-xs text-slate-400 space-y-2">
                  <li>• <strong>Foto & Deskripsi:</strong> Disimpan di LocalStorage browser Anda. Data tidak akan hilang selama cache browser tidak dibersihkan.</li>
                  <li>• <strong>Privasi:</strong> Data personal branding ini hanya terlihat oleh Anda di device ini.</li>
                  <li>• <strong>Multi-language:</strong> Mengaktifkan fitur ini akan menambahkan kolom terjemahan pada setiap projek yang Anda buat/edit.</li>
                </ul>
              </div>
            </div>
          </div>
        ) : (
          /* ==================== AREA PANDUAN TUTORIAL ==================== */
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-4xl mx-auto animate-fadeIn">
            <h2 className="text-2xl font-bold text-emerald-400 mb-2">Panduan Autoplay Grid Multi-Role</h2>
            <p className="text-slate-400 text-sm mb-8">
              Gunakan panduan ini untuk mengaktifkan sistem grid dinamis di web target.
            </p>
            <div className="space-y-10">
              {/* STEP 1 */}
              <div className="relative">
                <div className="absolute -left-4 top-0 w-1 h-full bg-emerald-900 rounded-full"></div>
                <h3 className="text-lg font-bold text-slate-200 mb-3">1. Pasang File Konfigurasi Script</h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-4">
                  Buat file <code className="text-emerald-400 bg-slate-950 px-2 py-1 rounded">autoplay-plugin.js</code> di web target lu dan salin kode ini:
                </p>
                <div className="bg-slate-950 rounded-xl border border-slate-800 relative group overflow-hidden">
                  <div className="flex justify-between items-center bg-slate-900 px-4 py-2 border-b border-slate-800">
                    <span className="text-[10px] text-slate-500 font-mono">autoplay-plugin.js</span>
                    <button
                      onClick={() => handleCopy(pluginCode, 'step1')}
                      className="bg-emerald-950/50 hover:bg-emerald-900 border border-emerald-900/50 text-emerald-400 text-[10px] px-3 py-1.5 rounded transition-all"
                    >
                      {copiedId === 'step1' ? '✓ Disalin' : '📋 Copy'}
                    </button>
                  </div>
                  <pre className="p-5 text-xs font-mono text-slate-300 overflow-x-auto overflow-y-auto max-h-64 custom-scrollbar">
                    {pluginCode}
                  </pre>
                </div>
              </div>
              {/* STEP 2 */}
              <div className="relative">
                <div className="absolute -left-4 top-0 w-1 h-full bg-emerald-900 rounded-full"></div>
                <h3 className="text-lg font-bold text-slate-200 mb-3">2. Letakkan Script di Halaman Login</h3>
                <div className="bg-slate-950 rounded-xl border border-slate-800 relative group overflow-hidden">
                  <div className="flex justify-between items-center bg-slate-900 px-4 py-2 border-b border-slate-800">
                    <span className="text-[10px] text-slate-500 font-mono">Kode HTML/Blade</span>
                    <button
                      onClick={() => handleCopy(htmlCode, 'step2')}
                      className="bg-emerald-950/50 hover:bg-emerald-900 text-emerald-400 text-[10px] px-3 py-1.5 rounded"
                    >
                      {copiedId === 'step2' ? '✓ Disalin' : '📋 Copy'}
                    </button>
                  </div>
                  <pre className="p-4 text-sm font-mono text-emerald-400">
                    {htmlCode}
                  </pre>
                </div>
              </div>
              {/* STEP 3 */}
              <div className="relative">
                <div className="absolute -left-4 top-0 w-1 h-full bg-emerald-900 rounded-full"></div>
                <h3 className="text-lg font-bold text-slate-200 mb-3">3. Cara Nentuin Jumlah Layar di Dashboard (PENTING)</h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-4">
                  Sistem web induk lu bakal **otomatis bikin jumlah layar (grid) berdasarkan jumlah role yang lu pisah pakai koma** di form URL Demo.
                </p>
                <div className="grid gap-3 font-mono text-xs">
                  <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex flex-col gap-2">
                    <span className="text-emerald-400 font-bold">🟩 4 LAYAR SEKALIGUS (GRID 2x2):</span>
                    <span className="text-slate-400">Masukin 4 nama role lu dengan koma:</span>
                    <code className="text-white bg-slate-900 p-2 rounded border border-slate-700">https://web-klien.com/login?roles=marketing,engineering,direktur,purchasing</code>
                  </div>
                  <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex flex-col gap-2">
                    <span className="text-amber-400 font-bold">🟨 3 LAYAR SEKALIGUS:</span>
                    <span className="text-slate-400">Masukin 3 nama role aja:</span>
                    <code className="text-white bg-slate-900 p-2 rounded border border-slate-700">https://web-klien.com/login?roles=marketing,direktur,purchasing</code>
                  </div>
                  <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex flex-col gap-2">
                    <span className="text-blue-400 font-bold">🟦 2 LAYAR SEKALIGUS:</span>
                    <span className="text-slate-400">Masukin 2 nama role aja:</span>
                    <code className="text-white bg-slate-900 p-2 rounded border border-slate-700">https://web-klien.com/login?roles=direktur,engineering</code>
                  </div>
                  <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex flex-col gap-2">
                    <span className="text-slate-300 font-bold">⬜ 1 LAYAR PENUH (NORMAL):</span>
                    <span className="text-slate-400">Cukup masukin 1 nama role pakai 'role=' biasa (tanpa s):</span>
                    <code className="text-white bg-slate-900 p-2 rounded border border-slate-700">https://web-klien.com/login?role=marketing</code>
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