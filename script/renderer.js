function formataStringAnoMesDia(data) {
    if (typeof data !== "string") {
        let dia = data.getDate();
        let mes = data.getMonth() + 1; // 0 para janeiro, etc
        let ano = data.getFullYear();
        data = ("0" + dia).slice(-2) + "/" + ("0" + mes).slice(-2) + "/" + ano;
    }   

    var dia  = data.split("/")[0];
    var mes  = data.split("/")[1];
    var ano  = data.split("/")[2];
    const dataFormatada = ano + '-' + ("0"+mes).slice(-2) + '-' + ("0"+dia).slice(-2);            
    return dataFormatada;
}

function formataStringDiaMesAno(data) {
    if (typeof data !== "string") {
        let dia  = data.getDate();
        let mes  = data.getMonth() + 1;
        let ano  = data.getFullYear();
        return ("0" + dia).slice(-2) + '/' + ("0" + mes).slice(-2) + '/' + ano;
    }

    var ano  = data.split("-")[0];
    var mes  = data.split("-")[1];
    var dia  = data.split("-")[2];
    const dataFormatada = ("0"+dia).slice(-2) + '/' + ("0"+mes).slice(-2) + '/' + ano;          
    return dataFormatada;
}


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
        $(".pendente__data--erro--agendar").hide();
        $(".pendente__horario--erro--agendar").hide();
        $(".pendente__servico").hide();
        $(".agendamento__sucesso").hide();
        
        $(async function() {
            const usuarioLogado = sessionStorage.getItem('usuarioLogado');

            if(!usuarioLogado){
                console.log("Sem usuário logado");
                return;
            }

            var possuiAgendamentoMesmaSemana = await window.electronAPI.existeAgendamentoMesmaSemana(usuarioLogado);

            if(possuiAgendamentoMesmaSemana) {
                console.log("Retorno do 1ª agendamento encontrado dos próximos 7 dias:", possuiAgendamentoMesmaSemana);
                // Se existir agendamento para os próximos 7 dias
                var criarBotao = $("#listagem__agendamentos__mesma__semana");
                var conteudoHtml = '';

                possuiAgendamentoMesmaSemana.forEach(function(item){
                    conteudoHtml += `
                                    <div class="agendamento__semana" id="idServico${item.id}">
                                        <p>Foi encontrado esse serviço nos próximos dias<br>
                                        Tente agendar o novo na mesma data em um horário próximo!</p>
                                        <div class="border bg-light agendamento__semana--dados">
                                            ${item.servico}<br>Dia: ${formataStringDiaMesAno(item.data)} às ${item.hora}
                                        </div>
                                    </div>
                                    `;
                });
            } else {
                console.log("Sem valores encontrados:", possuiAgendamentoMesmaSemana);
            }
            
            criarBotao.html(conteudoHtml);  
            
            // Busca serviços cadastrados
            var procuraServicosCadastrados = await window.electronAPI.procuraServicosCadastrados();

            if(procuraServicosCadastrados) {
                console.log("Serviços encontrados:", procuraServicosCadastrados);
            } else {
                console.log("Sem serviços encontrados:", procuraServicosCadastrados);
            }

            // Cria o seletor de serviços
            var mostrarSeletorServico = $("#dropdown__opcoes--servicos");
            
            var conteudoHtmlSeletorServicos = '';

            procuraServicosCadastrados.forEach(function(item){
                if(item.servico) {
                    conteudoHtmlSeletorServicos += `<option value="${item.servico}">${item.servico}</option>`;   
                }                             
            });

            mostrarSeletorServico.append(conteudoHtmlSeletorServicos); 
        });                            

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

        // Verificar quais horas/datas estão disponíveis
        const atualizarDatasDisponiveis = async () => {
            const usuarioLogado = sessionStorage.getItem('usuarioLogado');

            if(!usuarioLogado){
                console.log("Sem usuário logado");
                return;
            }
            var procuraQlqAgendamento = await window.electronAPI.procuraQlqAgendamento();
            // console.log("Qualquer agendamento encontrado:", procuraQlqAgendamento);

            if(!procuraQlqAgendamento) {
                procuraQlqAgendamento = [];
                console.log("Sem agendamento encontrado");
            }

            const datasSemHorariosDisponiveis = [];
            const datasOcupadas = procuraQlqAgendamento.map(item => (item.data));
            
            const horariosPossiveis = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"];

            datasOcupadas.forEach(data => {
                const horariosOcupados = procuraQlqAgendamento.filter(item => item.data === data)
                                                                    .map(item => item.hora);
                // console.log(`Data: ${data}, Horários ocupados:`, horariosOcupados);                                                    
                if (horariosOcupados.length === horariosPossiveis.length) {
                    datasSemHorariosDisponiveis.push((data));
                }
            });

            //Inclui seletor de data na página de 'Agendar'
            $.datepicker.setDefaults($.datepicker.regional['pt-BR']);
            
            $('.datepicker').datepicker({
                showAnim: 'fadeIn',  
                firstDay: 0,       
                changeMonth: true,  
                changeYear: false,    
                minDate: 0,   // não permite selecionar datas passadas      
                maxDate: "+6M",
                beforeShowDay: function (date) {
                    var day = date.getDay();
                    const dataFormatada = $.datepicker.formatDate('yy-mm-dd', date);
                    return [day !== 0 && day !== 1 && !datasSemHorariosDisponiveis.includes(dataFormatada), ""]; // 0 = domingo, 1 = segunda
                }
            });
        }

        atualizarDatasDisponiveis();

        // Mostrar e atualiza opção de horário disponível
        $('#datepicker__agendar').on('change', async function() {
            $(".agendamento__sucesso").hide();  
            const dataEscolhida = formataStringAnoMesDia($("#datepicker__agendar").val());
            const usuarioLogado = sessionStorage.getItem('usuarioLogado');
            if(!usuarioLogado){
                console.log("Sem usuário logado");
                return;
            }

            var procuraQlqAgendamento = await window.electronAPI.procuraQlqAgendamento();
            // console.log("Qualquer agendamento (horários) encontrado:", procuraQlqAgendamento);

            const horariosOcupados = procuraQlqAgendamento.filter(item => item.data === dataEscolhida).map(item => item.hora);

            const horariosPossiveis = ["", "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"];

            const campoIdAlterado = $("#horario__agendar");
            campoIdAlterado.empty();
            const hoje = new Date();
            const horaAtual = hoje.getHours(); 
            
            const dataHojeFormatada = formataStringAnoMesDia(hoje);             

            horariosPossiveis.forEach(hora => {
                const transformarTextParaHora = parseInt(hora.split(":")[0]);

                if (dataEscolhida === dataHojeFormatada && transformarTextParaHora <= horaAtual){
                    return;
                }
                if (!horariosOcupados.includes(hora)) {
                    campoIdAlterado.append(new Option(hora, hora));
                }
            });
        })

        $('.agendar').on("click", async function(event) {
            event.preventDefault();
            const usuarioLogado = sessionStorage.getItem('usuarioLogado');

            if(!usuarioLogado){
                console.log("Sem usuário logado");
                return;
            }

            const selecionadoServicoAgendar = $("#dropdown__opcoes--servicos").val();

            if(!selecionadoServicoAgendar) {
                console.log("Nenhum serviço foi selecionado");
                $(".pendente__servico").show();
                return;
            } else {
                $(".pendente__servico").hide();
            }

            const verificarHoraData = (datepicker, mensagem) => {
                if($(datepicker).val().trim() === ""){
                    $(mensagem).show();
                    return false;
                } else {
                    $(mensagem).hide();
                    return true;
                }
            };

            let validacaoDataAgendar = verificarHoraData("#datepicker__agendar", ".pendente__data--erro--agendar");
            let validacaoHorarioAgendar = verificarHoraData("#horario__agendar", ".pendente__horario--erro--agendar");
            let validacaoServicoAgendar;

            if(selecionadoServicoAgendar){
                validacaoServicoAgendar = true;
            } else {
                validacaoServicoAgendar = false;
            }
            
            if((!validacaoHorarioAgendar || !validacaoDataAgendar)) {
                // console.log("Algumas Datas/Horários não foram preenchidos", validacaoHorarioAgendar, validacaoDataAgendar);
                return;
            }  
            
            if (validacaoHorarioAgendar || validacaoDataAgendar || validacaoServicoAgendar) {

                const dataCorteAgendar = $('#datepicker__agendar').val(); 
                const horaCorteAgendar = $('#horario__agendar').val();                 
                
                await window.electronAPI.inserirAgendamento(usuarioLogado, formataStringAnoMesDia(dataCorteAgendar), horaCorteAgendar, selecionadoServicoAgendar);
                console.log("Dados enviados!");
            }

            $(".agendamento__sucesso").show();
            $('#dropdown__opcoes--servicos').val('');
            $('#datepicker__agendar').val('');
            $('#horario__agendar').val('');
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

            if(possuiAgendamento && possuiAgendamento.length > 0) {
                $(".listagem__agendamentos--existe").show();                

                // Exibe todos agendamentos encontrados para o usuário
                var criarBotao = $("#listagem__agendamentos");
                var conteudoHtml = '';

                possuiAgendamento.forEach(function(item){
                    conteudoHtml += `
                                    <div class="list-group-item botao__servico" id="idServico${item.id}">
                                        <div class="servico__informacoes">
                                            ${item.servico}<br>Dia: ${formataStringDiaMesAno(item.data)} às ${item.hora}
                                        </div>
                                        <div class="informacao__adicional">
                                            <p class="mb-1">Compareça 15 minutos antes do horário marcado.</p>
                                            <small>Local: Avenida das Flores, nº 156.<br></small>
                                            <small>Telefone: (09) 827504594<br><br></small>                                        
                                            <button type="button" id="botao__editar__agendamento${item.id}" class="btn btn-secondary btn-sm" data-id=${item.id}>Editar agendamento</button>
                                            <button type="button" id="botao__cancelar__agendamento${item.id}" class="btn btn-secondary btn-sm" data-id=${item.id}>Cancelar agendamento</button>
                                        </div>
                                    </div>
                                    `;
                });
                criarBotao.html(conteudoHtml);    

                $("#listagem__agendamentos").on("click", ".botao__servico", function(botaoClicado){
                    if($(botaoClicado.target).is("button")) {
                        return;
                    }
                    $(this).find(".informacao__adicional").toggle();
                });

                // Editar agendamento
                $(document).on("click", "[id^='botao__editar__agendamento']", async function(botaoClicado) { //pega todos os ids
                    botaoClicado.stopPropagation(); 

                    let idAgendamento = $(this).data("id");

                    let hoje = new Date(); // data atual
                    hoje.setHours(0, 0, 0, 0);
                    let hojeMaisDoisDias = new Date(hoje);
                    hojeMaisDoisDias.setDate(hoje.getDate() + 2); // somar 2 dias

                    const agendamentoSelecionado = possuiAgendamento.find(item => item.id === idAgendamento);

                    console.log("agendamentoSelecionado", agendamentoSelecionado);

                    if(agendamentoSelecionado) {
                        let dataAgendamentoSelecionado = new Date(agendamentoSelecionado.data);
                        console.log("dataAgendamentoSelecionado", dataAgendamentoSelecionado);

                        // Mostra mensagem que o agendamento é em até 2 dias
                        if(dataAgendamentoSelecionado >= hoje && dataAgendamentoSelecionado <= hojeMaisDoisDias){
                            console.log(`Agendamento  ${idAgendamento} com menos de dois dias`, agendamentoSelecionado);
                            var criarBotao = $("#mostrar__mensagens");
                            var conteudoHtml = '';
                            conteudoHtml += `
                                                <div class="p-3 mb-2 bg-secondary text-white rounded">
                                                    <p class="mb-1"><strong>Atenção!</strong><br>
                                                                    Esse agendamento ocorrerá em até dois dias.<br>
                                                                    Entre em contato através do número <strong>(09) 827504594</strong> para realizar sua alteração.</p>
                                                </div>
                                            `;                            
                            criarBotao.html(conteudoHtml);
                            return;
                        }
                    }; 

                    console.log(`Registro ${idAgendamento} será editado`);
                    sessionStorage.setItem('idAgendamentoClicadoEdicao', idAgendamento);
                    window.location.href = 'editarAgendamento.html';                            
                });

                // Cancelar agendamento                
                $(document).on("click", "[id^='botao__cancelar__agendamento']", async function(botaoClicado) { //pega todos os ids
                    botaoClicado.stopPropagation(); 

                    let idAgendamento = $(this).data("id");

                    let hoje = new Date(); // data atual
                    hoje.setHours(0, 0, 0, 0);
                    let hojeMaisDoisDias = new Date(hoje);
                    hojeMaisDoisDias.setDate(hoje.getDate() + 2); // somar 2 dias

                    const agendamentoSelecionado = possuiAgendamento.find(item => item.id === idAgendamento);

                    if(agendamentoSelecionado) {
                        let dataAgendamentoSelecionado = new Date(agendamentoSelecionado.data);

                        // Mostra mensagem que o agendamento é em até 2 dias
                        if(dataAgendamentoSelecionado >= hoje && dataAgendamentoSelecionado <= hojeMaisDoisDias){
                            console.log(`Agendamento  ${idAgendamento} com menos de dois dias`, agendamentoSelecionado);
                            var criarBotao = $("#mostrar__mensagens");
                            var conteudoHtml = '';
                            conteudoHtml += `
                                            <div class="p-3 mb-2 bg-secondary text-white rounded">
                                                <p class="mb-1"><strong>Atenção!</strong><br>
                                                                Esse agendamento ocorrerá em até dois dias.<br>
                                                                Entre em contato através do número <strong>(09) 827504594</strong> para realizar o cancelamento.</p>
                                            </div>
                                            `;                            
                            criarBotao.html(conteudoHtml);
                            return;
                        } 
                    }
                    
                    var excluirAgendamento = await window.electronAPI.excluirIdAgendamento(idAgendamento);
                    if(excluirAgendamento) {
                        console.log(`Registro ${idAgendamento} excluído com sucesso`);
                        window.location.reload();
                        return;      
                    } else {
                        console.log(`Registro ${idAgendamento} não excluído`)
                    }

                });                
            } else {
                $(".listagem__agendamentos--nao--existe").show();
                console.log("Não existe agendamento");
            }                     
        });
    };

    // -------------- Página Histórico
    if(window.location.pathname.endsWith("historico.html")){
        $(".listagem__agendamentos--existe").hide();
        $(".listagem__agendamentos--nao--existe").hide();

        $(async function() {
            const usuarioLogado = sessionStorage.getItem('usuarioLogado');

            console.log("Usuário logado:", usuarioLogado);

            if(!usuarioLogado){
                console.log("Sem usuário logado");
                return;
            }

            var possuiAgendamentoAntigo = await window.electronAPI.existeAgendamentoAntigo(usuarioLogado);

            if(possuiAgendamentoAntigo) {
                console.log("Retorno dos agendamentos encontrados:", possuiAgendamentoAntigo);
            } else {
                console.log("Sem valores encontrados:", possuiAgendamentoAntigo);
            }

            var criarBotao = $("#listagem__agendamentos");
            var conteudoHtml = '';

            if(possuiAgendamentoAntigo && possuiAgendamentoAntigo.length > 0) {
                $(".listagem__agendamentos--existe").show();
                possuiAgendamentoAntigo.forEach(function(item){
                    conteudoHtml += `
                                    <div class="list-group-item botao__servico" id="idServico${item.id}">
                                        <div class="servico__informacoes">
                                            ${item.servico}<br>Dia: ${formataStringDiaMesAno(item.data)} às ${item.hora}
                                        </div>
                                        <div class="informacao__adicional">
                                            <p class="atendimento__realizado border border-success rounded text-success">Atendimento realizado</p>
                                            <small>Local: Avenida das Flores, nº 156.<br></small>
                                            <small>Telefone: (09) 827504594<br></small>                                                                                    
                                        </div>
                                    </div>
                                    `;
                });
                criarBotao.html(conteudoHtml);  

                $("#listagem__agendamentos").on("click", ".botao__servico", function(botaoClicado){
                    if($(botaoClicado.target).is("button")) {
                        return;
                    }
                    $(this).find(".informacao__adicional").toggle();
                });

            } else {
                $(".listagem__agendamentos--nao--existe").show();
                console.log("Não existe agendamento antigo");
            };

            // Inclui seletor de data na página de histórico
            $.datepicker.setDefaults($.datepicker.regional['pt-BR']);
            $('.datepicker').datepicker({
                showAnim: 'fadeIn',  
                firstDay: 0,       
                changeMonth: true,  
                changeYear: true,                    
            });

            // Clicar no botão 'Pesquisar' na página de histórico
            $("#container__agendamentos--filtro--pesquisar").on("click", async function(){
                const dataFiltroInicial = $('#datepickerDataInicial').val(); 
                const dataFiltroFinal = $('#datepickerDataFinal').val(); 
                let validacaoDataFiltroInicial;
                let validacaoDataFiltroFinal;

                
                if (dataFiltroInicial === "" || dataFiltroFinal === "") {
                    console.log("Datas não selecionadas para filtro!");
                    return;
                }

                let filtrarDadosPorData = await window.electronAPI.filtrarDadosPorData(formataStringAnoMesDia(dataFiltroInicial), formataStringAnoMesDia(dataFiltroFinal));
                console.log("Datas selecionas para filtro:", dataFiltroInicial, dataFiltroFinal);
                console.log("Dados trazidos:", filtrarDadosPorData);

                var criarBotao = $("#listagem__agendamentos");
                var conteudoHtml = '';

                if(filtrarDadosPorData && filtrarDadosPorData.length > 0) {
                    $(".listagem__agendamentos--existe").show();
                    $(".listagem__agendamentos--nao--existe").hide();

                    filtrarDadosPorData.forEach(function(item){
                        conteudoHtml += `
                                        <div class="list-group-item botao__servico" id="idServico${item.id}">
                                            <div class="servico__informacoes">
                                                ${item.servico}<br>Dia: ${formataStringDiaMesAno(item.data)} às ${item.hora}
                                            </div>
                                            <div class="informacao__adicional">
                                                <p class="atendimento__realizado border border-success rounded text-success">Atendimento realizado</p>
                                                <small>Local: Avenida das Flores, nº 156.<br></small>
                                                <small>Telefone: (09) 827504594<br></small>                                                                                    
                                            </div>
                                        </div>
                                        `;
                    });
                    criarBotao.html(conteudoHtml);  

                    $("#listagem__agendamentos").off("click", ".botao__servico").on("click", ".botao__servico", function (event) {
                        if ($(event.target).is("button")) {
                            return;
                        }
                        $(this).find(".informacao__adicional").toggle();
                    });

                }

            });            
        });
    };

    // -------------- Página Editar Agendamento
    if(window.location.pathname.endsWith("editarAgendamento.html")){           
        $(".pendente__data--erro").hide();
        $(".pendente__horario--erro").hide();
        $(".pendente__servico").hide();     
        $(".agendamento__sucesso").hide();
        
        $(async function() {
            const usuarioLogado = sessionStorage.getItem('usuarioLogado');
            const idAgendamentoClicadoEdicao = sessionStorage.getItem('idAgendamentoClicadoEdicao');
            console.log("ID do registro selecionado para edição:", idAgendamentoClicadoEdicao);

            if(!usuarioLogado){
                console.log("Sem usuário logado");
                return;
            }

            // Inclui seletor de data na página de 'Editar Agendamento'
            $.datepicker.setDefaults($.datepicker.regional['pt-BR']);

            const dadosAgendamentoSelecionado = await window.electronAPI.procuraAgendamentoPorId(idAgendamentoClicadoEdicao);
            
            if(dadosAgendamentoSelecionado) {
                console.log("Dados do agendamento que será editado:", dadosAgendamentoSelecionado);
            } else {
                console.log("Sem valores encontrados:", dadosAgendamentoSelecionado);
            }

            // Exibe dados do agendamento selecionado para edição
            var criarBotao = $("#listagem__agendamentos__mesma__semana");
            var conteudoHtml = '';

            dadosAgendamentoSelecionado.forEach(function(item){
                conteudoHtml += `
                                <div class="agendamento__semana" id="idServico${item.id}">
                                    <p>Agendamento selecionado para edição:</p>
                                    <div class="border bg-light agendamento__semana--dados">
                                        ${item.servico}<br>Dia: ${formataStringDiaMesAno(item.data)} às ${item.hora}
                                    </div>
                                </div>
                                `;
            });
            criarBotao.html(conteudoHtml);  
        });

        // Verificar quais horas/datas estão disponíveis
        const atualizarDatasDisponiveis = async () => {
            const usuarioLogado = sessionStorage.getItem('usuarioLogado');

            if(!usuarioLogado){
                console.log("Sem usuário logado");
                return;
            }
            var procuraQlqAgendamento = await window.electronAPI.procuraQlqAgendamento();
            console.log("Qualquer agendamento encontrado:", procuraQlqAgendamento);

            if(!procuraQlqAgendamento) {
                procuraQlqAgendamento = [];
                console.log("Sem agendamento encontrado");
            }

            const datasSemHorariosDisponiveis = [];
            const datasOcupadas = procuraQlqAgendamento.map(item => (item.data));
            // 
            const horariosPossiveis = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"];

            datasOcupadas.forEach(data => {
                const horariosOcupados = procuraQlqAgendamento.filter(item => item.data === data)
                                                                    .map(item => item.hora);
                // console.log(`Data: ${data}, Horários ocupados:`, horariosOcupados);                                                    
                if (horariosOcupados.length === horariosPossiveis.length) {
                    datasSemHorariosDisponiveis.push((data));
                }
            });
            // 
            $('.datepicker').datepicker({
                showAnim: 'fadeIn',  
                firstDay: 0,       
                changeMonth: true,  
                changeYear: false,    
                minDate: 0,   // não permite selecionar datas passadas      
                maxDate: "+6M",
                beforeShowDay: function (date) {
                    var day = date.getDay();
                    const dataFormatada = $.datepicker.formatDate('yy-mm-dd', date);
                    return [day !== 0 && day !== 1 && !datasSemHorariosDisponiveis.includes(dataFormatada), ""]; // 0 = domingo, 1 = segunda
                }
            });
        }

        atualizarDatasDisponiveis();

        $('#datepickerEdicao').on('change', async function() {
            $(".agendamento__sucesso").hide();  
            const dataEscolhida = $(this).val();
            const usuarioLogado = sessionStorage.getItem('usuarioLogado');
            if(!usuarioLogado){
                console.log("Sem usuário logado");
                return;
            }

            var procuraQlqAgendamento = await window.electronAPI.procuraQlqAgendamento();
            // console.log("Qualquer agendamento (horários) encontrado:", procuraQlqAgendamento);

            const dataEscolhidaFormatada = formataStringAnoMesDia(dataEscolhida);
            const horariosOcupados = procuraQlqAgendamento.filter(item => item.data === dataEscolhidaFormatada).map(item => item.hora);

            const horariosPossiveis = ["", "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"];

            const campoIdAlterado = $(`#horario__edicao`);
            campoIdAlterado.empty();

            horariosPossiveis.forEach(hora => {
                if (!horariosOcupados.includes(hora)) {
                    campoIdAlterado.append(new Option(hora, hora));
                }
            });
        });

        // Clicar no botão salvar em 'Editar Agendamento'
        $("#botao__salvar__agendamento").on("click", async function(){
            const usuarioLogado = sessionStorage.getItem('usuarioLogado');
            const idAgendamentoClicadoEdicao = sessionStorage.getItem('idAgendamentoClicadoEdicao');

            if(!usuarioLogado){
                console.log("Sem usuário logado");
                return;
            }

            const verificarData = (datepicker, mensagem) => {
                if($(datepicker).val().trim() === ""){
                    $(mensagem).show();
                    return false;
                } else {
                    $(mensagem).hide();
                    return true;
                }
            };

            const verificarHora = (horario, mensagem) => {
                if($(horario).val().trim() === ""){
                    $(mensagem).show();
                    return false;
                } else {
                    $(mensagem).hide();
                    return true;
                }
            };

            let validacaoDataEdicao = verificarData("#datepickerEdicao", ".pendente__data--erro");
            let validacaoHorarioEdicao = verificarHora("#horario__edicao", ".pendente__horario--erro");
            let validacaoServico;

            const servicoSelecionado = $("#opcao__servico--edicao").val();

            if(servicoSelecionado === "") {
                console.log("Serviço não selecionado");
                $(".pendente__servico").show(); 
                validacaoServico = false;
            } else {
                console.log("Serviço selecionado");
                $(".pendente__servico").hide(); 
                validacaoServico = true;
            }

            if(validacaoDataEdicao && validacaoHorarioEdicao && validacaoServico) {
                const dataCorteEdicao = $('#datepickerEdicao').val(); 
                const horaCorteEdicao = $('#horario__edicao').val(); 

                let editarAgendamentoPorId = await window.electronAPI.editarAgendamentoPorId(idAgendamentoClicadoEdicao, formataStringAnoMesDia(dataCorteEdicao), horaCorteEdicao, servicoSelecionado);
                console.log("Dados enviados para edição!", idAgendamentoClicadoEdicao, formataStringAnoMesDia(dataCorteEdicao), horaCorteEdicao, servicoSelecionado);
                
                if(editarAgendamentoPorId) {
                    $(".agendamento__sucesso").show();
                    const botaoSalvar = $("#botao__salvar__agendamento");
                    const botaoCancelar = $("#botao__cancelar__agendamento");
                    botaoSalvar.prop("disabled", true);
                    botaoCancelar.prop("disabled", true);
                } else {
                    console.log("Erro na edição do agendamento", idAgendamentoClicadoEdicao);
                }
                               
            } else {
                console.log("Dados não enviados para edição");
            }
        });

        // Clicar no botão cancelar
        $("#botao__cancelar__agendamento").on("click", function(){
            window.location.href = 'proximosagendamentos.html'; 
            
        });
    };
});