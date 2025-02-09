$(function() {
    console.log('Renderer carregado. window.electronAPI:', window.electronAPI);
    console.log('jQuery carregado:', typeof $ !== 'undefined');
    console.log("jQuery versão:", $.fn.jquery);

    if(window.location.pathname.endsWith("index.html")){
        $("#usuario__incorreto").hide();
        $('.acesso').on("submit", async function(event) {
            event.preventDefault();
            const CPFUsuario = $('#acesso__login--CPF').val().trim();; 
            
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
    };

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
    if(window.location.pathname.endsWith("agendar.html")){
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

            if(!usuarioLogado){
                console.log("Sem usuário logado");
                return;
            }

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

            function formataStringData(data) {
                var dia  = data.split("/")[0];
                var mes  = data.split("/")[1];
                var ano  = data.split("/")[2];
                const dataFormatada = ano + '-' + ("0"+mes).slice(-2) + '-' + ("0"+dia).slice(-2);
                console.log("Data formatada:", dataFormatada);                  
                return dataFormatada;
            }

            if (selecionadoFeminino && validacao) {
                const dataCorteFeminino = $('#datepickerfeminino').val(); 
                const horaCorteFeminino = $('#horario__feminino').val(); 
                
                await window.electronAPI.inserirAgendamento(usuarioLogado, formataStringData(dataCorteFeminino), horaCorteFeminino, 'Corte Feminino'); // Corte Feminino
                console.log("Dados do corte feminino enviados!");
                $(".agendamento__sucesso").show();
            }

            if (selecionadoMasculino && validacao) {
                const dataCorteMasculino = $('#datepickermasculino').val(); 
                const horaCorteMasculino = $('#horario__masculino').val(); 
                await window.electronAPI.inserirAgendamento(usuarioLogado, formataStringData(dataCorteMasculino), horaCorteMasculino, 'Corte Feminino'); // Corte Masculino
                console.log("Dados do corte masculino enviados!");
                
                $(".agendamento__sucesso").show();
            }

            if (selecionadoTintura && validacao) {
                const dataCorteTintura = $('#datepickertintura').val(); 
                const horaCorteTintura = $('#horario__tintura').val(); 

                await window.electronAPI.inserirAgendamento(usuarioLogado, formataStringData(dataCorteTintura), horaCorteTintura, 'Tintura'); // Tintura
                console.log("Dados da tintura enviados!");
                $(".agendamento__sucesso").show();
            }

            $('.opcoes__servicos input').each(function(){
                $(this).val('');
            });
        });
    }

    // -------------- Página Próximos Agendamentos
    if(window.location.pathname.endsWith("proximosagendamentos.html")){
        $(".listagem__agendamentos--existe").hide();
        $(".listagem__agendamentos--nao--existe").hide();

        $(async function() {
            const usuarioLogado = sessionStorage.getItem('usuarioLogado');

            console.log("Usuário logado:", usuarioLogado);

            if(!usuarioLogado){
                console.log("Sem usuário logado");
                return;
            }

            var possuiAgendamento = await window.electronAPI.existeAgendamento(usuarioLogado);

            if(possuiAgendamento) {
                console.log("Retorno dos agendamentos encontrados:", possuiAgendamento);
            } else {
                console.log("Sem valores encontrados:", possuiAgendamento);
            }

            var criarBotao = $("#listagem__agendamentos");
            var conteudoHtml = '';

            function formataStringData(data) {
                var ano  = data.split("-")[0];
                var mes  = data.split("-")[1];
                var dia  = data.split("-")[2];
                const dataFormatada = ("0"+dia).slice(-2) + '/' + ("0"+mes).slice(-2) + '/' + ano;          
                return dataFormatada;
            }

            if(possuiAgendamento && possuiAgendamento.length > 0) {
                $(".listagem__agendamentos--existe").show();
                possuiAgendamento.forEach(function(item){
                    conteudoHtml += `<button type="button" class="list-group-item list-group-item-action" id="idServico${item.id}">${item.servico} 
                                    <br>Dia: ${formataStringData(item.data)} às ${item.hora}</button>`
                });
                criarBotao.html(conteudoHtml);    

                possuiAgendamento.forEach(function(item){
                    $(`#idServico${item.id}`).on("click", function(){
                        conteudoContato = `
                                        <div>
                                            <p id="idServico${item.id}">${item.servico}
                                            <br>Dia: ${formataStringData(item.data)} às ${item.hora}</p>
                                            <p class="mb-1">Compareça 15 minutos antes do horário marcado.</p>
                                            <small>Local: Avenida das Flores, nº 156.<br></small>
                                            <small>Telefone: (09) 827504594<br><br></small>                                        
                                            <button type="button" class="btn btn-secondary btn-sm">Editar agendamento</button>
                                            <button type="button" class="btn btn-secondary btn-sm">Cancelar agendamento</button>
                                        </div>
                                        `
                        $(`#idServico${item.id}`).html(conteudoContato);                                      
                    });
                    
                });
            } else {
                $(".listagem__agendamentos--nao--existe").show();
                console.log("Não existe agendamento");
            }

            
            

        });
    };
});