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
                sessionStorage.setItem('usuarioLogado', CPFUsuario);
                window.location.href = 'agendar.html'; 
            } else {
                console.log(`Usuário ${CPFUsuario} e/ou senha não encontrado`);
                $("#usuario__incorreto").show();
            }
        } catch (error) {
            console.log('Erro ao encontrar o usuário: ', error);
        }
    });

    // -------------- Trocar de Página
    $("#paginaAgendar").on("click", function(){
        window.location.href = 'agendar.html'; 
    });

    $("#paginaProximos").on("click", function(){
        window.location.href = 'proximosagendamentos.html'; 
    });

    $("#paginaHistorico").on("click", function(){
        window.location.href = 'historico.html'; 
    });

    // -------------- Página Agendar
    $(".opcoes__servicos--corte__feminino").hide();
    $(".opcoes__servicos--corte__masculino").hide();
    $(".opcoes__servicos--tintura").hide();
    $(".pendente__data--corte__feminino").hide();
    $(".pendente__data--corte__masculino").hide();
    $(".pendente__data--tintura").hide();
    $(".agendamento__sucesso").hide();
    
    $.datepicker.setDefaults($.datepicker.regional['pt-BR']);

    $('.custom-control-input').on("change", function(){
        let id = this.id;
        let classeAlterada = `.opcoes__servicos--${id}`;
        let esconderMensagem = `.pendente__data--${id}`;

        if($(this).is(':checked')) {            
            $(classeAlterada).show();
        } else {
            $(classeAlterada).hide();
            $(esconderMensagem).hide(); 
            $(".agendamento__sucesso").hide();        
        }
    });

    $('.datepicker').datepicker({
        showAnim: 'fadeIn',  
        firstDay: 0,       
        changeMonth: true,  
        changeYear: false,    
        minDate: 0,   // não permite selecionar datas passadas      
        maxDate: "+6M",
        beforeShowDay: function (date) {
            var day = date.getDay();
            return [day !== 0 && day !== 1]; // 0 = domingo, 1 = segunda
        }
    });

    $('.agendar').on("click", async function(event) {
        event.preventDefault();
        const usuarioLogado = sessionStorage.getItem('usuarioLogado');

        const selecionadoFeminino = $("#corte__feminino").is(':checked');
        const selecionadoMasculino = $("#corte__masculino").is(':checked');
        const selecionadoTintura = $("#tintura").is(':checked');

        let validacao = true;

        const verificarData = (selecionado, datepicker, mensagem) => {
            if(selecionado) {
                if($(datepicker).val() == ""){
                    $(mensagem).show();
                    validacao = false;
                } else {
                    $(mensagem).hide();
                }
            }
        };

        verificarData(selecionadoFeminino, "#datepickerfeminino", ".pendente__data--corte__feminino");
        verificarData(selecionadoMasculino, "#datepickermasculino", ".pendente__data--corte__masculino");
        verificarData(selecionadoTintura, "#datepickertintura", ".pendente__data--tintura");   
        
        if (!validacao) {
            console.log("Datas não preenchidas");
            return;
        }        

        if (selecionadoFeminino && validacao) {
            const dataCorteFeminino = $('#datepickerfeminino').val(); 
            const horaCorteFeminino = $('#horario__feminino').val(); 

            await window.electronAPI.inserirAgendamento(usuarioLogado, dataCorteFeminino, horaCorteFeminino, 'CORTEFEM'); // Corte Feminino
            console.log("Dados do corte feminino enviados!");
            $(".agendamento__sucesso").show();
        }

        if (selecionadoMasculino && validacao) {
            const dataCorteMasculino = $('#datepickermasculino').val(); 
            const horaCorteMasculino = $('#horario__masculino').val(); 
            await window.electronAPI.inserirAgendamento(usuarioLogado, dataCorteMasculino, horaCorteMasculino, 'CORTEMASC'); // Corte Masculino
            console.log("Dados do corte masculino enviados!");
            
            $(".agendamento__sucesso").show();
        }

        if (selecionadoTintura && validacao) {
            const dataCorteTintura = $('#datepickertintura').val(); 
            const horaCorteTintura = $('#horario__tintura').val(); 

            await window.electronAPI.inserirAgendamento(usuarioLogado, dataCorteTintura, horaCorteTintura, 'TINTURA'); // Tintura
            console.log("Dados da tintura enviados!");
            $(".agendamento__sucesso").show();
        }

        $('.opcoes__servicos input').each(function(){
            $(this).val('');
        });
    });
});