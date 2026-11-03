// =====================================================================
// Editor do grafo: desenha em SVG e trata cliques/arrastos.
//
// O editor só cuida do DESENHO. O grafo de verdade (lista de adjacência)
// e os algoritmos ficam no back-end, em Python.
//
// Modelo usado aqui na tela:
//   grafo = {
//     direcionado: bool, ponderado: bool,
//     vertices: [{ nome, x, y }],
//     arestas:  [{ origem, destino, peso }]
//   }
// =====================================================================

const SVG_NS = "http://www.w3.org/2000/svg";
export const RAIO = 22;

// Chave única de uma aresta. No não-direcionado A—B e B—A são a mesma aresta.
export function chaveAresta(u, v, direcionado) {
  if (direcionado) return `${u}>${v}`;
  return u < v ? `${u}|${v}` : `${v}|${u}`;
}

// Próximo nome livre: A, B, ..., Z, AA, AB, ...
export function proximoNome(vertices) {
  const usados = new Set(vertices.map((v) => v.nome));
  for (let n = 0; ; n++) {
    let nome = "";
    let i = n;
    do {
      nome = String.fromCharCode(65 + (i % 26)) + nome;
      i = Math.floor(i / 26) - 1;
    } while (i >= 0);
    if (!usados.has(nome)) return nome;
  }
}

function el(tag, atributos = {}, pai = null) {
  const elemento = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(atributos)) elemento.setAttribute(k, v);
  if (pai) pai.appendChild(elemento);
  return elemento;
}

export class Editor {
  constructor({ svg, quadro, grafo, aoAlterar, aoSelecionar, avisar }) {
    this.svg = svg;
    this.quadro = quadro;
    this.grafo = grafo;
    this.aoAlterar = aoAlterar;       // (tipo) => void   tipo: "estrutura" | "posicao"
    this.aoSelecionar = aoSelecionar; // (selecao) => void
    this.avisar = avisar;

    this.ferramenta = "mover";
    this.selecao = null;   // { tipo: "vertice", nome } | { tipo: "aresta", indice }
    this.pendente = null;  // origem escolhida no modo "clique, clique" da ferramenta aresta
    this.arrasto = null;
    this.visual = null;    // estado da animação (vem do painel de resultado)
    this.inputInline = null;

    this._montarCamadas();
    this._ligarEventos();
    this.desenhar();
  }

  // ------------------------------------------------------------------
  // API usada pelo main.js
  // ------------------------------------------------------------------

  definirFerramenta(ferramenta) {
    this.ferramenta = ferramenta;
    this.pendente = null;
    this.quadro.dataset.ferramenta = ferramenta;
    this.desenhar();
  }

  definirVisual(visual) {
    this.visual = visual;
    this.desenhar();
  }

  substituirGrafo(grafo) {
    this.grafo = grafo;
    this.selecao = null;
    this.pendente = null;
    this._fecharInline(false);
    this.desenhar();
  }

  apagarSelecao() {
    if (!this.selecao) return;
    if (this.selecao.tipo === "vertice") this._removerVertice(this.selecao.nome);
    else this._removerAresta(this.selecao.indice);
  }

  cancelar() {
    this.pendente = null;
    this._selecionar(null);
    this._fecharInline(false);
  }

  tamanho() {
    const r = this.svg.getBoundingClientRect();
    return { largura: r.width, altura: r.height };
  }

  // ------------------------------------------------------------------
  // Desenho
  // ------------------------------------------------------------------

  _montarCamadas() {
    const defs = el("defs", {}, this.svg);
    const grade = el("pattern", { id: "grade", width: 24, height: 24, patternUnits: "userSpaceOnUse" }, defs);
    el("circle", { cx: 1, cy: 1, r: 1, fill: "#dcdcdc" }, grade);
    for (const [id, cor] of [["seta", "#3a3a3a"], ["seta-preta", "#111"], ["seta-clara", "#d6d6d6"], ["seta-cinza", "#a3a3a3"]]) {
      const m = el("marker", {
        id, viewBox: "0 0 10 10", refX: 9, refY: 5,
        markerWidth: 11, markerHeight: 11, markerUnits: "userSpaceOnUse", orient: "auto-start-reverse",
      }, defs);
      el("path", { d: "M0,0 L10,5 L0,10 z", fill: cor }, m);
    }
    this.fundo = el("rect", { width: "100%", height: "100%", fill: "url(#grade)", "data-fundo": "1" }, this.svg);
    this.camadaArestas = el("g", {}, this.svg);
    this.camadaElastico = el("g", {}, this.svg);
    this.camadaVertices = el("g", {}, this.svg);
  }

  desenhar() {
    this.camadaArestas.replaceChildren();
    this.camadaVertices.replaceChildren();
    this.svg.classList.toggle("modo-resultado", !!this.visual);

    this.grafo.arestas.forEach((aresta, i) => this._desenharAresta(aresta, i));
    for (const vertice of this.grafo.vertices) this._desenharVertice(vertice);
  }

  _posicao(nome) {
    return this.grafo.vertices.find((v) => v.nome === nome);
  }

  _temReversa(aresta) {
    return this.grafo.arestas.some((a) => a.origem === aresta.destino && a.destino === aresta.origem);
  }

  _geometria(aresta) {
    const a = this._posicao(aresta.origem);
    const b = this._posicao(aresta.destino);
    const dx = b.x - a.x, dy = b.y - a.y;
    const dist = Math.hypot(dx, dy) || 1;
    const curva = this.grafo.direcionado && this._temReversa(aresta);

    // ponto de controle: no meio, ou deslocado para o lado quando há ida e volta
    const meio = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    const c = curva ? { x: meio.x - (dy / dist) * 30, y: meio.y + (dx / dist) * 30 } : meio;

    // corta a linha na borda dos círculos, para a seta não ficar escondida
    const corte = (p, alvo, r) => {
      const ddx = alvo.x - p.x, ddy = alvo.y - p.y;
      const d = Math.hypot(ddx, ddy) || 1;
      return { x: p.x + (ddx / d) * r, y: p.y + (ddy / d) * r };
    };
    const ini = corte(a, c, RAIO);
    const fim = corte(b, c, RAIO + (this.grafo.direcionado ? 2 : 0));
    const d = curva ? `M${ini.x},${ini.y} Q${c.x},${c.y} ${fim.x},${fim.y}` : `M${ini.x},${ini.y} L${fim.x},${fim.y}`;
    const rotulo = curva
      ? { x: 0.25 * ini.x + 0.5 * c.x + 0.25 * fim.x, y: 0.25 * ini.y + 0.5 * c.y + 0.25 * fim.y }
      : meio;
    return { d, rotulo };
  }

  _estadoAresta(aresta) {
    if (!this.visual) return { estado: null, foco: false };
    const chave = chaveAresta(aresta.origem, aresta.destino, this.grafo.direcionado);
    const foco = this.visual.foco
      ? chaveAresta(this.visual.foco[0], this.visual.foco[1], this.grafo.direcionado) === chave
      : false;
    return { estado: this.visual.arestas[chave] || null, foco };
  }

  _desenharAresta(aresta, indice) {
    const { d, rotulo } = this._geometria(aresta);
    const { estado, foco } = this._estadoAresta(aresta);
    const classes = ["aresta"];
    if (estado) classes.push("estado-" + estado);
    if (foco) classes.push("foco");
    if (this.selecao?.tipo === "aresta" && this.selecao.indice === indice) classes.push("selecionada");

    const g = el("g", { class: classes.join(" "), "data-aresta": indice }, this.camadaArestas);
    el("path", { class: "alvo", d }, g);
    const linha = el("path", { class: "linha", d }, g);
    if (this.grafo.direcionado) {
      let seta = "seta";
      if (this.visual) seta = foco || estado === "arvore" || estado === "caminho" ? "seta-preta" : estado === "rejeitada" ? "seta-cinza" : "seta-clara";
      else if (classes.includes("selecionada")) seta = "seta-preta";
      linha.setAttribute("marker-end", `url(#${seta})`);
    }

    if (this.grafo.ponderado) {
      const texto = String(aresta.peso);
      const largura = 12 + texto.length * 7.4;
      const p = el("g", { class: "peso", "data-peso": indice, transform: `translate(${rotulo.x},${rotulo.y})` }, g);
      el("rect", { x: -largura / 2, y: -10, width: largura, height: 20, rx: 5 }, p);
      el("text", {}, p).textContent = texto;
    }
  }

  _desenharVertice(vertice) {
    const classes = ["vertice"];
    const estado = this.visual?.vertices[vertice.nome];
    if (estado) classes.push("estado-" + estado);
    if (this.selecao?.tipo === "vertice" && this.selecao.nome === vertice.nome) classes.push("selecionado");
    if (this.pendente === vertice.nome) classes.push("pendente");

    const g = el("g", { class: classes.join(" "), "data-vertice": vertice.nome, transform: `translate(${vertice.x},${vertice.y})` }, this.camadaVertices);
    el("circle", { class: "halo", r: RAIO + 6 }, g);
    if (this.visual?.atual === vertice.nome) el("circle", { class: "anel", r: RAIO + 2 }, g);
    el("circle", { class: "corpo", r: RAIO }, g);
    el("text", { class: "nome" }, g).textContent = vertice.nome;

    const rotulo = this.visual?.rotulos[vertice.nome];
    if (rotulo !== undefined) {
      const largura = 12 + String(rotulo).length * 7;
      const r = el("g", { class: "rotulo", transform: `translate(${RAIO - 2},${-RAIO + 2})` }, g);
      el("rect", { x: -4, y: -9, width: largura, height: 18, rx: 9 }, r);
      el("text", { x: largura / 2 - 4 }, r).textContent = rotulo;
    }
  }

  // ------------------------------------------------------------------
  // Eventos do mouse
  // ------------------------------------------------------------------

  _ligarEventos() {
    this.svg.addEventListener("pointerdown", (e) => this._aoPressionar(e));
    this.svg.addEventListener("pointermove", (e) => this._aoMover(e));
    this.svg.addEventListener("pointerup", (e) => this._aoSoltar(e));
    this.svg.addEventListener("dblclick", (e) => this._aoDuploClique(e));
  }

  _coordenadas(e) {
    const r = this.svg.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  // Descobre em que o usuário clicou: vértice, peso, aresta ou fundo
  _alvo(elemento) {
    const v = elemento.closest?.("[data-vertice]");
    if (v) return { tipo: "vertice", nome: v.dataset.vertice };
    const p = elemento.closest?.("[data-peso]");
    if (p) return { tipo: "peso", indice: Number(p.dataset.peso) };
    const a = elemento.closest?.("[data-aresta]");
    if (a) return { tipo: "aresta", indice: Number(a.dataset.aresta) };
    return { tipo: "fundo" };
  }

  _aoPressionar(e) {
    if (e.button !== 0) return;
    if (this.inputInline) this._fecharInline(true);
    const alvo = this._alvo(e.target);
    const p = this._coordenadas(e);

    if (this.ferramenta === "apagar") {
      if (alvo.tipo === "vertice") this._removerVertice(alvo.nome);
      else if (alvo.tipo === "aresta" || alvo.tipo === "peso") this._removerAresta(alvo.indice);
      return;
    }

    if (alvo.tipo === "vertice") {
      if (this.ferramenta === "aresta" || e.shiftKey) {
        if (this.pendente && this.pendente !== alvo.nome) {
          e.preventDefault(); // senão o mousedown que vem depois tira o foco da caixa de peso
          this._criarAresta(this.pendente, alvo.nome);
          this.pendente = null;
          this.desenhar();
          return;
        }
        this.arrasto = { tipo: "aresta", origem: alvo.nome };
      } else {
        const v = this._posicao(alvo.nome);
        this.arrasto = { tipo: "mover", nome: alvo.nome, dx: v.x - p.x, dy: v.y - p.y };
        this._selecionar({ tipo: "vertice", nome: alvo.nome });
      }
      this.svg.setPointerCapture(e.pointerId);
      return;
    }

    if (alvo.tipo === "aresta" || alvo.tipo === "peso") {
      this._selecionar({ tipo: "aresta", indice: alvo.indice });
      if (alvo.tipo === "peso") {
        e.preventDefault(); // senão o mousedown que vem depois tira o foco da caixa e ela fecha na hora
        this._editarPeso(alvo.indice);
      }
      return;
    }

    // fundo
    if (this.ferramenta === "vertice") {
      this._criarVertice(p.x, p.y);
      return;
    }
    this.pendente = null;
    this._selecionar(null);
  }

  _aoMover(e) {
    if (!this.arrasto) return;
    const p = this._coordenadas(e);
    const { largura, altura } = this.tamanho();

    if (this.arrasto.tipo === "mover") {
      const v = this._posicao(this.arrasto.nome);
      v.x = Math.max(RAIO, Math.min(largura - RAIO, p.x + this.arrasto.dx));
      v.y = Math.max(RAIO, Math.min(altura - RAIO, p.y + this.arrasto.dy));
      this.arrasto.moveu = true;
      this.desenhar();
    } else {
      const o = this._posicao(this.arrasto.origem);
      this.camadaElastico.replaceChildren();
      el("line", { class: "elastico", x1: o.x, y1: o.y, x2: p.x, y2: p.y }, this.camadaElastico);
    }
  }

  _aoSoltar(e) {
    if (!this.arrasto) return;
    const arrasto = this.arrasto;
    this.arrasto = null;
    this.camadaElastico.replaceChildren();

    if (arrasto.tipo === "mover") {
      if (arrasto.moveu) this.aoAlterar("posicao");
      return;
    }

    // soltou a aresta: em cima de qual vértice?
    const embaixo = document.elementFromPoint(e.clientX, e.clientY);
    const alvo = embaixo ? this._alvo(embaixo) : { tipo: "fundo" };
    if (alvo.tipo === "vertice" && alvo.nome !== arrasto.origem) {
      this._criarAresta(arrasto.origem, alvo.nome);
      this.pendente = null;
    } else if (alvo.tipo === "vertice") {
      this.pendente = arrasto.origem; // modo "clique, clique": agora escolha o destino
    } else {
      this.pendente = null;
    }
    this.desenhar();
  }

  _aoDuploClique(e) {
    if (this.ferramenta === "apagar") return;
    const alvo = this._alvo(e.target);
    if (alvo.tipo === "fundo" && this.ferramenta !== "vertice") {
      const p = this._coordenadas(e);
      this._criarVertice(p.x, p.y);
    } else if (alvo.tipo === "vertice") {
      this._renomear(alvo.nome);
    } else if (alvo.tipo === "aresta" || alvo.tipo === "peso") {
      this._editarPeso(alvo.indice);
    }
  }

  // ------------------------------------------------------------------
  // Alterações no grafo
  // ------------------------------------------------------------------

  _selecionar(selecao) {
    this.selecao = selecao;
    this.desenhar();
    this.aoSelecionar(selecao);
  }

  _criarVertice(x, y) {
    const nome = proximoNome(this.grafo.vertices);
    this.grafo.vertices.push({ nome, x, y });
    this.selecao = { tipo: "vertice", nome };
    this.aoAlterar("estrutura");
    this.desenhar();
  }

  _indiceAresta(u, v) {
    return this.grafo.arestas.findIndex((a) =>
      (a.origem === u && a.destino === v) ||
      (!this.grafo.direcionado && a.origem === v && a.destino === u));
  }

  _criarAresta(u, v) {
    const existente = this._indiceAresta(u, v);
    if (existente >= 0) {
      this._selecionar({ tipo: "aresta", indice: existente });
      if (this.grafo.ponderado) this._editarPeso(existente);
      else this.avisar(`A aresta ${u}—${v} já existe.`);
      return;
    }
    this.grafo.arestas.push({ origem: u, destino: v, peso: 1 });
    const indice = this.grafo.arestas.length - 1;
    this.selecao = { tipo: "aresta", indice };
    this.aoAlterar("estrutura");
    this.desenhar();
    if (this.grafo.ponderado) this._editarPeso(indice);
  }

  _removerVertice(nome) {
    this.grafo.vertices = this.grafo.vertices.filter((v) => v.nome !== nome);
    this.grafo.arestas = this.grafo.arestas.filter((a) => a.origem !== nome && a.destino !== nome);
    this.selecao = null;
    this.pendente = null;
    this.aoAlterar("estrutura");
    this.desenhar();
    this.aoSelecionar(null);
  }

  _removerAresta(indice) {
    this.grafo.arestas.splice(indice, 1);
    this.selecao = null;
    this.aoAlterar("estrutura");
    this.desenhar();
    this.aoSelecionar(null);
  }

  _editarPeso(indice) {
    if (!this.grafo.ponderado) return;
    const aresta = this.grafo.arestas[indice];
    const { rotulo } = this._geometria(aresta);
    this._abrirInline(rotulo, String(aresta.peso), (texto) => {
      const valor = Number(texto.replace(",", "."));
      if (texto.trim() === "" || !Number.isFinite(valor)) return "O peso precisa ser um número.";
      aresta.peso = valor;
      this.aoAlterar("estrutura");
      this.desenhar();
      return null;
    });
  }

  _renomear(nome) {
    const vertice = this._posicao(nome);
    this._abrirInline(vertice, nome, (texto) => {
      const novo = texto.trim();
      if (novo === "" || novo === nome) return null;
      if (/\s/.test(novo)) return "O nome não pode ter espaços.";
      if (this.grafo.vertices.some((v) => v.nome === novo)) return `Já existe um vértice chamado ${novo}.`;
      vertice.nome = novo;
      for (const a of this.grafo.arestas) {
        if (a.origem === nome) a.origem = novo;
        if (a.destino === nome) a.destino = novo;
      }
      this.selecao = { tipo: "vertice", nome: novo };
      this.aoAlterar("estrutura");
      this.desenhar();
      return null;
    });
  }

  // Caixinha de texto flutuante usada para editar peso e nome
  _abrirInline(ponto, valor, aoConfirmar) {
    this._fecharInline(false);
    const input = document.createElement("input");
    input.className = "editor-inline";
    input.value = valor;
    input.style.left = ponto.x + "px";
    input.style.top = ponto.y + "px";
    input.addEventListener("keydown", (e) => {
      e.stopPropagation();
      if (e.key === "Enter") this._fecharInline(true);
      if (e.key === "Escape") this._fecharInline(false);
    });
    input.addEventListener("blur", () => this._fecharInline(true));
    this.inputInline = { input, aoConfirmar };
    this.quadro.appendChild(input);
    input.focus();
    input.select();
  }

  _fecharInline(confirmar) {
    const atual = this.inputInline;
    if (!atual) return;
    if (confirmar) {
      const erro = atual.aoConfirmar(atual.input.value);
      if (erro) {
        this.avisar(erro, true);
        atual.input.focus();
        atual.input.select();
        return;
      }
    }
    this.inputInline = null;
    atual.input.remove();
  }
}
