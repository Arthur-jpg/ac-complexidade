// Grafos de exemplo. Posições de 0 a 1 (proporcionais ao tamanho do quadro).

export const EXEMPLOS = [
  {
    nome: "Cidade: 8 bairros (não-direcionado, com peso)",
    direcionado: false,
    ponderado: true,
    vertices: [
      ["A", 0.10, 0.32], ["B", 0.30, 0.14], ["C", 0.28, 0.62], ["D", 0.50, 0.38],
      ["E", 0.48, 0.84], ["F", 0.72, 0.16], ["G", 0.72, 0.64], ["H", 0.90, 0.40],
    ],
    arestas: [
      ["A", "B", 4], ["A", "C", 2], ["B", "C", 1], ["B", "D", 5], ["C", "D", 8],
      ["C", "E", 10], ["D", "E", 2], ["D", "F", 6], ["D", "G", 4], ["E", "G", 7],
      ["F", "G", 9], ["F", "H", 3], ["G", "H", 5],
    ],
  },
  {
    nome: "Vias de mão única (direcionado, com peso)",
    direcionado: true,
    ponderado: true,
    vertices: [
      ["A", 0.12, 0.50], ["B", 0.36, 0.20], ["C", 0.36, 0.80], ["D", 0.62, 0.20],
      ["E", 0.62, 0.80], ["F", 0.88, 0.50], ["G", 0.88, 0.12],
    ],
    arestas: [
      ["A", "B", 2], ["A", "C", 5], ["B", "C", 1], ["B", "D", 4], ["D", "B", 3],
      ["C", "E", 3], ["E", "D", 2], ["D", "F", 6], ["E", "F", 7], ["G", "D", 1],
    ],
  },
  {
    nome: "Rede de rádio (não-direcionado, sem peso)",
    direcionado: false,
    ponderado: false,
    vertices: [
      ["A", 0.50, 0.12], ["B", 0.25, 0.38], ["C", 0.50, 0.40], ["D", 0.75, 0.38],
      ["E", 0.15, 0.78], ["F", 0.38, 0.78], ["G", 0.62, 0.78], ["H", 0.86, 0.78],
    ],
    arestas: [
      ["A", "B", 1], ["A", "C", 1], ["A", "D", 1], ["B", "E", 1], ["B", "F", 1],
      ["C", "F", 1], ["C", "G", 1], ["D", "G", 1], ["D", "H", 1],
    ],
  },
  {
    nome: "Livro do Cormen, fig. 23.4 (árvore mínima = 37)",
    direcionado: false,
    ponderado: true,
    vertices: [
      ["a", 0.07, 0.50], ["b", 0.25, 0.18], ["c", 0.47, 0.18], ["d", 0.69, 0.18], ["e", 0.92, 0.50],
      ["f", 0.69, 0.82], ["g", 0.47, 0.82], ["h", 0.25, 0.82], ["i", 0.37, 0.50],
    ],
    arestas: [
      ["a", "b", 4], ["a", "h", 8], ["b", "c", 8], ["b", "h", 11], ["c", "d", 7],
      ["c", "f", 4], ["c", "i", 2], ["d", "e", 9], ["d", "f", 14], ["e", "f", 10],
      ["f", "g", 2], ["g", "h", 1], ["g", "i", 6], ["h", "i", 7],
    ],
  },
];
