// Funções para manipular dados de solução:

import { mostra_analise_solucao } from "./analiseSolucao"
import { coloca_nome_no_select, organiza_tabelas_preferencias } from "./docenteTabela"

function get_dados_solucao() {
  $.ajax({
    url: "docentes-info",
    dataType: "json",
    success: function (data) {
      dados_solucao = data["docentes"];
      mostra_analise_solucao(data["dados_solucao"]);
      coloca_nome_no_select();
      organiza_tabelas_preferencias();
    },
    error: function (xhr, status, error) {
      console.log(xhr.responseText);
    },
  });
}

function get_docente_por_nome(nome) {
  let retorno = false;
  dados_solucao.forEach((dado) => {
    if (dado["nome"] == nome) {
      retorno = dado;
    }
  });
  return retorno;
}

function get_disciplina_por_codigo(codigo) {
  let retorno = false;
  for (const docente of dados_solucao) {
    let dado = docente["disciplinas_dados"];
    for (const dis of dado) {
      if (string_cod_turma(dis) == codigo) {
        return dis;
      }
    }
  }
  return retorno;
}

function materias_liberadas() {
  materias_serao_foram_liberadas(
    "disc_per_2",
    "disc_per_1",
    "disciplinas",
    "disciplinas_serao_liberadas"
  );
  materias_serao_foram_liberadas(
    "disc_per_3",
    "disc_per_2",
    "disc_per_1",
    "disciplinas_estao_liberadas"
  );
}

function materias_serao_foram_liberadas(periodo_3, periodo_2, periodo_1, id) {
  let disciplinas_liberadas = [];
  for (const i in dados_solucao) {
    let disciplinas_seguidas = structuredClone(dados_solucao[i][periodo_1]);
    for (const j in disciplinas_seguidas) {
      if (!(disciplinas_seguidas[j] in dados_solucao[i][periodo_2])) {
        disciplinas_seguidas.pop(j);
      }
    }

    for (const j in disciplinas_seguidas) {
      if (!(disciplinas_seguidas[j] in dados_solucao[i][periodo_3])) {
        disciplinas_seguidas.pop(j);
      }
    }

    disciplinas_liberadas = disciplinas_liberadas.concat(disciplinas_seguidas);
  }
  document.getElementById(id).innerHTML = "";
  let lista = document.getElementById(id);

  for (let i in disciplinas_liberadas) {
    let novo_item = document.createElement("li");
    novo_item.innerHTML = disciplinas_liberadas[i];
    lista.appendChild(novo_item);
  }
}

