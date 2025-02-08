$(function() {
    console.log('Renderer carregado. window.electronAPI:', window.electronAPI);
    console.log('jQuery carregado:', typeof $ !== 'undefined');

    $("#usuario__incorreto").hide();
    $('.acesso').on("submit", async function(event) {
        event.preventDefault();

        const CPFUsuario = $('#acesso__login--CPF').val(); 
        const senhaUsuario = $('#acesso__login--Senha').val(); 

        try {
            const usuarioEncontrado = await window.electronAPI.buscarUsuario(CPFUsuario, senhaUsuario);

            if(usuarioEncontrado) {
                console.log(`Usuário ${CPFUsuario} e/ou senha encontrado`);
                $("#usuario__incorreto").hide();
                window.location.href = 'agendar.html'; 
            } else {
                console.log(`Usuário ${CPFUsuario} e/ou senha não encontrado`);
                $("#usuario__incorreto").show();
            }
        } catch (error) {
            console.log('Erro ao encontrar o usuário: ', error);
        }
    });

    // Trocar de Página
    $("#paginaAgendar").on("click", function(){
        window.location.href = 'agendar.html'; 
    });

    $("#paginaProximos").on("click", function(){
        window.location.href = 'proximosagendamentos.html'; 
    });

    $("#paginaHistorico").on("click", function(){
        window.location.href = 'historico.html'; 
    });

    // Agendar
    
});