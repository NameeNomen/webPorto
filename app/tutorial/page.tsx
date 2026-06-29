'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

type Message = {
  id: number;
  sender: 'bot' | 'user';
  text: string;
};

export default function TutorialChat() {
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, sender: 'bot', text: 'Halo! Ada kendala apa pas pasang sistem Autoplay? (Ketik: "login muter", "script php", atau "404")' }
  ]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = input.trim();
    setMessages(prev => [...prev, { id: Date.now(), sender: 'user', text: userMsg }]);
    setInput('');

    setTimeout(() => {
      botLogic(userMsg.toLowerCase());
    }, 600);
  };

  const botLogic = (text: string) => {
    let botReply = "Sorry bro, gue gak nangkep. Coba ketik 'login muter', 'script php', atau '404'.";

    // --- KASUS: SCRIPT KHUSUS PHP NATIVE ---
    if (text.match(/php|native|autoplay|script/i)) {
      botReply = `Ini full code 'autoplay-plugin.js' khusus PHP Native (Admin Panel) dengan fitur Anti-Muter.

Buat file baru, copas ini, lalu panggil pakai <script src="autoplay-plugin.js"></script> sebelum tag </body> di semua halaman lu.

\`\`\`javascript
document.addEventListener("DOMContentLoaded", function() {
    const urlParams = new URLSearchParams(window.location.search);
    let currentRole = urlParams.get('role');
    if (!currentRole) currentRole = sessionStorage.getItem('bot_active_role');
    if (!currentRole) return;

    // Rute sesuai file PHP lu
    const credentials = {
        'admin': { 
            user: 'admin', pass: 'admin123', 
            tour: [
                'dashboard.php', 
                'page/karyawan/list.php', 
                'page/jabatan/list.php', 
                'page/departement/list.php'
            ] 
        }
    };

    const activeAccount = credentials[currentRole.toLowerCase()];
    if (!activeAccount) return;

    // DETEKSI LOGIKA ANTI-MUTER: Cek kalau URL ada tulisan 'login.php'
    const isLoginPage = window.location.href.includes('login.php');

    if (isLoginPage) {
        sessionStorage.setItem('bot_active_role', currentRole.toLowerCase());
        sessionStorage.setItem('bot_tour_step', '0');

        const interval = setInterval(() => {
            const user = document.querySelector('input[name*="user"], input[type="text"]');
            const pass = document.querySelector('input[name*="pass"], input[type="password"]');
            const btn = document.querySelector('button[type="submit"], input[type="submit"]');

            if (user && pass && btn) {
                clearInterval(interval);
                user.value = activeAccount.user;
                pass.value = activeAccount.pass;
                user.dispatchEvent(new Event('input', { bubbles: true }));
                pass.dispatchEvent(new Event('input', { bubbles: true }));
                setTimeout(() => btn.click(), 800);
            }
        }, 500);
    } else {
        // LOGIKA TOUR KALAU SUDAH DI DALAM APLIKASI
        let currentStep = parseInt(sessionStorage.getItem('bot_tour_step') || '0');
        let tourPaths = activeAccount.tour;

        if (currentStep < tourPaths.length) {
            setTimeout(() => {
                sessionStorage.setItem('bot_tour_step', currentStep + 1);
                window.location.href = tourPaths[currentStep];
            }, 3000); // Pindah halaman tiap 3 detik
        } else {
            sessionStorage.removeItem('bot_active_role');
        }
    }
});
\`\`\``;
    } 
    
    // --- KASUS: LOGIN MUTER TERUS ---
    else if (text.match(/muter|login|session|cookie/i)) {
      botReply = `Kalau login muter terus di PHP, biasanya karena dua hal:

1. Lu lupa pasang "session_start();" di baris paling atas PHP lu.
2. Bot lu bingung bedain halaman login sama dashboard. 

Solusinya: Pakai script JS yang ada deteksi "window.location.href.includes('login.php')". Ketik "script php" buat minta kodenya.`;
    } 
    
    // --- KASUS: ERROR 404 ---
    else if (text.match(/404|not found|nyasar/i)) {
      botReply = `Error 404 artinya browser lu gak nemu file PHP-nya saat tour berjalan.

Cek list URL di dalam array 'tour'. Pastikan jalurnya benar dari root.
Contoh: 'page/karyawan/list.php' (Jangan sampai salah ketik folder).`;
    }

    setMessages(prev => [...prev, { id: Date.now(), sender: 'bot', text: botReply }]);
  };

  return (
    <main className="min-h-screen bg-slate-950 flex flex-col items-center p-6 text-slate-100 font-sans">
      <div className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col h-[85vh] shadow-2xl">
        <div className="bg-slate-950 p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-900 text-teal-400 rounded-full flex items-center justify-center font-bold text-xl border border-teal-700">A</div>
            <div>
              <h2 className="font-bold text-teal-400">Autoplay Bot</h2>
              <p className="text-xs text-slate-500">Asisten Integrasi PHP Native</p>
            </div>
          </div>
          <Link href="/dashboard-admin" className="text-xs bg-slate-800 px-4 py-2 rounded-lg text-slate-300 hover:text-white transition-colors">
            Kembali
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[90%] p-4 rounded-xl text-sm leading-relaxed ${
                msg.sender === 'user' 
                  ? 'bg-teal-700 text-white rounded-br-none shadow-md' 
                  : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-bl-none font-mono whitespace-pre-wrap shadow-md'
              }`}>
                {msg.text}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSend} className="bg-slate-950 p-4 border-t border-slate-800 flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ketik 'script php' atau 'login muter' di sini..."
            className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-teal-500 transition-colors"
          />
          <button type="submit" className="bg-teal-600 hover:bg-teal-500 text-white px-6 py-3 rounded-lg text-sm font-bold transition-transform active:scale-95">
            Kirim
          </button>
        </form>
      </div>
    </main>
  );
}