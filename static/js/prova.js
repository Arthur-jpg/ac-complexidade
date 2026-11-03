// =====================================================================
// Janela "Folha de prova": mostra DFS, BFS e Dijkstra no formato pedido
// na prova, numa janela separada da tela principal.
//
// Quem calcula é a janela principal (main.js): ela executa os três
// algoritmos com o grafo atual e manda o resultado para cá por mensagem.
//   esta janela  --{ tipo: "folha-pronta" }-->  janela principal
//   principal    --{ tipo: "folha", dados, destaque }-->  esta janela
// =====================================================================

import { escapar } from "./ui.js";

const $ = (seletor) => document.querySelector(seletor);
const SVG = "http://www.w3.org/2000/svg";

const RAIO = 16;
const DX = 74;   // distância horizontal entre folhas da árvore
const DY = 74;   // distância entre níveis
const MARGEM = 34;

function pedirFolha() {
  if (!window.opener || window.opener.closed) {
    $("#info").textContent = "A janela principal foi fechada. Abra esta folha pelo botão “Folha de prova”.";
    return;
  }
  window.opener.postMessage({ tipo: "folha-pronta" }, location.origin);
}

window.addEventListener("message", (e) => {
  if (e.origin !== location.origin || e.data?.tipo !== "folha") return;
  mostrar(e.data.dados, e.data.destaque);
});

$("#btn-atualizar").addEventListener("click", pedirFolha);
$("#btn-imprimir").addEventListener("click", () => window.print());

pedirFolha();

// ---------------------------------------------------------------------

function mostrar(dados, destaque) {
  const { info } = dados;
  const hora = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  $("#info").textContent =
    `${info.vertices} vértices · ${info.arestas} arestas · ${info.direcionado ? "direcionado" : "não-direcionado"}` +
    ` · origem ${info.origem} · atualizado às ${hora}`;

  preencher("dfs", dados.dfs, desenharDFS);
  preencher("bfs", dados.bfs, montarBFS);
  preencher("dijkstra", dados.dijkstra, montarDijkstra);

  for (const q of document.querySelectorAll(".questao")) q.classList.remove("destacada");
  const alvo = destaque && $(`#q-${destaque}`);
  if (alvo) {
    void alvo.offsetWidth; // reinicia a animação do destaque
    alvo.classList.add("destacada");
    alvo.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
}

function preencher(algoritmo, resposta, montar) {
  const conteudo = $(`#q-${algoritmo} .conteudo`);
  if (resposta.erro) {
    conteudo.innerHTML = `<p class="erro-prova">${escapar(resposta.erro)}</p>`;
    return;
  }
  conteudo.replaceChildren(montar(resposta.prova));
}

function el(tag, atributos, pai) {
  const elemento = document.createElementNS(SVG, tag);
  for (const [k, v] of Object.entries(atributos)) elemento.setAttribute(k, v);
  if (pai) pai.appendChild(elemento);
  return elemento;
}

// ---------------------------------------------------------------------
// 1. DFS: a árvore desenhada, com descoberta/finalização em cada vértice.
//    Aresta da árvore = linha cheia; as demais arestas = tracejadas.
// ---------------------------------------------------------------------

function desenharDFS(p) {
  const filhos = Object.fromEntries(p.ordem.map((v) => [v, []]));
  for (const v of p.ordem) if (p.pai[v] !== null) filhos[p.pai[v]].push(v);

  // folhas recebem x = 0, 1, 2...; cada pai fica no meio dos filhos
  const pos = {};
  let proximaFolha = 0;
  let profundidade = 0;
  function posicionar(v, nivel) {
    profundidade = Math.max(profundidade, nivel);
    if (!filhos[v].length) {
      pos[v] = { x: proximaFolha++, y: nivel };
      return;
    }
    for (const filho of filhos[v]) posicionar(filho, nivel + 1);
    const xs = filhos[v].map((f) => pos[f].x);
    pos[v] = { x: (xs[0] + xs[xs.length - 1]) / 2, y: nivel };
  }
  for (const raiz of p.raizes) {
    posicionar(raiz, 0);
    proximaFolha += 0.5; // espaço extra entre as árvores da floresta
  }
  for (const v of p.ordem) {
    pos[v] = { x: MARGEM + 20 + pos[v].x * DX, y: MARGEM + 10 + pos[v].y * DY };
  }

  const largura = MARGEM * 2 + 40 + (proximaFolha - 1.5) * DX + 60;
  const altura = MARGEM * 2 + 20 + profundidade * DY;
  const svg = el("svg", { class: "desenho-dfs", viewBox: `0 0 ${largura} ${altura}`, width: largura, height: altura });
  const defs = el("defs", {}, svg);
  const seta = el("marker", { id: "seta-prova", viewBox: "0 0 10 10", refX: 9, refY: 5, markerWidth: 7, markerHeight: 7, orient: "auto-start-reverse" }, defs);
  el("path", { d: "M0 1 10 5 0 9z" }, seta);

  const ehArvore = (u, v) => p.pai[v] === u || (!p.direcionado && p.pai[u] === v);
  const linhas = el("g", {}, svg);

  for (const [u, v] of p.arestas) {
    const arvore = ehArvore(u, v);
    // aresta da árvore sempre desenhada do pai para o filho
    const [de, para] = arvore && p.pai[u] === v ? [v, u] : [u, v];
    const a = pos[de], b = pos[para];
    const seta = p.direcionado ? { "marker-end": "url(#seta-prova)" } : {};

    if (arvore) {
      const [x1, y1] = encurtar(a, b);
      const [x2, y2] = encurtar(b, a);
      el("line", { class: "arvore", x1, y1, x2, y2, ...seta }, linhas);
      continue;
    }
    // demais arestas: curva tracejada, para o lado que passa mais longe dos outros vértices
    const dx = b.x - a.x, dy = b.y - a.y;
    const comprimento = Math.hypot(dx, dy) || 1;
    const curva = Math.max(22, Math.min(80, comprimento * 0.28));
    const meio = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    const lados = [1, -1].map((sinal) => {
      const c = { x: meio.x - (dy / comprimento) * curva * sinal, y: meio.y + (dx / comprimento) * curva * sinal };
      return { c, folga: folgaDaCurva(a, c, b, p.ordem.filter((x) => x !== de && x !== para).map((x) => pos[x])) };
    });
    // empate: prefere a curva para a direita
    lados.sort((l1, l2) => (l2.folga - l1.folga) || (l2.c.x - l1.c.x));
    const c = lados[0].c;
    const [x1, y1] = encurtar(a, c);
    const [x2, y2] = encurtar(b, c);
    el("path", { class: "outra", d: `M${x1} ${y1} Q${c.x} ${c.y} ${x2} ${y2}`, ...seta }, linhas);
  }

  for (const v of p.ordem) {
    const { x, y } = pos[v];
    const g = el("g", { class: v === p.raizes[0] ? "vertice-prova raiz" : "vertice-prova" }, svg);
    el("circle", { cx: x, cy: y, r: RAIO }, g);
    el("text", { x, y, class: "nome" }, g).textContent = v;
    el("text", { x: x + RAIO + 3, y: y - RAIO + 1, class: "tempos" }, g).textContent =
      `${p.descoberta[v]}/${p.finalizacao[v]}`;
  }

  const bloco = document.createElement("div");
  bloco.className = "bloco-dfs";
  bloco.appendChild(svg);
  bloco.insertAdjacentHTML("beforeend", `
    <p class="legenda-prova">
      <span><i class="traco cheio"></i>aresta da árvore</span>
      <span><i class="traco tracejado"></i>demais arestas</span>
      <span><b>d/f</b> = descoberta/finalização</span>
    </p>
    <p class="linha-resumo">Ordem de visita: ${p.ordem.map(escapar).join(", ")}</p>`);
  return bloco;
}

// menor distância entre a curva a→c→b e os outros vértices (limitada, para o empate valer)
function folgaDaCurva(a, c, b, outros) {
  let folga = 3 * RAIO;
  for (let t = 0.1; t < 1; t += 0.1) {
    const x = (1 - t) ** 2 * a.x + 2 * (1 - t) * t * c.x + t ** 2 * b.x;
    const y = (1 - t) ** 2 * a.y + 2 * (1 - t) * t * c.y + t ** 2 * b.y;
    for (const o of outros) folga = Math.min(folga, Math.hypot(o.x - x, o.y - y));
  }
  return folga;
}

// ponto na borda do círculo de "a", na direção de "b"
function encurtar(a, b) {
  const dx = b.x - a.x, dy = b.y - a.y;
  const d = Math.hypot(dx, dy) || 1;
  return [a.x + (dx / d) * (RAIO + 2), a.y + (dy / d) * (RAIO + 2)];
}

// ---------------------------------------------------------------------
// 2. BFS: quem sai da fila à esquerda e como a fila fica depois,
//    com a distância em cima de cada vértice. À direita, o vetor final.
// ---------------------------------------------------------------------

function vetor(itens) {
  const conteudo = itens
    .map(([nome, dist]) => `<span class="item"><small>${dist}</small>${escapar(nome)}</span>`)
    .join('<span class="virgula">,</span>');
  return `<span class="vetor"><span class="colchete">[</span>${conteudo}<span class="colchete">]</span></span>`;
}

function montarBFS(p) {
  const linhas = p.linhas
    .map((l) => `<tr><th>${l.vertice === null ? "∅" : escapar(l.vertice)}</th><td>${vetor(l.fila)}</td></tr>`)
    .join("");
  const bloco = document.createElement("div");
  bloco.className = "bloco-bfs";
  bloco.innerHTML = `
    <table class="rastro"><tbody>${linhas}</tbody></table>
    <div class="vetor-final">
      <span class="rotulo">Ordem final</span>
      ${vetor(p.ordem)}
      ${p.nao_alcancados.length
        ? `<p class="linha-resumo">Não alcançados a partir de ${escapar(p.origem)}: ${p.nao_alcancados.map(escapar).join(", ")}</p>`
        : ""}
    </div>`;
  return bloco;
}

// ---------------------------------------------------------------------
// 3. Dijkstra: matriz com uma coluna por vértice e uma linha por escolha.
//    O escolhido da linha fica circulado; dali para baixo a coluna fica vazia.
// ---------------------------------------------------------------------

function montarDijkstra(p) {
  const cabecalho = p.colunas.map((c) => `<th>${escapar(c)}</th>`).join("");
  const corpo = p.linhas.map((linha, i) => {
    const celulas = p.colunas.map((c) => {
      if (!(c in linha.valores)) return '<td class="fechada"></td>';
      const classes = [];
      if (c === linha.escolhido) classes.push("escolhido");
      if (linha.mudou.includes(c)) classes.push("mudou");
      return `<td class="${classes.join(" ")}"><span>${escapar(linha.valores[c])}</span></td>`;
    }).join("");
    return `<tr><th class="iteracao">${i + 1}</th>${celulas}</tr>`;
  }).join("");

  const resultado = Object.fromEntries(p.resultado.map(([v, dist, anterior]) => [v, { dist, anterior }]));
  const rodape = `
    <tr class="final"><th class="iteracao">dist</th>${p.colunas.map((c) => `<td>${escapar(resultado[c].dist)}</td>`).join("")}</tr>
    <tr class="final"><th class="iteracao">ant</th>${p.colunas.map((c) => `<td>${escapar(resultado[c].anterior ?? "—")}</td>`).join("")}</tr>`;

  const bloco = document.createElement("div");
  bloco.className = "bloco-dijkstra";
  bloco.innerHTML = `
    <div class="tabela-envolve">
      <table class="matriz">
        <thead><tr><th class="iteracao"></th>${cabecalho}</tr></thead>
        <tbody>${corpo}</tbody>
        <tfoot>${rodape}</tfoot>
      </table>
    </div>
    <p class="legenda-prova">
      <span><i class="circulo"></i>escolhido na linha (finalizado)</span>
      <span><b>negrito</b> = distância melhorou</span>
      <span>coluna vazia = já finalizado</span>
    </p>
    <p class="linha-resumo">Ordem de escolha: ${p.linhas.map((l) => escapar(l.escolhido)).join(", ")}${
      p.inalcancaveis.length ? ` · inalcançáveis: ${p.inalcancaveis.map(escapar).join(", ")}` : ""}</p>`;
  return bloco;
}
