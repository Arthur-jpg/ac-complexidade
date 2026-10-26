// =====================================================================
// Formato de texto para importar/exportar grafos.
//
//   # comentário
//   direcionado: nao
//   ponderado: sim
//   A B 4        <- aresta A—B com peso 4
//   A C          <- aresta sem peso (vale 1)
//   E            <- vértice isolado
//
// Também aceita "A -> B 4" e "A,B,4".
// =====================================================================

const SIM = /^(s|sim|true|1|yes|y)$/i;

function quebrarLinha(linha) {
  const partes = linha.replace(/\s*(->|→|—)\s*/g, " ").split(/\s+/).filter(Boolean);
  if (partes.length === 1 && /[,;]/.test(partes[0])) return partes[0].split(/[,;]/).filter(Boolean);
  return partes;
}

export function textoParaGrafo(texto) {
  let direcionado = false;
  let ponderado = null;
  let algumPeso = false;
  const vertices = [];
  const vistos = new Set();
  const arestas = new Map(); // chave -> aresta (a última repetição vence)

  const adicionarVertice = (nome) => {
    if (!vistos.has(nome)) { vistos.add(nome); vertices.push(nome); }
  };

  const linhas = texto.split(/\r?\n/);
  const brutas = [];
  linhas.forEach((original, i) => {
    const linha = original.split("#")[0].trim();
    if (!linha) return;

    const cabecalho = linha.match(/^(direcionado|ponderado)\s*[:=]\s*(\S+)$/i);
    if (cabecalho) {
      const valor = SIM.test(cabecalho[2]);
      if (cabecalho[1].toLowerCase() === "direcionado") direcionado = valor;
      else ponderado = valor;
      return;
    }

    const partes = quebrarLinha(linha);
    if (partes.length === 1) { adicionarVertice(partes[0]); return; }
    if (partes.length > 3) throw new Error(`Linha ${i + 1}: use "origem destino peso".`);

    const [origem, destino, textoPeso] = partes;
    if (origem === destino) throw new Error(`Linha ${i + 1}: laço ${origem}—${origem} não é suportado.`);
    let peso = 1;
    if (textoPeso !== undefined) {
      peso = Number(textoPeso.replace(",", "."));
      if (!Number.isFinite(peso)) throw new Error(`Linha ${i + 1}: o peso "${textoPeso}" não é um número.`);
      algumPeso = true;
    }
    adicionarVertice(origem);
    adicionarVertice(destino);
    brutas.push({ origem, destino, peso });
  });

  // só agora sabemos se é direcionado, para juntar arestas repetidas
  for (const a of brutas) {
    const chave = direcionado ? `${a.origem}>${a.destino}` : [a.origem, a.destino].sort().join("|");
    arestas.set(chave, a);
  }

  if (vertices.length === 0) throw new Error("Nenhum vértice encontrado no texto.");
  return {
    direcionado,
    ponderado: ponderado === null ? algumPeso : ponderado,
    vertices,
    arestas: [...arestas.values()],
  };
}

export function grafoParaTexto(grafo) {
  const linhas = [
    "# SmartNet Analyzer",
    `direcionado: ${grafo.direcionado ? "sim" : "nao"}`,
    `ponderado: ${grafo.ponderado ? "sim" : "nao"}`,
    "",
  ];
  const comAresta = new Set();
  for (const a of grafo.arestas) {
    linhas.push(grafo.ponderado ? `${a.origem} ${a.destino} ${a.peso}` : `${a.origem} ${a.destino}`);
    comAresta.add(a.origem);
    comAresta.add(a.destino);
  }
  for (const v of grafo.vertices) if (!comAresta.has(v.nome)) linhas.push(v.nome);
  return linhas.join("\n") + "\n";
}
