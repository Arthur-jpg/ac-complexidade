// =====================================================================
// Painel de resultado: seções em texto/tabela + player da animação.
//
// O back-end devolve:
//   secoes -> o que mostrar como texto/tabela
//   passos -> o "diário" do algoritmo; o player avança por ele e o
//             editor acende vértices e arestas de acordo
// =====================================================================

import { chaveAresta } from "./editor.js";
import { escapar } from "./ui.js";

const INTERVALO_BASE = 900; // ms por passo na velocidade 1x

const ICONES = {
  inicio: '<svg viewBox="0 0 16 16"><path d="M3 3h2v10H3zM13 3v10L6 8z"/></svg>',
  anterior: '<svg viewBox="0 0 16 16"><path d="M12 3v10L5 8z"/></svg>',
  tocar: '<svg viewBox="0 0 16 16"><path d="M4 2.5v11L13 8z"/></svg>',
  pausar: '<svg viewBox="0 0 16 16"><path d="M4 3h3v10H4zM9 3h3v10H9z"/></svg>',
  proximo: '<svg viewBox="0 0 16 16"><path d="M4 3v10l7-5z"/></svg>',
  fim: '<svg viewBox="0 0 16 16"><path d="M11 3h2v10h-2zM3 3v10l7-5z"/></svg>',
};

export class PainelResultado {
  constructor({ container, aoMudarPasso }) {
    this.container = container;
    this.vazioHTML = container.innerHTML;
    this.aoMudarPasso = aoMudarPasso; // (visual, passo) => void
    this.resposta = null;
    this.passo = 0;
    this.timer = null;
    this.velocidade = 1;
  }

  temResultado() {
    return !!this.resposta;
  }

  limpar() {
    this.pausar();
    this.resposta = null;
    this.container.innerHTML = this.vazioHTML;
    this.aoMudarPasso(null, null);
  }

  mostrarErro(titulo, mensagem) {
    this.pausar();
    this.resposta = null;
    this.aoMudarPasso(null, null);
    this.container.innerHTML =
      `<div class="erro"><strong>${escapar(titulo)}</strong>${escapar(mensagem)}</div>`;
  }

  mostrar(resposta, direcionado) {
    this.pausar();
    this.resposta = resposta;
    this.direcionado = direcionado;
    this.container.replaceChildren();

    const cabecalho = document.createElement("div");
    cabecalho.innerHTML = `
      <div class="cabecalho-resultado">
        <h3>${escapar(resposta.titulo)}</h3>
        <span class="complexidade" title="Complexidade de tempo">${escapar(resposta.complexidade.tempo)}</span>
      </div>
      <p class="explicacao">${escapar(resposta.complexidade.explicacao)} Memória extra: ${escapar(resposta.complexidade.memoria)}.</p>`;
    this.container.appendChild(cabecalho);

    this.container.appendChild(this._montarPlayer());
    for (const secao of resposta.secoes) this.container.appendChild(this._montarSecao(secao));

    this.irPara(0);
    this.tocar();
  }

  // ------------------------------------------------------------------
  // Player
  // ------------------------------------------------------------------

  _montarPlayer() {
    const total = this.resposta.passos.length;
    const player = document.createElement("div");
    player.className = "player";
    player.innerHTML = `
      <div class="controles">
        <button data-acao="inicio" title="Primeiro passo">${ICONES.inicio}</button>
        <button data-acao="anterior" title="Passo anterior (←)">${ICONES.anterior}</button>
        <button data-acao="tocar" class="tocar" title="Tocar / pausar (espaço)">${ICONES.pausar}</button>
        <button data-acao="proximo" title="Próximo passo (→)">${ICONES.proximo}</button>
        <button data-acao="fim" title="Último passo">${ICONES.fim}</button>
        <select data-acao="velocidade" title="Velocidade">
          <option value="0.5">0,5×</option><option value="1" selected>1×</option>
          <option value="2">2×</option><option value="4">4×</option>
        </select>
        <span class="contador"></span>
      </div>
      <input type="range" min="0" max="${total - 1}" value="0" aria-label="Passo da animação">
      <p class="descricao-passo"></p>
      <div class="estrutura-passo"></div>`;

    player.querySelector('[data-acao="inicio"]').onclick = () => { this.pausar(); this.irPara(0); };
    player.querySelector('[data-acao="anterior"]').onclick = () => this.anterior();
    player.querySelector('[data-acao="proximo"]').onclick = () => this.proximo();
    player.querySelector('[data-acao="fim"]').onclick = () => { this.pausar(); this.irPara(total - 1); };
    player.querySelector('[data-acao="tocar"]').onclick = () => this.alternar();
    const velocidade = player.querySelector('[data-acao="velocidade"]');
    velocidade.value = String(this.velocidade);
    velocidade.onchange = () => {
      this.velocidade = Number(velocidade.value);
      if (this.timer) { this.pausar(); this.tocar(); }
    };
    player.querySelector("input[type=range]").oninput = (e) => { this.pausar(); this.irPara(Number(e.target.value)); };

    this.elPlayer = player;
    return player;
  }

  irPara(k) {
    const passos = this.resposta.passos;
    this.passo = Math.max(0, Math.min(passos.length - 1, k));
    const passo = passos[this.passo];

    this.elPlayer.querySelector(".contador").textContent = `${this.passo + 1} / ${passos.length}`;
    this.elPlayer.querySelector("input[type=range]").value = this.passo;
    this.elPlayer.querySelector(".descricao-passo").textContent = passo.descricao;

    const estrutura = this.elPlayer.querySelector(".estrutura-passo");
    if (passo.estrutura) {
      const itens = passo.estrutura.itens.length
        ? passo.estrutura.itens.map((i) => `<span class="ficha">${escapar(i)}</span>`).join("")
        : '<span class="vazia">vazia</span>';
      estrutura.innerHTML = `<span class="nome-estrutura">${escapar(passo.estrutura.nome)}</span>${itens}`;
    } else {
      estrutura.innerHTML = "";
    }

    this.aoMudarPasso(this._estadoNoPasso(this.passo), passo);
  }

  proximo() { this.pausar(); this.irPara(this.passo + 1); }
  anterior() { this.pausar(); this.irPara(this.passo - 1); }

  alternar() {
    if (!this.resposta) return;
    if (this.timer) this.pausar();
    else this.tocar();
  }

  tocar() {
    if (!this.resposta) return;
    if (this.passo >= this.resposta.passos.length - 1) this.irPara(0);
    this.timer = setInterval(() => {
      if (this.passo >= this.resposta.passos.length - 1) { this.pausar(); return; }
      this.irPara(this.passo + 1);
    }, INTERVALO_BASE / this.velocidade);
    this._iconeTocar(false);
  }

  pausar() {
    clearInterval(this.timer);
    this.timer = null;
    this._iconeTocar(true);
  }

  _iconeTocar(pausado) {
    const botao = this.elPlayer?.querySelector('[data-acao="tocar"]');
    if (botao && this.resposta) botao.innerHTML = pausado ? ICONES.tocar : ICONES.pausar;
  }

  // Junta as mudanças dos passos 0..k: é o que deve aparecer no desenho
  _estadoNoPasso(k) {
    const visual = { vertices: {}, arestas: {}, rotulos: {}, atual: null, foco: null };
    const passos = this.resposta.passos;
    for (let i = 0; i <= k; i++) {
      const passo = passos[i];
      Object.assign(visual.vertices, passo.vertices);
      Object.assign(visual.rotulos, passo.rotulos);
      for (const [u, v, estado] of passo.arestas) {
        const chave = chaveAresta(u, v, this.direcionado);
        if (estado === "normal") delete visual.arestas[chave];
        else visual.arestas[chave] = estado;
      }
    }
    visual.atual = passos[k].atual;
    visual.foco = passos[k].foco;
    return visual;
  }

  // ------------------------------------------------------------------
  // Seções (texto / tabela)
  // ------------------------------------------------------------------

  _montarSecao(secao) {
    const div = document.createElement("div");
    div.className = "secao";
    let corpo = "";

    if (secao.tipo === "sequencia") {
      corpo = '<div class="sequencia">' +
        secao.itens.map((i) => `<span class="ficha">${escapar(i)}</span>`).join('<span class="seta">→</span>') +
        "</div>";
    } else if (secao.tipo === "arvore") {
      corpo = `<pre class="arvore-texto">${escapar(secao.conteudo)}</pre>`;
    } else if (secao.tipo === "destaque") {
      corpo = `<div class="destaque">${escapar(secao.conteudo)}</div>`;
    } else if (secao.tipo === "tabela") {
      const cabecalho = secao.colunas.map((c) => `<th>${escapar(c)}</th>`).join("");
      const linhas = secao.linhas
        .map((l) => "<tr>" + l.map((c) => `<td>${escapar(c)}</td>`).join("") + "</tr>")
        .join("");
      corpo = `<div class="tabela-envolve"><table class="tabela"><thead><tr>${cabecalho}</tr></thead><tbody>${linhas}</tbody></table></div>`;
    } else {
      corpo = `<p class="texto-secao">${escapar(secao.conteudo)}</p>`;
    }

    div.innerHTML = `<h4>${escapar(secao.titulo)}</h4>${corpo}`;
    return div;
  }
}
