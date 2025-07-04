// Funções da tabela de docentes e preferências:

import { get_dados_solucao } from "./dadosSolucao"

function select_docente(docente) {
  limpar_tabela();
  mostra_disciplinas_docente(docente.target.value);
}

function coloca_nome_no_select() {
  let select = document.getElementById("nome_docentes");
  let valor_selecionado = select.value;
  select.innerHTML = "";
  dados_solucao.forEach((element) => {
    let opt = document.createElement("option");
    opt.value = element["nome"];
    opt.innerHTML = element["nome"];
    if (mostra_conflito && element["conflitos"].length > 0) {
      opt.innerHTML = element["nome"] + "*";
    }
    select.appendChild(opt);
  });
  select.value = valor_selecionado;
}

function alternar_mudanca_conflito() {
  mostra_conflito = !mostra_conflito;
  if (
    document.getElementById("nome_docentes").selectedOptions[0] != undefined
  ) {
    const nome_docente =
      document.getElementById("nome_docentes").selectedOptions[0].value;
    mostra_disciplinas_docente(nome_docente);
  }
  coloca_nome_no_select();
  limpar_tabela();
}

function acha_cod_por_parte() {
  const codigo = document.getElementById("insere_cod_disciplinas").value;
  document.getElementById("cod_disciplinas").style.display = "flex";
  const datalist = document.getElementById("cod_disciplinas");

  dados_solucao.forEach((doc) => {
    doc.disciplinas.forEach((dis) => {
      if (dis.includes(codigo)) {
        let nova_option = document.createElement("option");
        nova_option.value = dis;
        datalist.appendChild(nova_option);
      }
    });
  });
}

function inserir_par_obrigatorio() {
  const codigo = document.getElementById("insere_cod_disciplinas").value;
  const nome_docente = document.getElementById("nome_docentes").value;
  const doc = get_docente_por_nome(nome_docente.replace("*", ""));
  const dis = get_disciplina_por_codigo(codigo);
  par_disc_doc_obrigatorio.push([doc, dis]);
}

function cria_tabela() {
  let tabela = document.getElementById("horario");

  const semana = [
    "",
    "Segunda",
    "Terça",
    "Quarta",
    "Quinta",
    "Sexta",
    "Sabado",
  ];
  let head = tabela.createTHead();
  let row = head.insertRow(0);

  for (let j = 0; j < 7; j++) {
    row.insertCell(j).innerHTML = semana[j];
  }

  for (let i = 1; i < 17; i++) {
    row = tabela.insertRow(i);
    row.insertCell(0).innerHTML = i + 6;

    for (let j = 1; j < 7; j++) {
      row.insertCell(j);
    }
  }

  get_dados_solucao();
}

function limpar_tabela() {
  let tabela = document.getElementById("horario");

  for (let i = 1; i < 17; i++) {
    let row = tabela.getElementsByTagName("tr")[i];

    for (let j = 1; j < 7; j++) {
      row.getElementsByTagName("td")[j].innerHTML = "";
    }
  }
}

function mostra_disciplinas_docente(nome_docente) {
  let tabela = document.getElementById("horario");
  let i = 0;

  while (i < dados_solucao.length && dados_solucao[i]["nome"] != nome_docente) {
    i++;
  }

  if (i < dados_solucao.length) {
    let dados_disciplina = dados_solucao[i]["disciplinas_dados"];
    for (const dis of dados_disciplina) {
      for (const horario of dis["horarios"]) {
        adiciona_horario_na_tabela(tabela, horario, dis);
      }
    }
  }
}

function adiciona_horario_na_tabela(tabela, horario, dis) {
  let pos_hora_inicio = parseInt(horario["hora_inicio"].split(":")) - 6;
  let pos_hora_fim = parseInt(horario["hora_fim"].split(":")) - 6;
  let pos_dia = horario["dia_semana"];
  let cod = string_cod_turma(dis);
  let code_splited = cod.split("_");

  let HTML_interno = "<p>";
  if (mostra_conflito && dados_solucao[i]["conflitos"].includes(cod)) {
    HTML_interno = "<p class='conflito_horario'>";
  }
  HTML_interno =
    HTML_interno + code_splited[0] + "</br>" + code_splited[1] + "</p>";

  for (let a = pos_hora_inicio; a <= pos_hora_fim; a++) {
    tabela.getElementsByTagName("tr")[a].getElementsByTagName("td")[
      pos_dia
    ].innerHTML = HTML_interno;
  }
}

function organiza_tabelas_preferencias() {
  let largura_disponivel = $(window).width() - 180 - 43;
  let qtd_col = Math.trunc(largura_disponivel / 142);
  let qtd_tabelas = Math.ceil(dados_solucao.length / qtd_col);

  document.getElementById("tabela_preferencias").innerHTML = "";

  for (let i = 1; i <= qtd_tabelas; i++) {
    let inicio = (i - 1) * qtd_col;
    let fim = i * qtd_col;
    let dados_sliced = dados_solucao.slice(inicio, fim);
    let tabela = document.createElement("table");

    document.getElementById("tabela_preferencias").appendChild(tabela);
    preenche_tabela_preferencias(dados_sliced, tabela);
  }
}

function preenche_tabela_preferencias(data, tabela) {
  tabela.innerHTML = "";

  let qtd_rows = 0;
  let head = tabela.createTHead();
  let row_head = head.insertRow(0);
  let body = tabela.createTBody();

  for (let i = 0; i < data.length; i++) {
    row_head.insertCell(i).innerHTML = formata_nome(data[i]["nome"]);
    if (data[i]["disciplinas_dados"].length > qtd_rows) {
      qtd_rows = data[i]["disciplinas_dados"].length;
    }
  }

  for (let i = 0; i < qtd_rows; i++) {
    body.insertRow(i);
    let row_body = body.rows[i];
    for (let j = 0; j < data.length; j++) {
      let cell = row_body.insertCell(j);
      cell.classList.add("cell-preference");
    }
  }

  for (let i = 0; i < data.length; i++) {
    let disciplinas_dados = data[i]["disciplinas_dados"];

    for (let j = 0; j < disciplinas_dados.length; j++) {
      let cell = body.rows[j].cells[i];
      let cod_turma = string_cod_turma(disciplinas_dados[j]);
      let code_splited = cod_turma.split("_");
      let HTML_interno = code_splited[0] + "</br>" + code_splited[1];
      cell.innerHTML = HTML_interno;

      if (Object.keys(data[i]["preferencia"]).includes(cod_turma)) {
        cell.classList.add("presente");
      } else {
        cell.classList.add("ausente");
      }
    }
  }
}