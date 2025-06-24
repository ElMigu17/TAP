// Funções de análise da solução

function mostra_analise_solucao(data) {
  let opt_data = document.getElementById("dados_solucao");
  let titulo = opt_data.getElementsByTagName("h3")[0];

  opt_data.innerHTML = "";
  opt_data.appendChild(titulo);

  for (let d in data) {
    let opt = document.createElement("p");
    let anterior = d.split(" - ")[1];
    if (data[d] == true) {
      opt.innerHTML = anterior + " Houve";
    } else if (data[d] == false) {
      opt.innerHTML = anterior + " Não houve";
    } else {
      opt.innerHTML = anterior + ": " + data[d];
    }
    opt_data.appendChild(opt);
  }
}

