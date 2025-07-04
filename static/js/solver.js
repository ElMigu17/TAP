// Funções relacionadas ao solver:

function solver(e) {
  e.preventDefault();
  document.getElementById("loader-container").style.display = "flex";
  $.ajax({
    type: "POST",
    url: "solver/" + tipo_arquivo,
    processData: false,
    contentType: false,
    success: function (response) {
      process_solution_feedback(response);
    },
    error: function (xhr, status, error) {
      console.error(xhr, status, error);
    },
    complete: function () {
      document.getElementById("loader-container").style.display = "none";
    },
  });
}

function process_solution_feedback(response) {
  if (response == "No solution found") {
    alert("Não foi encontrada solução");
    return;
  } else if (typeof response === typeof Object()) {
    if ("erro" in response) {
      alert(response["erro"]);
      return;
    } else {
      let response_str = "";
      for (let i in response) {
        response_str += "\n" + i;
        let turmas_str = "";
        for (let j in response[i]) {
          turmas_str += response[i][j] + ", ";
        }
        response_str += ": " + turmas_str;
      }
      alert(
        "Na hora de fazer a leitura dos arquivos csv, algumas materias antigas aparentemente não foram lecionadas por docentes que lecionarão na solução ou houve uma confusão por haverem nomes indistinguiveis (como Fulano, Fulano de Tal e Fulano Silva). Isso pode ter ocorrido devido a um erro na escrita do nome do doscente. Com isso, segue a lista para futura verificação: \n" +
          response_str
      );
    }
    return;
  }
  get_dados_solucao();
  verifica_existencia_arquivo();
  setTimeout(() => {
    materias_liberadas();
    const docente_selecionado = document.getElementById("nome_docentes").value;
    if (docente_selecionado != "") {
      limpar_tabela();
      mostra_disciplinas_docente(docente_selecionado);
    }
  }, 500);
}

function validar_solucao() {
  document.getElementById("loader-container").style.display = "flex";
  let par_disc_doc_obrigatorio_para_envio = [];
  let disc_alocadas = {};

  for (const par of par_disc_doc_obrigatorio) {
    disc_alocadas[par[1].pos] = par[0].pos;
    par_disc_doc_obrigatorio_para_envio.push([par[0].pos, par[1].pos]);
  }

  for (const doc of dados_solucao) {
    let dado = doc["disciplinas_dados"];
    for (const dis of dado) {
      if (disc_alocadas[dis.pos] == undefined) {
        par_disc_doc_obrigatorio_para_envio.push([doc.pos, dis.pos]);
      }
    }
  }

  $.ajax({
    type: "POST",
    url: "validar_solucao",
    data: JSON.stringify({
      pares_restricao: par_disc_doc_obrigatorio_para_envio,
    }),
    contentType: "application/json;charset=UTF-8",
    success: function (response) {
      process_solution_feedback(response);
    },
    error: function (xhr, status, error) {
      console.error(xhr, status, error);
    },
    complete: function () {
      document.getElementById("loader-container").style.display = "none";
    },
  });
}

