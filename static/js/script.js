import * as App from "./index"

def_display_na_classe("csv", "none");
def_display_na_classe("json", "flex");
document.getElementById("toggle").checked = false;
document.getElementById("mostra_conflito").checked = false;


$(document).ready(function () {
  App.cria_tabela();
  App.verifica_existencia_arquivo();
  App.adiciona_listeners_nos_botoes_arquivo();

  document
    .getElementById("insere_cod_disciplinas")
    .addEventListener("change", acha_cod_por_parte);
  document
    .getElementById("nome_docentes")
    .addEventListener("change", select_docente);

  setTimeout(() => materias_liberadas(), 2400);
});
