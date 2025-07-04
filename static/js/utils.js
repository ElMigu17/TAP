// Funções utilitárias:

function string_cod_turma(disc) {
  let turmas = disc["turmas"];
  turmas.sort();
  let turmas_as_string = "";
  for (let i in turmas) turmas_as_string += turmas[i];
  return disc["codigo"] + "_" + turmas_as_string;
}

function formata_nome(nome) {
  let array_nome = nome.split(" ");
  let nome_formatado = array_nome.pop(0) + " ";

  for (const sobrenome of array_nome) {
    nome_formatado = nome_formatado + sobrenome[0] + ".";
  }

  return nome_formatado;
}

function pega_disciplina_por_peso(preferencias, peso) {
  for (const pre in preferencias) {
    if (preferencias[pre] == peso) {
      return pre;
    }
  }
}

function def_display_na_classe(classe, meu_display) {
  let elementos_csv = document.getElementsByClassName(classe);
  for (const elemento_csv of elementos_csv) {
    elemento_csv.style.display = meu_display;
  }
}

function download_link() {
  $.ajax({
    url: "download",
    dataType: "json",
    success: function (data) {
      return data;
    },
    error: function (xhr, status, error) {
      window.alert(xhr.responseText);
    },
  });
}