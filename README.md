# SmartNet Analyzer

Ferramenta para mapear uma cidade inteligente como um **grafo** (bairros = vértices, vias/conexões = arestas) e executar análises de conectividade e roteamento: **DFS, BFS, Dijkstra e Kruskal**.

| | |
|---|---|
| **Curso** | Engenharia de Computação / Software |
| **Disciplina** | Análise e Complexidade de Algoritmos (IBM3121) |
| **Professor** | Cassius Figueiredo |
| **Período** | 2026.2 |

## Integrantes

| Nome | Matrícula |
|---|---|
| _preencher_ | _preencher_ |
| _preencher_ | _preencher_ |
| _preencher_ | _preencher_ |

---

## Como executar

Requisitos: **Python 3.9 ou superior** e um navegador atualizado (Chrome, Edge ou Firefox).

```bash
# 1. clonar o repositório
git clone <url-do-repositorio>
cd ac-complexidade

# 2. (opcional) criar um ambiente virtual
python -m venv .venv
.venv\Scripts\activate          # Windows
source .venv/bin/activate       # Linux / macOS

# 3. instalar a única dependência (Flask, só para servir a página)
pip install -r requirements.txt

# 4. rodar
python app.py
```

O navegador abre sozinho em **http://localhost:5000**. Se não abrir, acesse esse endereço manualmente.
Para encerrar, use o botão **Finalizar aplicação** na tela ou `Ctrl+C` no terminal.

### Rodar os testes automáticos

```bash
python -m unittest -v
```

São 26 testes, incluindo os exemplos clássicos do livro *Introduction to Algorithms* (Cormen), cujas respostas são conhecidas.

---

## Como usar

### 1. Montar o grafo

- **Duplo clique** no quadro cria um bairro. Os nomes seguem a sequência A, B, C...
- **Arrastar** um bairro o move de lugar.
- Para **ligar dois bairros**, use a ferramenta *Aresta* e arraste de um bairro até o outro, ou clique em um e depois no outro. Outra forma: segure **Shift** e arraste.
- O **peso** é digitado logo depois de criar a ligação. Para editar, clique no número.
- **Duplo clique** em um bairro o renomeia.
- Para apagar, use a ferramenta *Apagar*, ou selecione o item e aperte **Delete**.
- As chaves **Direcionado** e **Com peso** definem o tipo do grafo.
- **Importar** aceita colar texto ou abrir um arquivo `.txt`. **Exportar** baixa o grafo atual.
- **Exemplos** traz grafos prontos, incluindo um do livro do Cormen.

Atalhos de teclado: `V` mover · `N` vértice · `A` aresta · `D` apagar · `Delete` apaga a seleção · `Esc` cancela.

### Formato de texto (importar/exportar)

```
# linhas com # são comentários
direcionado: nao
ponderado: sim

A B 4      # aresta A—B com peso 4
A C 2
B C        # sem peso: vale 1
E          # vértice isolado
```

### 2. Ver a estrutura em memória

O painel **Estrutura em memória** mostra a **lista de adjacência exatamente como o back-end a guardou**. Os dados vêm direto do objeto Python, pela rota `/api/estrutura`. A chave *Comparar com matriz* mostra a matriz equivalente, só para comparação; o programa usa apenas a lista.

### 3. Executar os algoritmos

Escolha a **origem** (e, se quiser, um **destino** para o Dijkstra) e clique no algoritmo. O painel de resultado mostra:

| Algoritmo | Resultado em texto/tabela |
|---|---|
| **DFS** | ordem de visita, **árvore (ou floresta) da DFS**, tempos de descoberta/finalização, conectividade e becos sem saída |
| **BFS** | **fila de execução** (ordem de saída da fila), árvore da BFS, nível de cada vértice e caminho mais curto em nº de arestas |
| **Dijkstra** | **lista de distâncias** a partir da origem, anterior de cada vértice, rota completa e rota até o destino |
| **Kruskal** | **arestas selecionadas e custo total**, mais o histórico de arestas aceitas/rejeitadas |

Além disso, a execução é **animada passo a passo** no desenho. O player permite pausar, avançar, voltar e mudar a velocidade (`←` `→` `espaço`). Em cada passo aparecem a explicação e o conteúdo da estrutura auxiliar (pilha, fila, heap ou componentes do Union-Find). A linha correspondente da lista de adjacência acende para mostrar qual lista de vizinhos está sendo percorrida.

---

## Regra de desempate: ordem alfabética

Sempre que um algoritmo pode escolher entre vários vértices, vai **o que vem primeiro em ordem alfabética**. Exemplo: começando em C, ligado a A, B e D, a DFS vai primeiro para A.

A regra é garantida pela própria estrutura: **as listas de vizinhos são mantidas sempre em ordem alfabética** (`Grafo._inserir_vizinho`). Assim, todo algoritmo que percorre os vizinhos já segue a ordem certa. Nos outros pontos de decisão:

- **Dijkstra**: a prioridade no heap é `(distância, nome)`, então empate de distância é resolvido pelo nome.
- **Kruskal**: as arestas são ordenadas por `(peso, ponta 1, ponta 2)`, então A—B vem antes de A—C quando têm o mesmo peso.
- **DFS**: quando a busca a partir da origem termina e ainda há vértices não visitados, ela **recomeça pelo próximo vértice não visitado em ordem alfabética**. O resultado é uma floresta, com uma árvore para cada recomeço.
- Nomes só com números são comparados como números: `2` vem antes de `10`.

A lista de vértices também é mantida em ordem desde a construção do grafo. Assim, o custo de ordenar fica na montagem do grafo, não dentro dos algoritmos.

---

## Por que lista de adjacência e não matriz?

| Operação | Lista de adjacência | Matriz de adjacência |
|---|---|---|
| Memória | **O(V + E)** | O(V²) |
| Percorrer os vizinhos de *v* | **O(grau(v))** | O(V) |
| Verificar se existe a aresta (u, v) | O(grau(u)) | **O(1)** |
| DFS / BFS completas | **O(V + E)** | O(V²) |
| Dijkstra | **O((V + E) log V)** com heap | O(V²) |

**O cenário é uma cidade, e o grafo de uma cidade é esparso.** Cada bairro se liga a poucos bairros vizinhos, não a todos. Numa cidade com 100 bairros e uns 300 trechos de via:

- a **lista** guarda 100 + 2·300 = **700** entradas;
- a **matriz** guardaria 100² = **10.000** células, das quais 9.400 só dizem "não há ligação".

Os quatro algoritmos pedidos passam a maior parte do tempo fazendo **uma única operação: "percorrer os vizinhos de v"**. Na lista, isso custa exatamente o número de vizinhos. Na matriz, custa a linha inteira (V), mesmo que o bairro tenha só 2 vizinhos. A única vantagem da matriz, testar "existe a aresta (u, v)?" em O(1), **não é usada por nenhum dos quatro algoritmos**.

O próprio painel *Estrutura em memória* mostra essa comparação ao vivo para o grafo da tela (posições usadas pela lista × células que a matriz ocuparia).

---

## Complexidade de cada algoritmo

V = número de vértices, E = número de arestas.

### DFS: O(V + E) de tempo, O(V) de memória

Cada vértice é descoberto **uma vez**, porque o dicionário `descoberta` impede revisitas. O laço de recomeço passa por todos os vértices, mas só inicia uma busca nos não visitados. Total: O(V). Para cada vértice, a sua lista de vizinhos é percorrida **uma vez**. A soma do tamanho de todas as listas é E (direcionado) ou 2E (não-direcionado): O(E). A pilha de recursão tem no máximo V chamadas.

### BFS: O(V + E) de tempo, O(V) de memória

Cada vértice **entra e sai da fila uma vez**. A fila foi implementada com um índice de início, então enfileirar e desenfileirar custam O(1), e o total é O(V). Cada lista de vizinhos é lida uma vez: O(E).

### Dijkstra: O((V + E) log V) de tempo, O(V + E) de memória

- Cada vértice é **finalizado** uma vez, e cada lista de vizinhos é lida uma vez: O(V + E).
- Cada **relaxamento** que melhora uma distância insere uma entrada no heap. São no máximo E inserções, cada uma custando O(log V).
- Cada entrada sai do heap uma vez, também a O(log V).
- Total: O((V + E) log V).

Usamos **remoção preguiçosa**: em vez de "diminuir a chave" dentro do heap, inserimos de novo e ignoramos a entrada velha quando ela sai. O(log E) = O(log V), porque E ≤ V².

Com matriz, a versão natural é O(V²). Para grafos esparsos, O((V + E) log V) é bem menor.

Pesos negativos são **recusados com uma mensagem**. O Dijkstra assume que uma distância finalizada nunca mais diminui, e com peso negativo isso deixa de ser verdade.

### Kruskal: O(E log E) de tempo, O(V + E) de memória

- Ordenar as arestas com **merge sort**: O(E log E). **Essa parte domina o custo.**
- Para cada aresta, `encontrar` e `unir` no **Union-Find** com compressão de caminho e união por rank: O(α(V)) cada, praticamente constante.
- O algoritmo para assim que tem V − 1 arestas.

O Kruskal **só se aplica a grafos não-direcionados**. Se o grafo for direcionado, a aplicação explica por quê e não executa. A versão direcionada do problema é a "arborescência mínima", resolvida pelo algoritmo de Edmonds. Se o grafo for desconexo, o resultado é uma **floresta** geradora mínima.

---

## Arquitetura

```
app.py                      servidor Flask: serve a página e as 3 rotas da API
smartnet/
├── grafo.py                ★ estrutura de dados: LISTA DE ADJACÊNCIA feita do zero
├── ordem.py                regra de desempate (ordem alfabética)
├── central.py              recebe o pedido da tela e direciona para o algoritmo certo
├── apresentacao.py         transforma o resultado em textos/tabelas
├── passos.py               "diário" dos passos, usado pela animação
├── algoritmos/
│   ├── dfs.py              Busca em Profundidade
│   ├── bfs.py              Busca em Largura
│   ├── dijkstra.py         Dijkstra com heap
│   └── kruskal.py          Kruskal com Union-Find
└── estruturas/             estruturas auxiliares feitas do zero
    ├── fila.py             fila FIFO (BFS)
    ├── heap.py             heap binário de mínimo (Dijkstra)
    ├── union_find.py       conjuntos disjuntos (Kruskal)
    └── ordenacao.py        merge sort (Kruskal e ordem alfabética)
templates/index.html        a página
static/css/estilo.css       visual
static/js/                  interface (editor do grafo, painéis, animação)
tests/test_algoritmos.py    testes automáticos
```

**Fluxo de uma execução:**

```
tela  ──(JSON: grafo + algoritmo + origem)──▶  POST /api/executar
                                                   │
                                     central.executar()
                                       ├─ Grafo.de_dict()          monta a lista de adjacência
                                       ├─ dfs / bfs / dijkstra / kruskal
                                       └─ apresentacao.formatar_*()
                                                   │
tela  ◀──(JSON: seções de texto/tabela + passos da animação)──┘
```

**Nenhuma biblioteca é usada na estrutura de dados nem nos algoritmos.** O grafo, a fila, o heap, o Union-Find e o merge sort foram implementados do zero. O Flask só serve a página e recebe as requisições. A interface usa JavaScript puro com SVG, sem bibliotecas de grafos.

O registro dos passos para a animação (`passos.py`) só *anota* o que o algoritmo fez. Ele não participa da lógica, e a análise de complexidade acima considera apenas o algoritmo.
