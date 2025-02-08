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

    // ------- Página Agendar
    $(".opcoes__servicos--corte__feminino").hide();
    $(".opcoes__servicos--corte__masculino").hide();
    $(".opcoes__servicos--tintura").hide();
    $(".horario__incorreto").hide();

    $.datepicker.setDefaults($.datepicker.regional['pt-BR']);

    $('.custom-control-input').on("change", function(){
        let id = this.id;
        let classeAlterada = `.opcoes__servicos--${id}`;

        if($(this).is(':checked')) {            
            $(classeAlterada).show();
        } else {
            $(classeAlterada).hide();
        }
    });

    $('.escolha__horario').on("change", function(){
        let horario = this.value;
        let horarioMinino = '08:00';
        let horarioMaximo = '18:00';

        if(horario < horarioMinino || horario >= horarioMaximo) {
            $(".horario__incorreto").show();
            this.value = "";
        } else {
            $(".horario__incorreto").hide();
        }
    });

    $('.datepicker').datepicker({
        showAnim: 'fadeIn',  
        firstDay: 0,       
        changeMonth: true,  
        changeYear: false,    
        minDate: 0,   // não permite selecionar datas passadas      
        maxDate: "+5M +10D",
        beforeShowDay: function (date) {
            var day = date.getDay();
            return [day !== 0 && day !== 1]; // 0 = domingo, 1 = segunda
        }
    });


});