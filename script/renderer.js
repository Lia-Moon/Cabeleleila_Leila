function formataStringAnoMesDia(data) {
    var dia  = data.split("/")[0];
    var mes  = data.split("/")[1];
    var ano  = data.split("/")[2];
    const dataFormatada = ano + '-' + ("0"+mes).slice(-2) + '-' + ("0"+dia).slice(-2);            
    return dataFormatada;
}

function formataStringDiaMesAno(data) {
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
        $(".opcoes__servicos--corte__feminino").hide();
        $(".opcoes__servicos--corte__masculino").hide();
        $(".opcoes__servicos--tintura").hide();
        $(".pendente__data--corte__feminino").hide();
        $(".pendente__data--corte__masculino").hide();
        $(".pendente__data--tintura").hide();
        $(".pendente__horario--corte__feminino").hide();
        $(".pendente__horario--corte__masculino").hide();
        $(".pendente__horario--tintura").hide();
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
            } else {
                console.log("Sem valores encontrados:", possuiAgendamentoMesmaSemana);
            }

            // Se existir agendamento para os próximos 7 dias
            var criarBotao = $("#listagem__agendamentos__mesma__semana");
            var conteudoHtml = '';

            possuiAgendamentoMesmaSemana.forEach(function(item){
                conteudoHtml += `
                                <div class="agendamento__semana" id="idServico${item.id}">
                                    <p>Foi encontrado esse seviço nos próximos dias<br>
                                       Tente agendar o novo na mesma data em um horário próximo!</p>
                                    <div class="border bg-light agendamento__semana--dados">
                                        ${item.servico}<br>Dia: ${formataStringDiaMesAno(item.data)} às ${item.hora}
                                    </div>
                                </div>
                                `;
            });
            criarBotao.html(conteudoHtml);  
        });                    

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

        $('#datepickerfeminino, #datepickermasculino, #datepickertintura').on('change', async function() {
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

            const campoIdAlterado = $(this).attr('id').replace('datepicker', 'horario__');
            $(`#${campoIdAlterado}`).empty();

            horariosPossiveis.forEach(hora => {
                if (!horariosOcupados.includes(hora)) {
                    $(`#${campoIdAlterado}`).append(new Option(hora, hora));
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

            const selecionadoFeminino = $("#corte__feminino").is(':checked');
            const selecionadoMasculino = $("#corte__masculino").is(':checked');
            const selecionadoTintura = $("#tintura").is(':checked');

            if(!selecionadoFeminino && !selecionadoMasculino && !selecionadoTintura) {
                console.log("Nenhum serviço foi selecionado");
                return;
            };

            const verificarData = (selecionado, datepicker, mensagem) => {
                if(selecionado) {
                    if($(datepicker).val().trim() === ""){
                        $(mensagem).show();
                        return false;
                    } else {
                        $(mensagem).hide();
                        return true;
                    }
                }
                return true;
            };

            const verificarHora = (selecionado, horario, mensagem) => {
                if(selecionado) {
                    if($(horario).val().trim() === ""){
                        $(mensagem).show();
                        return false;
                    } else {
                        $(mensagem).hide();
                        return true;
                    }
                }
                return true;
            };

            let validacaoDataFeminino = verificarData(selecionadoFeminino, "#datepickerfeminino", ".pendente__data--corte__feminino");
            let validacaoDataMasculino = verificarData(selecionadoMasculino, "#datepickermasculino", ".pendente__data--corte__masculino");
            let validacaoDataTintura = verificarData(selecionadoTintura, "#datepickertintura", ".pendente__data--tintura");   

            let validacaoHorarioFeminino = verificarHora(selecionadoFeminino, "#horario__feminino", ".pendente__horario--corte__feminino");
            let validacaoHorarioMasculino = verificarHora(selecionadoMasculino, "#horario__masculino", ".pendente__horario--corte__masculino");
            let validacaoHorarioTintura = verificarHora(selecionadoTintura, "#horario__tintura", ".pendente__horario--tintura");   
            
            if((selecionadoFeminino && !validacaoDataFeminino) ||
                (selecionadoMasculino && !validacaoDataMasculino) ||
                (selecionadoTintura && !validacaoDataTintura)) {
                    // console.log("Algumas Datas não preenchidas", validacaoDataFeminino, validacaoDataMasculino, validacaoDataTintura);
                    return;
            }

            if((selecionadoFeminino && !validacaoHorarioFeminino) ||
                (selecionadoMasculino && !validacaoHorarioMasculino) ||
                (selecionadoTintura && !validacaoHorarioTintura)) {
                    // console.log("Alguns Horários não preenchidas", validacaoDataFeminino, validacaoDataMasculino, validacaoDataTintura);
                    return;
            }    
            
            if (selecionadoFeminino && validacaoDataFeminino && validacaoHorarioFeminino) {
                const dataCorteFeminino = $('#datepickerfeminino').val(); 
                const horaCorteFeminino = $('#horario__feminino').val(); 
                
                await window.electronAPI.inserirAgendamento(usuarioLogado, formataStringAnoMesDia(dataCorteFeminino), horaCorteFeminino, 'Corte Feminino');
                console.log("Dados do corte feminino enviados!");
            }

            if (selecionadoMasculino && validacaoDataMasculino && validacaoHorarioMasculino) {
                const dataCorteMasculino = $('#datepickermasculino').val(); 
                const horaCorteMasculino = $('#horario__masculino').val(); 
                await window.electronAPI.inserirAgendamento(usuarioLogado, formataStringAnoMesDia(dataCorteMasculino), horaCorteMasculino, 'Corte Masculino');
                console.log("Dados do corte masculino enviados!");
            }

            if (selecionadoTintura && validacaoDataTintura && validacaoHorarioTintura) {
                const dataCorteTintura = $('#datepickertintura').val(); 
                const horaCorteTintura = $('#horario__tintura').val(); 

                await window.electronAPI.inserirAgendamento(usuarioLogado, formataStringAnoMesDia(dataCorteTintura), horaCorteTintura, 'Tintura');
                console.log("Dados da tintura enviados!");
            }

            $(".agendamento__sucesso").show();
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
                console.log("Seviço não selecionado");
                $(".pendente__servico").show(); 
                validacaoServico = false;
            } else {
                console.log("Seviço selecionado");
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