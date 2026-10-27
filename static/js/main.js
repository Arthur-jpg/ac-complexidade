// =====================================================================
// SmartNet Analyzer — ponto de entrada da interface.
// Liga o editor, os painéis e os botões.
// =====================================================================

import { api } from "./api.js";
import { Editor, RAIO } from "./editor.js";
import { EXEMPLOS } from "./exemplos.js";
import { grafoParaTexto, textoParaGrafo } from "./formato-texto.js";
import { PainelEstrutura } from "./painel-estrutura.js";
import { PainelResultado } from "./painel-resultado.js";
import { avisar, confirmarComSegundoClique, ordenarNomes } from "./ui.js";

const $ = (seletor) => document.querySelector(seletor);

const DICAS = {
  mover: "Arraste para mover · duplo clique no fundo cria um bairro · duplo clique no bairro renomeia · Shift + arrastar liga dois bairros",
  vertice: "Clique no quadro para criar um bairro",
  aresta: "Arraste de um bairro até outro (ou clique em um e depois no outro)",
  apagar: "Clique em um bairro ou em uma ligação para apagar",
};

let grafo = { direcionado: false, ponderado: true, vertices: [], arestas: [] };

// ---------------------------------------------------------------------
// Componentes
// ---------------------------------------------------------------------

const painelEstrutura = new PainelEstrutura({
  container: $("#estrutura"),
  metricas: $("#metricas"),
  chkMatriz: $("#chk-matriz"),
});

const painelResultado = new PainelResultado({
  container: $("#resultado"),
  aoMudarPasso: (visual, passo) => {
    editor.definirVisual(visual);
    painelEstrutura.destacar(passo ? passo.atual : null, passo ? passo.foco : null);
    $("#legenda").hidden = !visual;
  },
});

const editor = new Editor({
  svg: $("#canvas"),
  quadro: $("#quadro"),
  grafo,
  aoAlterar: aoAlterarGrafo,
  aoSelecionar: atualizarDica,
  avisar,
});

// ---------------------------------------------------------------------
// Quando o grafo muda
// ---------------------------------------------------------------------

let timerEstrutura = null;

function aoAlterarGrafo(tipo) {
  if (tipo !== "estrutura") return; // mover um vértice não muda o grafo
  if (painelResultado.temResultado()) painelResultado.limpar(); // resultado antigo não vale mais
  atualizarSeletores();
  atualizarDica();
  $("#vazio").hidden = grafo.vertices.length > 0;

  // pede ao back-end a lista de adjacência atualizada (com um pequeno atraso
  // para não disparar uma requisição a cada tecla)
  clearTimeout(timerEstrutura);
  timerEstrutura = setTimeout(async () => {
    try {
      painelEstrutura.atualizar(await api.estrutura(grafo));
    } catch (erro) {
      avisar(erro.message, true);
    }
  }, 120);
}

function trocarGrafo(novo) {
  grafo = novo;
  editor.substituirGrafo(grafo);
  $("#chk-direcionado").checked = grafo.direcionado;
  $("#chk-ponderado").checked = grafo.ponderado;
  aoAlterarGrafo("estrutura");
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
  let texto = DICAS[editor.ferramenta];
  const s = editor.selecao;
  if (s && s.tipo === "vertice") texto = `Selecionado: ${s.nome} · Delete apaga · duplo clique renomeia`;
  if (s && s.tipo === "aresta" && grafo.arestas[s.indice]) {
    const a = grafo.arestas[s.indice];
    texto = `Selecionada: ${a.origem}${grafo.direcionado ? " → " : " — "}${a.destino} · Delete apaga` +
      (grafo.ponderado ? " · clique no peso para editar" : "");
  }
  $("#dica").textContent = texto;
}

// Distribui os vértices num círculo (usado ao importar e no botão "Organizar")
function organizarEmCirculo(nomes) {
  const { largura, altura } = editor.tamanho();
  const raio = Math.max(60, Math.min(largura, altura) / 2 - RAIO - 30);
  const cx = largura / 2, cy = altura / 2;
  return ordenarNomes(nomes).map((nome, i, todos) => {
    const angulo = -Math.PI / 2 + (2 * Math.PI * i) / todos.length;
    return { nome, x: cx + raio * Math.cos(angulo), y: cy + raio * Math.sin(angulo) };
  });
}

// ---------------------------------------------------------------------
// Barra de ferramentas
// ---------------------------------------------------------------------

function escolherFerramenta(ferramenta) {
  editor.definirFerramenta(ferramenta);
  for (const botao of document.querySelectorAll(".ferramenta")) {
    botao.classList.toggle("ativa", botao.dataset.ferramenta === ferramenta);
  }
  atualizarDica();
}

for (const botao of document.querySelectorAll(".ferramenta")) {
  botao.addEventListener("click", () => escolherFerramenta(botao.dataset.ferramenta));
}

$("#chk-direcionado").addEventListener("change", (e) => {
  grafo.direcionado = e.target.checked;
  if (!grafo.direcionado) {
    // A→B e B→A viram a mesma aresta: fica só a primeira
    const vistas = new Set();
    const antes = grafo.arestas.length;
    grafo.arestas = grafo.arestas.filter((a) => {
      const chave = [a.origem, a.destino].sort().join("|");
      if (vistas.has(chave)) return false;
      vistas.add(chave);
      return true;
    });
    const removidas = antes - grafo.arestas.length;
    if (removidas) avisar(`${removidas} aresta(s) de ida e volta foram unidas em uma só.`);
  }
  editor.substituirGrafo(grafo);
  aoAlterarGrafo("estrutura");
});

$("#chk-ponderado").addEventListener("change", (e) => {
  grafo.ponderado = e.target.checked;
  editor.desenhar();
  aoAlterarGrafo("estrutura");
});

const selExemplo = $("#sel-exemplo");
EXEMPLOS.forEach((ex, i) => selExemplo.add(new Option(ex.nome, String(i))));
selExemplo.addEventListener("change", () => {
  const exemplo = EXEMPLOS[Number(selExemplo.value)];
  selExemplo.value = "";
  if (!exemplo) return;
  const { largura, altura } = editor.tamanho();
  trocarGrafo({
    direcionado: exemplo.direcionado,
    ponderado: exemplo.ponderado,
    vertices: exemplo.vertices.map(([nome, x, y]) => ({
      nome,
      x: RAIO + 10 + x * (largura - 2 * RAIO - 20),
      y: RAIO + 10 + y * (altura - 2 * RAIO - 20),
    })),
    arestas: exemplo.arestas.map(([origem, destino, peso]) => ({ origem, destino, peso })),
  });
});

$("#btn-organizar").addEventListener("click", () => {
  if (!grafo.vertices.length) return;
  const posicoes = organizarEmCirculo(grafo.vertices.map((v) => v.nome));
  for (const p of posicoes) Object.assign(grafo.vertices.find((v) => v.nome === p.nome), p);
  editor.desenhar();
});

confirmarComSegundoClique($("#btn-limpar"), "Confirmar?", () => {
  trocarGrafo({ direcionado: grafo.direcionado, ponderado: grafo.ponderado, vertices: [], arestas: [] });
});

// ---------- Importar / exportar ----------

const dlgImportar = $("#dlg-importar");

$("#btn-importar").addEventListener("click", () => {
  if (grafo.vertices.length && !$("#txt-importar").value) $("#txt-importar").value = grafoParaTexto(grafo);
  dlgImportar.showModal();
  $("#txt-importar").focus();
});

$("#arq-importar").addEventListener("change", async (e) => {
  const arquivo = e.target.files[0];
  if (arquivo) $("#txt-importar").value = await arquivo.text();
  e.target.value = "";
});

$("#form-importar").addEventListener("submit", (e) => {
  if (e.submitter?.value !== "confirmar") return; // cancelar: só fecha
  e.preventDefault();
  try {
    const lido = textoParaGrafo($("#txt-importar").value);
    trocarGrafo({
      direcionado: lido.direcionado,
      ponderado: lido.ponderado,
      vertices: organizarEmCirculo(lido.vertices),
      arestas: lido.arestas,
    });
    dlgImportar.close();
    avisar(`Grafo importado: ${lido.vertices.length} vértices, ${lido.arestas.length} arestas.`);
  } catch (erro) {
    avisar(erro.message, true);
  }
});

$("#btn-exportar").addEventListener("click", () => {
  if (!grafo.vertices.length) { avisar("O grafo está vazio."); return; }
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([grafoParaTexto(grafo)], { type: "text/plain" }));
  link.download = "grafo.txt";
  link.click();
  URL.revokeObjectURL(link.href);
});

// ---------------------------------------------------------------------
// Algoritmos
// ---------------------------------------------------------------------

const botoesAlgoritmo = document.querySelectorAll("[data-algoritmo]");

async function executar(algoritmo) {
  if (!grafo.vertices.length) { avisar("Crie o grafo antes de executar um algoritmo.", true); return; }
  const origem = $("#sel-origem").value;
  const destino = $("#sel-destino").value || null;

  for (const b of botoesAlgoritmo) {
    b.disabled = true;
    b.classList.toggle("ativo", b.dataset.algoritmo === algoritmo);
  }
  try {
    const resposta = await api.executar(grafo, algoritmo, origem, destino === origem ? null : destino);
    painelResultado.mostrar(resposta, grafo.direcionado);
  } catch (erro) {
    painelResultado.mostrarErro("Não foi possível executar", erro.message);
  } finally {
    for (const b of botoesAlgoritmo) b.disabled = false;
  }
}

for (const botao of botoesAlgoritmo) {
  botao.addEventListener("click", () => executar(botao.dataset.algoritmo));
}

// ---------------------------------------------------------------------
// Finalizar aplicação
// ---------------------------------------------------------------------

confirmarComSegundoClique($("#btn-finalizar"), "Clique de novo para finalizar", async () => {
  try { await api.finalizar(); } catch { /* o servidor já pode ter fechado */ }
  $("#finalizado").hidden = false;
});

// ---------------------------------------------------------------------
// Atalhos de teclado
// ---------------------------------------------------------------------

document.addEventListener("keydown", (e) => {
  if (e.target.closest("input, textarea, select") || dlgImportar.open) return;
  if (e.ctrlKey || e.metaKey || e.altKey) return;

  const atalhos = { v: "mover", n: "vertice", a: "aresta", d: "apagar" };
  const tecla = e.key.toLowerCase();
  if (atalhos[tecla]) { escolherFerramenta(atalhos[tecla]); return; }

  if (e.key === "Delete" || e.key === "Backspace") { e.preventDefault(); editor.apagarSelecao(); return; }
  if (e.key === "Escape") { editor.cancelar(); return; }

  if (painelResultado.temResultado()) {
    if (e.key === "ArrowRight") { e.preventDefault(); painelResultado.proximo(); }
    if (e.key === "ArrowLeft") { e.preventDefault(); painelResultado.anterior(); }
    if (e.key === " ") { e.preventDefault(); painelResultado.alternar(); }
  }
});

// Se a janela diminuir, traz de volta os vértices que ficaram fora do quadro
window.addEventListener("resize", () => {
  const { largura, altura } = editor.tamanho();
  for (const v of grafo.vertices) {
    v.x = Math.max(RAIO, Math.min(largura - RAIO, v.x));
    v.y = Math.max(RAIO, Math.min(altura - RAIO, v.y));
  }
  editor.desenhar();
});

// ---------------------------------------------------------------------
// Início
// ---------------------------------------------------------------------

escolherFerramenta("mover");
aoAlterarGrafo("estrutura");
