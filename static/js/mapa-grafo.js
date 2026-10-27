// =====================================================================
// Desenho do grafo em cima do mapa real (Leaflet).
//
// Faz no mapa o mesmo papel que o editor.js faz no quadro branco: só
// DESENHA. Os pontos são os vértices, as vias são as arestas, e o
// desenho de cada via segue as ruas de verdade.
//
// Modelo usado aqui:
//   grafo = {
//     vertices: [{ nome, lat, lng }],
//     arestas:  [{ origem, destino, peso, km, minutos, reta, geometria: [[lat, lng], ...] }]
//   }
// =====================================================================

import { chaveAresta } from "./editor.js";

const MAPA_DE_FUNDO = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const CREDITOS = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> · rotas: OSRM';

export class MapaGrafo {
  constructor({ elemento, aoClicarMapa, aoClicarVertice, aoClicarAresta }) {
    this.elemento = elemento;
    this.mapa = L.map(elemento, { zoomControl: true, attributionControl: true });
    L.tileLayer(MAPA_DE_FUNDO, { maxZoom: 19, attribution: CREDITOS }).addTo(this.mapa);

    this.camadaVias = L.layerGroup().addTo(this.mapa);
    this.camadaPontos = L.layerGroup().addTo(this.mapa);
    this.pontos = {}; // nome  -> marcador
    this.vias = {};   // chave -> { linha, aresta }
    this.visual = null;
    this.grafo = null;
    this.opcoes = {};

    this.mapa.on("click", (e) => aoClicarMapa(e.latlng));
    this.aoClicarVertice = aoClicarVertice;
    this.aoClicarAresta = aoClicarAresta;
  }

  irPara(centro, zoom) {
    this.mapa.setView(centro, zoom);
  }

  enquadrar() {
    const pontos = this.grafo.vertices.map((v) => [v.lat, v.lng]);
    if (pontos.length > 1) this.mapa.fitBounds(pontos, { padding: [40, 40] });
  }

  popup(latlng, conteudo) {
    return L.popup({ className: "popup-smartnet", maxWidth: 260 }).setLatLng(latlng).setContent(conteudo).openOn(this.mapa);
  }

  fecharPopup() {
    this.mapa.closePopup();
  }

  // ------------------------------------------------------------------
  // Desenho
  // ------------------------------------------------------------------

  // opcoes: { mostrarPesos, linhaReta }
  desenhar(grafo, opcoes) {
    this.grafo = grafo;
    this.opcoes = opcoes;
    this.pararRota();
    this.camadaVias.clearLayers();
    this.camadaPontos.clearLayers();
    this.pontos = {};
    this.vias = {};

    grafo.arestas.forEach((aresta, indice) => {
      const pontos = this.geometria(aresta);
      const linha = L.polyline(pontos, { className: "via", weight: 4, interactive: false });
      const alvo = L.polyline(pontos, { className: "via-alvo", weight: 18, opacity: 0 });
      alvo.on("click", (e) => { L.DomEvent.stop(e); this.aoClicarAresta(indice, e.latlng); });
      if (opcoes.mostrarPesos) {
        alvo.bindTooltip(String(aresta.peso), { permanent: true, direction: "center", className: "peso-via" });
      }
      this.camadaVias.addLayer(linha);
      this.camadaVias.addLayer(alvo);
      this.vias[chaveAresta(aresta.origem, aresta.destino, false)] = { linha, alvo, aresta };
    });

    for (const vertice of grafo.vertices) {
      const icone = L.divIcon({
        className: "pino",
        html: '<span class="ponto"></span><span class="nome"></span><span class="rotulo"></span>',
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      });
      const marcador = L.marker([vertice.lat, vertice.lng], { icon: icone, keyboard: false, riseOnHover: true });
      marcador.on("click", (e) => { L.DomEvent.stop(e); this.aoClicarVertice(vertice.nome, e.latlng); });
      this.camadaPontos.addLayer(marcador);
      marcador.getElement().querySelector(".nome").textContent = vertice.nome;
      this.pontos[vertice.nome] = marcador;
    }

    this._aplicarVisual();
  }

  // Desenho da via: pelas ruas, ou um segmento reto quando o peso é "linha reta"
  geometria(aresta) {
    if (this.opcoes.linhaReta || !aresta.geometria || aresta.geometria.length < 2) {
      const u = this._vertice(aresta.origem), v = this._vertice(aresta.destino);
      return [[u.lat, u.lng], [v.lat, v.lng]];
    }
    return aresta.geometria;
  }

  _vertice(nome) {
    return this.grafo.vertices.find((v) => v.nome === nome);
  }

  marcarPendente(nome) {
    for (const [n, marcador] of Object.entries(this.pontos)) {
      marcador.getElement().classList.toggle("pendente", n === nome);
    }
  }

  // ------------------------------------------------------------------
  // Estados da animação (mesmo formato do quadro branco)
  // ------------------------------------------------------------------

  definirVisual(visual) {
    this.visual = visual;
    this._aplicarVisual();
  }

  _aplicarVisual() {
    const visual = this.visual;
    this.elemento.classList.toggle("modo-resultado", !!visual);

    for (const [nome, marcador] of Object.entries(this.pontos)) {
      const el = marcador.getElement();
      const estado = visual ? visual.vertices[nome] : null;
      el.className = el.className.replace(/\s?estado-\w+|\s?atual/g, "");
      if (estado) el.classList.add("estado-" + estado);
      if (visual && visual.atual === nome) el.classList.add("atual");
      const rotulo = visual ? visual.rotulos[nome] : undefined;
      const elRotulo = el.querySelector(".rotulo");
      elRotulo.textContent = rotulo === undefined ? "" : rotulo;
      elRotulo.hidden = rotulo === undefined;
      marcador.setZIndexOffset(estado ? 500 : 0);
    }

    const chaveFoco = visual && visual.foco ? chaveAresta(visual.foco[0], visual.foco[1], false) : null;
    for (const [chave, { linha }] of Object.entries(this.vias)) {
      const el = linha.getElement();
      if (!el) continue;
      el.setAttribute("class", "via");
      const estado = visual ? visual.arestas[chave] : null;
      if (estado) el.classList.add("estado-" + estado);
      if (chave === chaveFoco) el.classList.add("foco");
      if (estado || chave === chaveFoco) linha.bringToFront();
    }
  }

  // ------------------------------------------------------------------
  // Rota final: um "carro" percorre o caminho pelas ruas
  // ------------------------------------------------------------------

  // pares: [[u, v], ...] na ordem do caminho
  animarRota(pares) {
    this.pararRota();
    const pontos = [];
    for (const [u, v] of pares) {
      const item = this.vias[chaveAresta(u, v, false)];
      if (!item) continue;
      let trecho = this.geometria(item.aresta);
      if (item.aresta.origem !== u) trecho = [...trecho].reverse();
      pontos.push(...(pontos.length ? trecho.slice(1) : trecho));
    }
    if (pontos.length < 2) return;
    this.elemento.classList.add("com-rota");

    const acumulado = [0];
    for (let i = 1; i < pontos.length; i++) {
      acumulado.push(acumulado[i - 1] + this.mapa.distance(pontos[i - 1], pontos[i]));
    }
    const total = acumulado[acumulado.length - 1];
    const duracao = Math.min(7000, Math.max(2500, total * 0.18)); // ~0,18 ms por metro

    this.rastroFundo = L.polyline([pontos[0]], { className: "rastro-fundo", weight: 11, interactive: false }).addTo(this.mapa);
    this.rastro = L.polyline([pontos[0]], { className: "rastro", weight: 6, interactive: false }).addTo(this.mapa);
    this.carro = L.marker(pontos[0], {
      icon: L.divIcon({ className: "carro", html: "<span></span>", iconSize: [22, 22], iconAnchor: [11, 11] }),
      interactive: false, keyboard: false, zIndexOffset: 1000,
    }).addTo(this.mapa);
    this.mapa.flyToBounds(L.latLngBounds(pontos), { padding: [60, 60], duration: 0.7 });

    const inicio = performance.now() + 750; // espera o mapa terminar de enquadrar
    let i = 0;
    const quadro = (agora) => {
      const t = Math.min(1, Math.max(0, (agora - inicio) / duracao));
      const suave = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      const alvo = suave * total;
      while (i < pontos.length - 2 && acumulado[i + 1] < alvo) i++;
      const trecho = acumulado[i + 1] - acumulado[i] || 1;
      const f = Math.min(1, (alvo - acumulado[i]) / trecho);
      const pos = [
        pontos[i][0] + (pontos[i + 1][0] - pontos[i][0]) * f,
        pontos[i][1] + (pontos[i + 1][1] - pontos[i][1]) * f,
      ];
      const percorrido = pontos.slice(0, i + 1).concat([pos]);
      this.rastroFundo.setLatLngs(percorrido);
      this.rastro.setLatLngs(percorrido);
      this.carro.setLatLng(pos);
      if (t < 1) this.animacao = requestAnimationFrame(quadro);
      else this.carro.getElement()?.classList.add("chegou");
    };
    this.animacao = requestAnimationFrame(quadro);
  }

  pararRota() {
    cancelAnimationFrame(this.animacao);
    this.elemento.classList.remove("com-rota");
    for (const camada of [this.rastroFundo, this.rastro, this.carro]) {
      if (camada) camada.remove();
    }
    this.rastroFundo = this.rastro = this.carro = null;
  }
}
