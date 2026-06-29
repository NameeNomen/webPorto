/**
 * AUTOPLAY PORTFOLIO PLUGIN (Universal JS)
 * Taruh script ini di halaman login / landing page projek target.
 */
document.addEventListener("DOMContentLoaded", function() {
    // 1. Ambil data role dari URL parameter (?role=admin atau ?role=hrd)
    const urlParams = new URLSearchParams(window.location.search);
    const currentRole = urlParams.get('role');

    // Jika tidak ada parameter role, script ini tidur (gak bakal ganggu user asli)
    if (!currentRole) return; 

    console.log("Autoplay System Active for Role: " + currentRole);

    // 2. Mapping Akun Demo (Silakan minta pembeli lu buat ganti data ini sesuai akun mereka)
    const credentials = {
        'admin': { email: 'admin.demo@gmail.com', pass: 'admin123' },
        'hrd':   { email: 'hrd.demo@gmail.com', pass: 'hrd123' },
        'manager': { email: 'manager.demo@gmail.com', pass: 'manager123' },
        'user':  { email: 'user.demo@gmail.com', pass: 'user123' }
    };

    const activeAccount = credentials[currentRole.toLowerCase()];
    if (!activeAccount) return;

    // 3. Auto-detect selector Input Field secara pintar (Universal untuk berbagai template)
    setTimeout(() => {
        const emailInput = document.querySelector('input[type="email"]') || 
                           document.querySelector('input[name*="user"]') || 
                           document.querySelector('input[name*="email"]');
                           
        const passwordInput = document.querySelector('input[type="password"]') || 
                              document.querySelector('input[name*="pass"]');
                              
        const loginForm = document.querySelector('form');
        const submitButton = document.querySelector('button[type="submit"]') || 
                             document.querySelector('input[type="submit"]');

        if (emailInput && passwordInput) {
            // Efek ngetik otomatis (Biar HRD terpukau)
            emailInput.value = activeAccount.email;
            passwordInput.value = activeAccount.pass;

            // Trigger event input biar framework modern kayak React/Vue peka kalau formnya udah keisi
            emailInput.dispatchEvent(new Event('input', { bubbles: true }));
            passwordInput.dispatchEvent(new Event('input', { bubbles: true }));

            // 4. Eksekusi klik tombol login setelah delay 1.5 detik
            setTimeout(() => {
                // Simpan status di localStorage biar di halaman dashboard simulasinya bisa lanjut
                localStorage.setItem('autoplay_role', currentRole);
                
                if (submitButton) {
                    submitButton.click();
                } else if (loginForm) {
                    loginForm.submit();
                }
            }, 1500);
        }
    }, 1000); // Delay inisiasi awal 1 detik pas halaman kebuka
});