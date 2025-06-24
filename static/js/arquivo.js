// Funções relacionadas ao envio e existência de arquivos:

import { def_display_na_classe } from "./utils"

function alternar_tipo_arquivo() {
  if (tipo_arquivo === "json") {
    tipo_arquivo = "csv";
    def_display_na_classe("csv", "flex");
    def_display_na_classe("json", "none");
  } else {
    tipo_arquivo = "json";
    def_display_na_classe("csv", "none");
    def_display_na_classe("json", "flex");
  }
  verifica_existencia_arquivo();
}

function arquivo_emcima(event) {
  event.preventDefault();
  event.target.style.backgroundColor = "#B2B2B2";
}

function arquivo_nao_emcima(elemento) {
  elemento.style.backgroundColor = "#D2D2D2";
}

function arquivo_caiu(event) {
  event.target.style.backgroundColor = "#D2D2D2";
  event.preventDefault();
  let file = event.dataTransfer.items[0].getAsFile();
  let id = event.originalTarget.nextElementSibling.id;
  let div_nome_arquivo =
    event.originalTarget.nextElementSibling.nextElementSibling;
  let data = new FormData();
  data.append(id, file, id);

  let all_file_name = file.name.split(".");
  if (all_file_name[all_file_name.length - 1] != tipo_arquivo) {
    return 0;
  }

  enviar_um_arquivo(data, file, div_nome_arquivo);
}

function adiciona_listeners_nos_botoes_arquivo() {
  let botoes_selecao_arquivo = document.getElementsByClassName(
    "botao-selecao-arquivo"
  );

  function seleciona_arquivo(event) {
    let div_nome_arquivo = event.explicitOriginalTarget.nextElementSibling;
    let id = event.explicitOriginalTarget.id;
    let form_data = new FormData($("#envioArquivos")[0]);
    let file = form_data.get(id);
    let data = new FormData();
    data.append(id, file, id);

    enviar_um_arquivo(data, file, div_nome_arquivo);
  }

  for (const botao of botoes_selecao_arquivo) {
    botao.addEventListener("change", seleciona_arquivo, false);
  }
}

function enviar_um_arquivo(data, file, div_nome_arquivo) {
  $.ajax({
    type: "POST",
    url: "enviar_um_arquivo/" + tipo_arquivo,
    data: data,
    processData: false,
    contentType: false,

    success: function (response) {
      verifica_existencia_arquivo();
      if (response.length > 0) {
        alert("Há erro no conteudo do arquivo enviado: " + file.name);
        div_nome_arquivo.innerHTML = "Arquivo enviado";
      } else {
        div_nome_arquivo.innerHTML = file.name;
      }
    },
    error: function (xhr, status, error) {
      console.error(error);
      console.error(file.name);
    },
  });
}

function verifica_existencia_arquivo() {
  $.ajax({
    type: "GET",
    url: "files-existence/" + tipo_arquivo,
    processData: false,
    success: function (response) {
      if (tipo_arquivo === "json") {
        let arquivos = document
          .getElementById("presenca-de-arquivo")
          .getElementsByClassName("json")[0].children;
        atualiza_situacao_arquivos(response["disciplinas"], arquivos[0]);
        atualiza_situacao_arquivos(response["docentes"], arquivos[1]);
        atualiza_situacao_arquivos(response["solucao"], arquivos[2]);
      } else {
        let arquivos = document
          .getElementById("presenca-de-arquivo")
          .getElementsByClassName("csv")[0].children;
        atualiza_situacao_arquivos(response["docentes_csv"], arquivos[0]);
        atualiza_situacao_arquivos(response["disciplinas_prox"], arquivos[1]);
        atualiza_situacao_arquivos(
          response["qtd_fim_ultimo_semestre"],
          arquivos[2]
        );
        atualiza_situacao_arquivos(response["preferencias"], arquivos[3]);
        atualiza_situacao_arquivos(response["ultimo_semestre"], arquivos[4]);
        atualiza_situacao_arquivos(response["penultimo_semestre"], arquivos[5]);
        atualiza_situacao_arquivos(
          response["antipenultimo_semestre"],
          arquivos[6]
        );
        atualiza_situacao_arquivos(response["solucao"], arquivos[7]);
      }
    },
    error: function (xhr, status, error) {
      console.error(error);
    },
  });
}

function atualiza_situacao_arquivos(exist, element) {
  if (exist) {
    element.classList.remove("ausente");
    element.classList.add("presente");
    element.innerHTML = element.innerHTML.replace("ausente", "presente");
    element.children[0].src = element.children[0].src.replace("X", "Check");
  } else {
    element.classList.remove("presente");
    element.classList.add("ausente");
    element.innerHTML = element.innerHTML.replace("presente", "ausente");
    element.children[0].src = element.children[0].src.replace("Check", "X");
  }
}