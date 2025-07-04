// Funções para erros de leitura:

function erros_de_leitura(e) {
  e.preventDefault();
  $.ajax({
    url: "erros-de-leitura",
    dataType: "json",
    success: function (data) {
      document.getElementById("erros-de-leitura").style.display = "flex";
      cria_info_erro(data["incoerencias"]);
    },
    error: function (xhr, status, error) {
      console.log(xhr.responseText);
    },
  });
}

function fecha_erros_de_leitura(e) {
  e.preventDefault();
  document.getElementById("erros-de-leitura").style.display = "none";
}

function cria_info_erro(erros) {
  let tabela = document.getElementById("erros-de-leitura-interno");
  tabela.innerHTML = "";
  let mensagens = {};

  const tipos = [
    "quebra_de_linha",
    "presenca_palavra_para",
    "presenca_palavra_mudar",
    "docent_not_found",
    "indistinguibilidade_de_nome",
  ];

  const tipos_pra_titulo = {
    quebra_de_linha: "Quebra de linha",
    presenca_palavra_para: "Presenca da palavra 'para'",
    presenca_palavra_mudar: "Presenca da palavra 'mudar'",
    docent_not_found: "Docentes não encontrados",
    indistinguibilidade_de_nome: "Indistinguibilidade de nome",
  };

  mensagens["quebra_de_linha"] = [];
  erros["quebra_de_linha"].forEach((message) => {
    mensagens["quebra_de_linha"].push(
      message["arquivo"] + " - " + message["linha"]
    );
  });

  mensagens["presenca_palavra_para"] = [];
  erros["presenca_palavra_para"].forEach((message) => {
    mensagens["presenca_palavra_para"].push(
      message["arquivo"] + " - " + message["linha"]
    );
  });

  mensagens["presenca_palavra_mudar"] = [];
  erros["presenca_palavra_mudar"].forEach((message) => {
    mensagens["presenca_palavra_mudar"].push(
      message["arquivo"] + " - " + message["linha"]
    );
  });

  mensagens["docent_not_found"] = [];
  erros["docent_not_found"].forEach((message) => {
    mensagens["docent_not_found"].push(
      message["arquivo"] +
        " - " +
        message["linha"] +
        " - " +
        message["doscente_disciplina"]
    );
  });

  mensagens["indistinguibilidade_de_nome"] = [];
  erros["indistinguibilidade_de_nome"].forEach((message) => {
    mensagens["indistinguibilidade_de_nome"].push(
      message["arquivo"] + " - " + message["linha"] + " - " + message["nome"]
    );
  });

  tipos.forEach((tipo) => {
    let div = document.createElement("div");
    div.id = tipo;

    let titulo = document.createElement("h4");
    titulo.innerHTML = tipos_pra_titulo[tipo];

    let list = document.createElement("ul");

    mensagens[tipo].forEach((text) => {
      let novo_item = document.createElement("li");
      novo_item.innerHTML = text;
      list.appendChild(novo_item);
    });

    div.appendChild(titulo);
    div.appendChild(list);
    tabela.appendChild(div);
  });
}