# SmartNet Analyzer

Ferramenta para mapear uma cidade inteligente como um **grafo** (bairros = vértices, vias/conexões = arestas) e executar análises de conectividade e roteamento: **DFS, BFS, Dijkstra e Kruskal**.

Tem dois modos, que usam o mesmo back-end e os mesmos algoritmos:

- **Quadro branco**: você desenha qualquer grafo com o mouse (direcionado ou não, com ou sem peso) ou cola o grafo em texto.
- **Mapa real**: os bairros do Rio de Janeiro (e de São Paulo e Belo Horizonte) sobre o mapa da cidade. O peso de cada via é a **distância real pelas ruas**, e a rota do Dijkstra é animada **rua por rua**.

| | |
|---|---|
| **Curso** | Engenharia de Computação / Software |
| **Disciplina** | Análise e Complexidade de Algoritmos (IBM3121) |
| **Professor** | Cassius Figueiredo |
| **Período** | 2026.2 |

## Integrantes

| Nome | Matrícula |
|---|---|
| Arthur Schiller | 202402851756 |
| Bernardo Lobo Marques | 202401709433 |
| Bernardo Moreira Gonçalves | 202401500283 |
| Michel de Melo | 202401569852 |

---

## Como executar (passo a passo)

> **Resumo para quem já tem Python:** `pip install -r requirements.txt` e depois `python app.py`. O navegador abre sozinho.

### 1. Ter o Python instalado

Precisa do **Python 3.9 ou mais novo**. Para conferir, abra um terminal e digite:

```bash
python --version
```

- Se aparecer `Python 3.9` ou maior, está pronto.
- No **Windows**, se der "comando não encontrado", tente `py --version`. Se funcionar, use `py` no lugar de `python` nos passos abaixo.
- Se não tiver Python, baixe em <https://www.python.org/downloads/>. No Windows, **marque a opção "Add Python to PATH"** na primeira tela do instalador.

### 2. Baixar o projeto

Escolha uma das opções:

- **Com Git:**
  ```bash
  git clone <url-do-repositorio>
  cd ac-complexidade
  ```
- **Sem Git:** na página do repositório no GitHub, clique em **Code → Download ZIP**, extraia o arquivo e entre na pasta extraída.

### 3. Abrir um terminal dentro da pasta do projeto

- **Windows:** abra a pasta no Explorador de Arquivos, clique na barra de endereço, digite `cmd` e aperte **Enter**.
- **macOS:** clique com o botão direito na pasta e escolha **Novo Terminal na Pasta**.
- **Linux:** clique com o botão direito dentro da pasta e escolha **Abrir no terminal**.

Para conferir que está na pasta certa, rode `dir` (Windows) ou `ls` (macOS/Linux). O arquivo `app.py` precisa aparecer na lista.

### 4. Instalar a única dependência (Flask)

```bash
pip install -r requirements.txt
```

Se `pip` não for reconhecido, use `python -m pip install -r requirements.txt`.

O Flask só serve a página web. **Nenhum algoritmo nem estrutura de dados vem de biblioteca.**

> Opcional: para não misturar com outros projetos, dá para usar um ambiente virtual antes do passo 4:
> `python -m venv .venv` e depois `.venv\Scripts\activate` (Windows) ou `source .venv/bin/activate` (macOS/Linux).

### 5. Rodar

```bash
python app.py
```

O terminal mostra algo assim:

```
  SmartNet Analyzer rodando em  http://localhost:5000
  Modo mapa:                    http://localhost:5000/mapa
```

O navegador abre sozinho. Se não abrir, copie o endereço do terminal para o navegador (Chrome, Edge ou Firefox).
Para trocar de modo, use os botões **Quadro branco / Mapa real** no topo da página.

### 6. Encerrar

Clique em **Finalizar aplicação**, no canto superior direito, e clique de novo para confirmar. Outra opção é apertar `Ctrl+C` no terminal.

### Se algo der errado

| Problema | Solução |
|---|---|
| `python` não é reconhecido | Use `py` (Windows) ou `python3` (macOS/Linux) |
| `pip` não é reconhecido | Use `python -m pip install -r requirements.txt` |
| `ModuleNotFoundError: No module named 'flask'` | O passo 4 não foi feito, ou foi feito em outro Python. Rode `python -m pip install flask` |
| A porta 5000 está ocupada (comum no macOS por causa do AirPlay) | Nada a fazer: o programa usa a próxima porta livre (5001, 5002...) e mostra o endereço no terminal |
| O navegador não abriu sozinho | Abra manualmente o endereço que aparece no terminal |
| O mapa aparece cinza, sem ruas | O modo mapa precisa de **internet** para baixar o mapa de fundo. O quadro branco funciona offline |

### Testes automáticos

```bash
python -m unittest -v
```

São 30 testes. Eles incluem os exemplos clássicos do livro *Introduction to Algorithms* (Cormen), cujas respostas são conhecidas, e testes do modo mapa.

---

## Roteiro rápido para testar (2 minutos)

1. No **Quadro branco**, escolha **Exemplos → Cidade: 8 bairros**.
2. Escolha a origem **A** e o destino **H**, e clique em **Dijkstra**. A rota sai **A → C → B → D → G → H, custo 17**, e o desenho é animado passo a passo.
3. Clique em **Kruskal**. O custo total da árvore geradora mínima é **22**.
4. Para testar **outro grafo**, você pode:
   - desenhar à mão: duplo clique cria um vértice, e Shift + arrastar liga dois vértices;
   - clicar em **Importar** e colar o grafo em texto, no formato descrito mais abaixo.
5. Clique em **Mapa real**. O Rio de Janeiro já vem com 21 bairros e 30 vias. Clique em **Dijkstra**: a rota **Copacabana → Campo Grande** aparece percorrendo as ruas.

---

## Como usar: quadro branco

### 1. Montar o grafo

- **Duplo clique** no quadro cria um bairro. Os nomes seguem a sequência A, B, C...
- **Arrastar** um bairro o move de lugar.
- Para **ligar dois bairros**, use a ferramenta *Aresta* e arraste de um bairro até o outro, ou clique em um e depois no outro. Outra forma: segure **Shift** e arraste.
- O **peso** é digitado logo depois de criar a ligação. Para editar, clique no número.
- **Duplo clique** em um bairro o renomeia.
- Para apagar, use a ferramenta *Apagar*, ou selecione o item e aperte **Delete**.
- As chaves **Direcionado** e **Com peso** definem o tipo do grafo.
- **Importar** aceita colar texto ou abrir um arquivo `.txt`/`.csv`, como lista de arestas ou matriz de adjacência. **Exportar** baixa o grafo atual.
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

Também aceita `A -> B 4` e `A,B,4`. A pasta `exemplos/` tem um arquivo pronto para importar.

### Matriz de adjacência (importar)

Na janela **Importar**, escolha **Matriz de adjacência**:

```
direcionado: nao   # opcional: sem ele, matriz assimétrica vira grafo direcionado
ponderado: sim     # opcional: sem ele, valores diferentes de 0/1 viram pesos
  A B C D          # linha de nomes opcional (sem ela: A, B, C...)
A 0 4 2 0
B 4 0 1 0
C 2 1 0 7
D 0 0 7 0
```

`0`, `-` ou `∞` significam "sem aresta". Os valores podem ser separados por espaço, `;` ou `,`. A diagonal deve ser 0 (laços não são suportados).

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

## Como usar: mapa real

O modo mapa leva o problema para uma cidade de verdade.

- **Cidade**: Rio de Janeiro (21 bairros, 30 vias), São Paulo ou Belo Horizonte. Cada uma já vem com uma rede pronta.
- **Peso das vias**, escolhido na barra:
  - **distância pelas ruas (km)**: o padrão, calculada pelo trajeto de carro;
  - **tempo de carro (min)**: estimativa sem trânsito;
  - **linha reta (km)**: fórmula de Haversine, implementada em `smartnet/mapa.py`.

  Trocar o peso muda o resultado do Dijkstra e do Kruskal.
- **Navegar**: clique em um bairro e escolha **Partir daqui** ou **Ir até aqui**. "Ir até aqui" já roda o Dijkstra.
- **Ponto**: clique em qualquer lugar do mapa para criar um vértice. O nome do bairro é sugerido automaticamente.
- **Via**: clique em um ponto e depois em outro. A via é traçada **pelas ruas**, com a distância real.
- **Apagar**: clique em um ponto ou em uma via.
- Os quatro algoritmos, a animação e o painel da lista de adjacência funcionam igual ao quadro branco. No Dijkstra com destino, no final, um marcador **percorre a rota pelas ruas**.

As vias do mapa valem nos dois sentidos, então o grafo é não-direcionado e o Kruskal se aplica.

**De onde vêm os dados:**

| O quê | Fonte | Precisa de internet? |
|---|---|---|
| Desenho do mapa de fundo | OpenStreetMap, exibido com a biblioteca Leaflet | sim |
| Redes prontas das cidades (km, minutos e traçado de cada via) | arquivo `static/dados/cidades.json`, gerado uma vez com `ferramentas/gerar_cidades.py` | não |
| Novas vias criadas na hora | serviço público de rotas OSRM, chamado pelo back-end (`/api/via`) | sim. Sem internet, usa a linha reta e avisa |
| Nome sugerido para um ponto novo | Nominatim (OpenStreetMap) | sim. Sem internet, sugere "Ponto N" |

O OSRM só é usado para **medir** cada via, ou seja, para dar o peso da aresta. **Quem calcula o caminho mínimo entre os bairros, a árvore geradora e as buscas são os nossos algoritmos**, rodando sobre a nossa lista de adjacência.

O mapa também reforça a escolha da estrutura. No Rio, V = 21 e E = 30: a lista guarda **81** posições, e a matriz ocuparia **441** (o painel mostra esses números ao vivo).

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
app.py                      servidor Flask: serve as páginas e as rotas da API
smartnet/
├── grafo.py                ★ estrutura de dados: LISTA DE ADJACÊNCIA feita do zero
├── ordem.py                regra de desempate (ordem alfabética)
├── central.py              recebe o pedido da tela e direciona para o algoritmo certo
├── apresentacao.py         transforma o resultado em textos/tabelas
├── passos.py               "diário" dos passos, usado pela animação
├── mapa.py                 modo mapa: mede as vias (OSRM / Haversine)
├── algoritmos/
│   ├── dfs.py              Busca em Profundidade
│   ├── bfs.py              Busca em Largura
│   ├── dijkstra.py         Dijkstra com heap
│   └── kruskal.py          Kruskal com Union-Find
└── estruturas/             estruturas auxiliares feitas do zero
    ├── fila.py             fila FIFO (BFS)
    ├── heap.py             heap binário de mínimo (Dijkstra)
    ├── union_find.py       conjuntos disjuntos (Kruskal)
    └── ordenacao.py        merge sort (Kruskal)
templates/
├── index.html              página do quadro branco
└── mapa.html               página do mapa real
static/
├── css/                    visual (preto e branco)
├── js/                     interface: editor, mapa, painéis, animação
└── dados/cidades.json      bairros e vias prontas das cidades
ferramentas/gerar_cidades.py  gera o cidades.json consultando o OSRM
tests/test_algoritmos.py    testes automáticos
```

**Fluxo de uma execução (igual nos dois modos):**

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

**Nenhuma biblioteca é usada na estrutura de dados nem nos algoritmos.** O grafo, a fila, o heap, o Union-Find e o merge sort foram implementados do zero. As outras peças têm papéis limitados:

- o **Flask** só serve a página e recebe as requisições;
- o quadro branco usa JavaScript puro com SVG, sem bibliotecas de grafos;
- no modo mapa, o **Leaflet** só desenha o mapa de fundo, e o **OSRM** só mede o comprimento de cada via.

O registro dos passos para a animação (`passos.py`) só *anota* o que o algoritmo fez. Ele não participa da lógica, e a análise de complexidade acima considera apenas o algoritmo.
