// =====================================================================
// Painel "Estrutura em memória".
//
// Mostra a lista de adjacência EXATAMENTE como o back-end (Python) a
// guardou: os dados vêm da rota /api/estrutura.
//
//   [A] → [B | 4] → [C | 2] → ∅
//
// Opcionalmente mostra a matriz equivalente, só para comparação.
// =====================================================================

import { escapar } from "./ui.js";

export class PainelEstrutura {
  constructor({ container, metricas, chkMatriz }) {
    this.container = container;
    this.metricas = metricas;
    this.chkMatriz = chkMatriz;
    this.dados = null;
    this.chkMatriz.addEventListener("change", () => this.desenhar());
  }

  atualizar(dados) {
    this.dados = dados;
    this.desenhar();
  }

  desenhar() {
    const dados = this.dados;
    this.container.replaceChildren();

    if (!dados || dados.numero_vertices === 0) {
      this.metricas.textContent = "";
      this.container.innerHTML = '<p class="nada">O grafo está vazio. Cada vértice criado vira uma linha aqui.</p>';
      return;
    }

    this.metricas.innerHTML =
      `V = <b>${dados.numero_vertices}</b> · E = <b>${dados.numero_arestas}</b> · ` +
      `lista ocupa <b>${dados.memoria_lista}</b> posições · matriz ocuparia <b>${dados.memoria_matriz}</b>`;

    if (this.chkMatriz.checked) this._desenharMatriz(dados);
    else this._desenharLista(dados);
  }

  _desenharLista(dados) {
    for (const linha of dados.linhas) {
      const div = document.createElement("div");
      div.className = "linha-lista";
      div.dataset.vertice = linha.vertice;

      const cabeca = document.createElement("span");
      cabeca.className = "cabeca";
      cabeca.textContent = linha.vertice;
      div.appendChild(cabeca);

      for (const vizinho of linha.vizinhos) {
        div.appendChild(this._seta());
        const no = document.createElement("span");
        no.className = "no";
        no.dataset.vizinho = vizinho.vertice;
        no.innerHTML = `<span>${escapar(vizinho.vertice)}</span>` + (dados.ponderado ? `<span class="p">${vizinho.peso}</span>` : "");
        div.appendChild(no);
      }
      div.appendChild(this._seta());
      const nulo = document.createElement("span");
      nulo.className = "nulo";
      nulo.textContent = "∅";
      div.appendChild(nulo);

      this.container.appendChild(div);
    }
  }

  _desenharMatriz(dados) {
    const nomes = dados.linhas.map((l) => l.vertice);
    const tabela = document.createElement("table");
    tabela.className = "matriz";
    let html = "<tr><th></th>" + nomes.map((n) => `<th>${escapar(n)}</th>`).join("") + "</tr>";
    for (const linha of dados.linhas) {
      const pesos = {};
      for (const v of linha.vizinhos) pesos[v.vertice] = v.peso;
      html += `<tr><th>${escapar(linha.vertice)}</th>`;
      for (const n of nomes) {
        if (n in pesos) html += `<td class="cheia">${dados.ponderado ? pesos[n] : 1}</td>`;
        else html += '<td class="vazia">0</td>';
      }
      html += "</tr>";
    }
    tabela.innerHTML = html;
    this.container.appendChild(tabela);

    const vazias = dados.memoria_matriz - (dados.memoria_lista - dados.numero_vertices);
    const legenda = document.createElement("p");
    legenda.className = "legenda-matriz";
    legenda.textContent =
      `Só para comparação: o programa usa a lista. Aqui, ${vazias} de ${dados.memoria_matriz} células ` +
      `guardam "não existe ligação".`;
    this.container.appendChild(legenda);
  }

  _seta() {
    const s = document.createElement("span");
    s.className = "seta";
    s.textContent = "→";
    return s;
  }

  // Durante a animação: acende a linha do vértice atual e o vizinho analisado
  destacar(atual, foco) {
    for (const linha of this.container.querySelectorAll(".linha-lista")) {
      const ativa = linha.dataset.vertice === (foco ? foco[0] : atual);
      linha.classList.toggle("destacada", ativa);
      for (const no of linha.querySelectorAll(".no")) {
        no.classList.toggle("destacado", ativa && !!foco && no.dataset.vizinho === foco[1]);
      }
    }
  }
}
