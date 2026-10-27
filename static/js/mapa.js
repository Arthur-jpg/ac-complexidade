// =====================================================================
// SmartNet Analyzer — modo MAPA REAL.
//
// Mesmo back-end, mesmos algoritmos e mesma lista de adjacência do
// quadro branco. A diferença é de onde vem o grafo:
//   vértices = bairros (ou pontos clicados) com latitude/longitude
//   arestas  = vias entre eles, com peso = distância REAL pelas ruas
//              (ou tempo de carro, ou linha reta, à escolha)
// =====================================================================

import { api } from "./api.js";
import { MapaGrafo } from "./mapa-grafo.js";
import { PainelEstrutura } from "./painel-estrutura.js";
import { PainelResultado } from "./painel-resultado.js";
import { avisar, confirmarComSegundoClique, escapar, ordenarNomes } from "./ui.js";

const $ = (seletor) => document.querySelector(seletor);

const DICAS = {
  mover: "Arraste para navegar · clique num bairro para partir dele ou ir até ele",
  vertice: "Clique no mapa para criar um ponto (o nome do bairro é sugerido automaticamente)",
  aresta: "Clique em um ponto e depois em outro: a via é traçada pelas ruas",
  apagar: "Clique em um ponto ou em uma via para apagar",
};

const DESCRICAO_PESO = {
  km: "distância pelas ruas, em km",
  minutos: "tempo estimado de carro, em minutos (sem trânsito)",
  reta: "distância em linha reta, em km",
};

let cidades = [];
let cidade = null;
let criterio = "km";   // qual medida da via vale como peso
let ferramenta = "mover";
let pendente = null;   // primeiro ponto escolhido ao criar uma via
let grafo = { direcionado: false, ponderado: true, vertices: [], arestas: [] };

// ---------------------------------------------------------------------
// Componentes
// ---------------------------------------------------------------------

const painelEstrutura = new PainelEstrutura({
  container: $("#estrutura"),
  metricas: $("#metricas"),
  chkMatriz: $("#chk-matriz"),
});

const mapa = new MapaGrafo({
  elemento: $("#mapa"),
  aoClicarMapa,
  aoClicarVertice,
  aoClicarAresta,
});

const painelResultado = new PainelResultado({
  container: $("#resultado"),
  aoMudarPasso: (visual, passo) => {
    mapa.definirVisual(visual);
    painelEstrutura.destacar(passo ? passo.atual : null, passo ? passo.foco : null);
    $("#legenda").hidden = !visual;
    // último passo do Dijkstra com destino: todas as arestas do passo formam a rota
    const ehRota = passo && passo.arestas.length && passo.arestas.every((a) => a[2] === "caminho");
    if (ehRota) mapa.animarRota(passo.arestas.map(([u, v]) => [u, v]));
    else mapa.pararRota();
  },
});

// ---------------------------------------------------------------------
// Cidade e grafo
// ---------------------------------------------------------------------

function carregarCidade(id) {
  cidade = cidades.find((c) => c.id === id) || cidades[0];
  $("#sel-cidade").value = cidade.id;
  grafo = {
    direcionado: false,
    ponderado: true,
    vertices: cidade.bairros.map((b) => ({ ...b })),
    arestas: cidade.vias.map((v) => ({ ...v, peso: v[criterio] })),
  };
  pendente = null;
  mapa.irPara(cidade.centro, cidade.zoom);
  aoAlterarGrafo();
  mapa.enquadrar();
  const [origem, destino] = sugestaoInicial();
  if (origem) $("#sel-origem").value = origem;
  if (destino) $("#sel-destino").value = destino;
}

// Origem/destino iniciais que rendem uma rota bonita para mostrar
function sugestaoInicial() {
  const sugestoes = { rio: ["Copacabana", "Campo Grande"], sp: ["Santana", "Morumbi"], bh: ["Venda Nova", "Barreiro"] };
  const [o, d] = sugestoes[cidade.id] || [];
  const existe = (n) => grafo.vertices.some((v) => v.nome === n);
  return [existe(o) ? o : null, existe(d) ? d : null];
}

let timerEstrutura = null;

function aoAlterarGrafo() {
  if (painelResultado.temResultado()) painelResultado.limpar();
  mapa.desenhar(grafo, { mostrarPesos: $("#chk-pesos").checked, linhaReta: criterio === "reta" });
  mapa.marcarPendente(pendente);
  atualizarSeletores();
  atualizarDica();
  $("#nota-unidade").textContent =
    `Peso de cada via: ${DESCRICAO_PESO[criterio]}. As vias valem nos dois sentidos (grafo não-direcionado).`;

  clearTimeout(timerEstrutura);
  timerEstrutura = setTimeout(async () => {
    try {
      painelEstrutura.atualizar(await api.estrutura(grafo));
    } catch (erro) {
      avisar(erro.message, true);
    }
  }, 120);
}

function atualizarSeletores() {
  const nomes = ordenarNomes(grafo.vertices.map((v) => v.nome));
  for (const [seletor, opcional] of [["#sel-origem", false], ["#sel-destino", true]]) {
    const select = $(seletor);
    const anterior = select.value;
    select.replaceChildren();
    if (opcional) select.add(new Option("— todos —", ""));
    for (const nome of nomes) select.add(new Option(nome, nome));
    if (nomes.includes(anterior) || (opcional && anterior === "")) select.value = anterior;
  }
}

function atualizarDica() {
  $("#dica").textContent = pendente
    ? `Via a partir de ${pendente}: clique no ponto de chegada (Esc cancela)`
    : DICAS[ferramenta];
}

function vertice(nome) {
  return grafo.vertices.find((v) => v.nome === nome);
}

function nomeLivre(base) {
  if (!vertice(base)) return base;
  for (let i = 2; ; i++) if (!vertice(`${base} ${i}`)) return `${base} ${i}`;
}

// ---------------------------------------------------------------------
// Cliques no mapa
// ---------------------------------------------------------------------

function aoClicarMapa(latlng) {
  if (ferramenta === "vertice") criarPonto(latlng);
  else if (pendente) cancelarPendente();
}

function aoClicarVertice(nome, latlng) {
  if (ferramenta === "apagar") {
    grafo.vertices = grafo.vertices.filter((v) => v.nome !== nome);
    grafo.arestas = grafo.arestas.filter((a) => a.origem !== nome && a.destino !== nome);
    if (pendente === nome) pendente = null;
    aoAlterarGrafo();
    return;
  }
  if (ferramenta === "aresta") {
    if (!pendente) { pendente = nome; mapa.marcarPendente(nome); atualizarDica(); }
    else if (pendente === nome) cancelarPendente();
    else ligar(pendente, nome);
    return;
  }
  mostrarPopupBairro(nome, latlng);
}

function aoClicarAresta(indice, latlng) {
  const aresta = grafo.arestas[indice];
  if (ferramenta === "vertice") { criarPonto(latlng); return; }
  if (ferramenta === "apagar") {
    grafo.arestas.splice(indice, 1);
    aoAlterarGrafo();
    return;
  }
  mapa.popup(latlng, `
    <strong>${escapar(aresta.origem)} — ${escapar(aresta.destino)}</strong>
    <div class="linha-popup">${aresta.km} km pelas ruas · ~${aresta.minutos} min de carro</div>
    <div class="linha-popup fraco">${aresta.reta} km em linha reta</div>`);
}

function mostrarPopupBairro(nome, latlng) {
  const grau = grafo.arestas.filter((a) => a.origem === nome || a.destino === nome).length;
  const div = document.createElement("div");
  div.innerHTML = `
    <strong>${escapar(nome)}</strong>
    <div class="linha-popup fraco">${grau} via(s) · ${latlng.lat.toFixed(4)}, ${latlng.lng.toFixed(4)}</div>
    <div class="acoes-popup">
      <button class="botao" data-acao="origem">Partir daqui</button>
      <button class="botao botao-primario" data-acao="destino">Ir até aqui</button>
    </div>`;
  div.querySelector('[data-acao="origem"]').onclick = () => {
    $("#sel-origem").value = nome;
    mapa.fecharPopup();
    avisar(`Origem: ${nome}`);
  };
  div.querySelector('[data-acao="destino"]').onclick = () => {
    mapa.fecharPopup();
    if ($("#sel-origem").value === nome) { avisar("Esse já é o ponto de partida. Escolha outro destino.", true); return; }
    $("#sel-destino").value = nome;
    executar("dijkstra");
  };
  mapa.popup(latlng, div);
}

function criarPonto(latlng) {
  const form = document.createElement("form");
  form.className = "form-ponto";
  form.innerHTML = `
    <strong>Novo ponto</strong>
    <input type="text" maxlength="40" aria-label="Nome do ponto" required>
    <button class="botao botao-primario">Criar</button>`;
  const campo = form.querySelector("input");
  campo.value = nomeLivre("Ponto " + (grafo.vertices.length + 1));
  let editado = false;
  campo.addEventListener("input", () => { editado = true; });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const nome = campo.value.trim();
    if (!nome) return;
    if (vertice(nome)) { avisar(`Já existe um ponto chamado "${nome}".`, true); return; }
    grafo.vertices.push({ nome, lat: latlng.lat, lng: latlng.lng });
    mapa.fecharPopup();
    aoAlterarGrafo();
    avisar(`${nome} criado. Use a ferramenta Via para ligá-lo a outros pontos.`);
  });

  mapa.popup(latlng, form);
  campo.focus();
  campo.select();

  // sugere o nome do bairro onde o usuário clicou
  api.local(latlng.lat, latlng.lng).then(({ nome }) => {
    if (nome && !editado && form.isConnected) {
      campo.value = nomeLivre(nome);
      campo.select();
    }
  }).catch(() => { /* sem sugestão: fica "Ponto N" */ });
}

function cancelarPendente() {
  pendente = null;
  mapa.marcarPendente(null);
  atualizarDica();
}

async function ligar(u, v) {
  cancelarPendente();
  if (grafo.arestas.some((a) => (a.origem === u && a.destino === v) || (a.origem === v && a.destino === u))) {
    avisar(`Já existe uma via entre ${u} e ${v}.`, true);
    return;
  }
  const a = vertice(u), b = vertice(v);
  avisar(`Traçando a via ${u} — ${v} pelas ruas…`);
  try {
    const medida = await api.via({ lat: a.lat, lng: a.lng }, { lat: b.lat, lng: b.lng });
    if (!vertice(u) || !vertice(v)) return; // apagaram um dos pontos enquanto esperava
    grafo.arestas.push({ origem: u, destino: v, ...medida, peso: medida[criterio] });
    aoAlterarGrafo();
    if (medida.fonte === "linha_reta") avisar("Serviço de rotas indisponível: usei a distância em linha reta.", true);
    else avisar(`${u} — ${v}: ${medida.km} km pelas ruas, ~${medida.minutos} min.`);
  } catch (erro) {
    avisar(erro.message, true);
  }
}

// ---------------------------------------------------------------------
// Barra de ferramentas
// ---------------------------------------------------------------------

function escolherFerramenta(nova) {
  ferramenta = nova;
  if (nova !== "aresta") cancelarPendente();
  $("#quadro").dataset.ferramenta = nova;
  for (const botao of document.querySelectorAll(".ferramenta")) {
    botao.classList.toggle("ativa", botao.dataset.ferramenta === nova);
  }
  atualizarDica();
}

for (const botao of document.querySelectorAll(".ferramenta")) {
  botao.addEventListener("click", () => escolherFerramenta(botao.dataset.ferramenta));
}

$("#sel-cidade").addEventListener("change", (e) => carregarCidade(e.target.value));

$("#sel-peso").addEventListener("change", (e) => {
  criterio = e.target.value;
  for (const aresta of grafo.arestas) aresta.peso = aresta[criterio];
  aoAlterarGrafo();
});

$("#chk-pesos").addEventListener("change", () => {
  mapa.desenhar(grafo, { mostrarPesos: $("#chk-pesos").checked, linhaReta: criterio === "reta" });
  // redesenhar não pode apagar o estado da animação
  if (painelResultado.temResultado()) painelResultado.irPara(painelResultado.passo);
});

$("#btn-restaurar").addEventListener("click", () => carregarCidade(cidade.id));

confirmarComSegundoClique($("#btn-limpar"), "Confirmar?", () => {
  grafo.vertices = [];
  grafo.arestas = [];
  pendente = null;
  aoAlterarGrafo();
  escolherFerramenta("vertice");
});

// ---------------------------------------------------------------------
// Algoritmos
// ---------------------------------------------------------------------

const botoesAlgoritmo = document.querySelectorAll("[data-algoritmo]");

async function executar(algoritmo) {
  if (!grafo.vertices.length) { avisar("Crie pelo menos um ponto no mapa.", true); return; }
  const origem = $("#sel-origem").value;
  const destino = $("#sel-destino").value || null;

  for (const b of botoesAlgoritmo) {
    b.disabled = true;
    b.classList.toggle("ativo", b.dataset.algoritmo === algoritmo);
  }
  try {
    const resposta = await api.executar(grafo, algoritmo, origem, destino === origem ? null : destino);
    painelResultado.mostrar(resposta, false);
  } catch (erro) {
    painelResultado.mostrarErro("Não foi possível executar", erro.message);
  } finally {
    for (const b of botoesAlgoritmo) b.disabled = false;
  }
}

for (const botao of botoesAlgoritmo) {
  botao.addEventListener("click", () => executar(botao.dataset.algoritmo));
}

confirmarComSegundoClique($("#btn-finalizar"), "Clique de novo para finalizar", async () => {
  try { await api.finalizar(); } catch { /* o servidor já pode ter fechado */ }
  $("#finalizado").hidden = false;
});

// ---------------------------------------------------------------------
// Atalhos de teclado
// ---------------------------------------------------------------------

document.addEventListener("keydown", (e) => {
  if (e.target.closest("input, textarea, select")) return;
  if (e.ctrlKey || e.metaKey || e.altKey) return;

  const atalhos = { v: "mover", n: "vertice", a: "aresta", d: "apagar" };
  const tecla = e.key.toLowerCase();
  if (atalhos[tecla]) { escolherFerramenta(atalhos[tecla]); return; }
  if (e.key === "Escape") { cancelarPendente(); mapa.fecharPopup(); return; }

  if (painelResultado.temResultado()) {
    if (e.key === "ArrowRight") { e.preventDefault(); painelResultado.proximo(); }
    if (e.key === "ArrowLeft") { e.preventDefault(); painelResultado.anterior(); }
    if (e.key === " ") { e.preventDefault(); painelResultado.alternar(); }
  }
});

// ---------------------------------------------------------------------
// Início
// ---------------------------------------------------------------------

async function iniciar() {
  try {
    const resposta = await fetch("/static/dados/cidades.json");
    cidades = await resposta.json();
  } catch {
    avisar("Não consegui carregar as cidades.", true);
    return;
  }
  for (const c of cidades) $("#sel-cidade").add(new Option(c.nome, c.id));
  escolherFerramenta("mover");
  carregarCidade("rio");
}

iniciar();
