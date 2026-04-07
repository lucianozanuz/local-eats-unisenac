// auth.js
// Script para validar sessão e alterar o cabeçalho base de usuário

function checkAuth(requireLogin = true) {
    const userId = localStorage.getItem("userId");
    const userName = localStorage.getItem("userName");

    const isLoginPage = window.location.pathname.endsWith('login.html');

    if (requireLogin && !userId && !isLoginPage) {
        window.location.href = "login.html";
        return;
    }

    if (userId && isLoginPage) {
        window.location.href = "index.html";
        return;
    }

    // Configura UI badge no header se existir
    const userBadge = document.getElementById("userBadge");
    if (userBadge) {
        if (userId) {
            userBadge.innerHTML = `
                <i class="ri-user-smile-fill"></i> Olá, ${userName.split(' ')[0]}
                <i class="ri-logout-box-r-line" style="margin-left:8px;" id="logoutBtn" title="Sair"></i>
            `;
            setTimeout(() => {
                const logoutBtn = document.getElementById('logoutBtn');
                if(logoutBtn) {
                    logoutBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        localStorage.removeItem("userId");
                        localStorage.removeItem("userName");
                        window.location.href = "login.html";
                    });
                }
            }, 100);
        } else {
            userBadge.innerHTML = `<i class="ri-user-smile-line"></i> Entrar`;
            userBadge.addEventListener('click', () => { window.location.href = "login.html"; });
        }
    }
}

// Executar ao carregar a página
document.addEventListener('DOMContentLoaded', () => {
    // A página index pode ser visitada sem auth longo prazo? 
    // Para nosso teste na aula, vamos forçar login em tudo, mas a index principal deixarei livre?
    // O backend atual bloqueou o mock no index inteiro?
    // Pra simplificar, barra todo mundo que não tiver userId para /login.html
    checkAuth(true); 
});
