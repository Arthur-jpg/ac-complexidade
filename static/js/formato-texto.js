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

// =====================================================================
// Matriz de adjacência
//
//   direcionado: nao     <- opcional (sem ele, matriz assimétrica = direcionado)
//   ponderado: sim       <- opcional (sem ele, valores ≠ 0/1 = ponderado)
//      A B C             <- linha de nomes opcional (sem ela: A, B, C...)
//   A  0 4 2             <- rótulo da linha opcional
//   B  4 0 1
//   C  2 1 0
//
// 0, "-", "inf" ou "∞" significam "sem aresta".
// Separadores aceitos: espaço, tab, ";" ou ",".
// =====================================================================

const SEM_ARESTA = /^(0|-|inf|infinito|∞)$/i;
const NUMERO = /^[+-]?(\d+([.,]\d*)?|[.,]\d+)$/;

function ehValor(token) {
  return SEM_ARESTA.test(token) || NUMERO.test(token);
}

function quebrarLinhaMatriz(linha) {
  const partes = linha.split(/[\s;]+/).filter(Boolean);
  // "0,1,0" sem espaços: a vírgula é o separador
  if (partes.length === 1 && partes[0].includes(",")) return partes[0].split(",").filter(Boolean);
  // "0, 1, 0": vírgulas soltas no fim dos tokens
  if (partes.length > 1 && partes.slice(0, -1).every((p) => p.endsWith(","))) return partes.map((p) => p.replace(/,$/, ""));
  return partes;
}

function nomesPadrao(n) {
  if (n <= 26) return Array.from({ length: n }, (_, i) => String.fromCharCode(65 + i));
  return Array.from({ length: n }, (_, i) => String(i + 1));
}

export function matrizParaGrafo(texto) {
  let direcionado = null;
  let ponderado = null;
  let nomes = null;
  const rotulos = [];
  const linhas = []; // { valores, numero }

  texto.split(/\r?\n/).forEach((original, i) => {
    const linha = original.split("#")[0].trim();
    if (!linha) return;

    const cabecalho = linha.match(/^(direcionado|ponderado)\s*[:=]\s*(\S+)$/i);
    if (cabecalho) {
      const valor = SIM.test(cabecalho[2]);
      if (cabecalho[1].toLowerCase() === "direcionado") direcionado = valor;
      else ponderado = valor;
      return;
    }

    const partes = quebrarLinhaMatriz(linha);
    // primeira linha com algum token não numérico (e antes das linhas de valores) = nomes
    if (!nomes && linhas.length === 0 && !partes.every(ehValor)) {
      nomes = partes;
      return;
    }
    let rotulo = null;
    if (!ehValor(partes[0])) rotulo = partes.shift();
    const invalido = partes.find((p) => !ehValor(p));
    if (invalido !== undefined) throw new Error(`Linha ${i + 1}: "${invalido}" não é um número.`);
    rotulos.push(rotulo);
    linhas.push({ valores: partes, numero: i + 1 });
  });

  // nomes numéricos ("  1 2 3" / "1 0 1 0"...): a 1ª linha tem um token a menos que as demais
  if (!nomes && rotulos.every((r) => r === null) && linhas.length >= 2) {
    const k = linhas.length - 1;
    if (linhas[0].valores.length === k && linhas.slice(1).every((l) => l.valores.length === k + 1)) {
      nomes = linhas.shift().valores;
      rotulos.length = 0;
      for (const l of linhas) rotulos.push(l.valores.shift());
    }
  }

  const n = linhas.length;
  if (n === 0) throw new Error("Nenhuma linha da matriz encontrada.");
  if (nomes && nomes.length === n + 1) nomes = nomes.slice(1); // canto da tabela, ex.: "/ A B C"
  for (const { valores, numero } of linhas) {
    if (valores.length !== n) {
      throw new Error(`Linha ${numero}: a matriz tem ${n} linhas, então cada linha precisa de ${n} valores (encontrei ${valores.length}).`);
    }
  }

  if (nomes) {
    if (nomes.length !== n) throw new Error(`A linha de nomes tem ${nomes.length} vértices, mas a matriz tem ${n} linhas.`);
  } else if (rotulos.every(Boolean)) {
    nomes = rotulos;
  } else {
    nomes = nomesPadrao(n);
  }
  if (new Set(nomes).size !== n) throw new Error("Há nomes de vértices repetidos.");

  const m = linhas.map(({ valores }) =>
    valores.map((v) => (SEM_ARESTA.test(v) ? 0 : Number(v.replace(",", ".")))),
  );

  let simetrica = true;
  let algumPeso = false;
  for (let i = 0; i < n; i++) {
    if (m[i][i] !== 0) throw new Error(`Laço ${nomes[i]}—${nomes[i]} não é suportado (diagonal deve ser 0).`);
    for (let j = 0; j < n; j++) {
      if (m[i][j] !== m[j][i]) simetrica = false;
      if (m[i][j] !== 0 && m[i][j] !== 1) algumPeso = true;
    }
  }

  if (direcionado === null) direcionado = !simetrica;
  if (!direcionado && !simetrica) {
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
      if (m[i][j] !== m[j][i]) {
        throw new Error(`Grafo não direcionado exige matriz simétrica: [${nomes[i]}][${nomes[j]}] = ${m[i][j]}, mas [${nomes[j]}][${nomes[i]}] = ${m[j][i]}.`);
      }
    }
  }

  const arestas = [];
  for (let i = 0; i < n; i++) {
    for (let j = direcionado ? 0 : i + 1; j < n; j++) {
      if (m[i][j] !== 0) arestas.push({ origem: nomes[i], destino: nomes[j], peso: m[i][j] });
    }
  }

  return {
    direcionado,
    ponderado: ponderado === null ? algumPeso : ponderado,
    vertices: nomes,
    arestas,
  };
}

export function grafoParaMatriz(grafo) {
  const nomes = grafo.vertices.map((v) => v.nome);
  const indice = new Map(nomes.map((nome, i) => [nome, i]));
  const m = nomes.map(() => nomes.map(() => 0));
  for (const a of grafo.arestas) {
    const i = indice.get(a.origem), j = indice.get(a.destino);
    if (i === undefined || j === undefined) continue;
    const valor = grafo.ponderado ? a.peso : 1;
    m[i][j] = valor;
    if (!grafo.direcionado) m[j][i] = valor;
  }
  const largura = Math.max(...nomes.map((s) => s.length), ...m.flat().map((v) => String(v).length));
  const celula = (s) => String(s).padStart(largura);
  const linhas = [
    "# SmartNet Analyzer",
    `direcionado: ${grafo.direcionado ? "sim" : "nao"}`,
    `ponderado: ${grafo.ponderado ? "sim" : "nao"}`,
    "",
    [" ".repeat(largura), ...nomes.map(celula)].join(" "),
    ...m.map((linha, i) => [celula(nomes[i]), ...linha.map(celula)].join(" ")),
  ];
  return linhas.join("\n") + "\n";
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
