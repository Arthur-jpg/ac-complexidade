"""
Transforma o resultado bruto de cada algoritmo em "seções" que a interface
mostra como texto/tabela. Nenhuma lógica de algoritmo mora aqui.

Tipos de seção:
    {"tipo": "sequencia", "titulo": ..., "itens": [...]}             -> A → B → C
    {"tipo": "arvore",    "titulo": ..., "conteudo": "texto"}       -> árvore desenhada em texto
    {"tipo": "tabela",    "titulo": ..., "colunas": [...], "linhas": [[...]]}
    {"tipo": "texto",     "titulo": ..., "conteudo": "texto"}
    {"tipo": "destaque",  "titulo": ..., "conteudo": "texto"}       -> número/resposta principal

Além das seções, os algoritmos devolvem "prova": os mesmos resultados
no formato pedido na prova, usado pela janela "Folha de prova".
"""

from .passos import formatar_numero


def formatar_dfs(grafo, resultado, origem):
    linhas = []
    for v in resultado["ordem"]:
        linhas.append([
            v,
            resultado["descoberta"][v],
            resultado["finalizacao"][v],
            resultado["pai"][v] or "— (raiz)",
        ])

    raizes = resultado["raizes"]
    arvores = [desenhar_arvore(resultado["pai"], resultado["ordem"], raiz) for raiz in raizes]
    secoes = [
        {"tipo": "sequencia", "titulo": "Ordem de visita", "itens": resultado["ordem"]},
        {"tipo": "arvore",
         "titulo": "Árvore da DFS" if len(raizes) == 1 else "Floresta da DFS (%d árvores)" % len(raizes),
         "conteudo": "\n\n".join(arvores)},
        {"tipo": "tabela", "titulo": "Tempos de descoberta e finalização",
         "colunas": ["Vértice", "Descoberta", "Finalização", "Pai"], "linhas": linhas},
        {"tipo": "texto", "titulo": "Conectividade",
         "conteudo": _texto_conectividade(grafo, origem, resultado["nao_alcancados"])
         + (" A busca recomeçou por: %s." % ", ".join(raizes[1:]) if len(raizes) > 1 else "")},
        {"tipo": "texto", "titulo": "Becos sem saída",
         "conteudo": _texto_becos(grafo, resultado["becos_sem_saida"])},
    ]
    return _resposta(
        "dfs", "Busca em Profundidade (DFS)", secoes, resultado["passos"],
        tempo="O(V + E)", memoria="O(V)",
        explicacao="Cada vértice é visitado uma vez (V) e cada lista de vizinhos é lida "
                   "uma vez (E). Com matriz de adjacência seria O(V²).",
        prova={
            "origem": origem,
            "direcionado": grafo.direcionado,
            "ordem": resultado["ordem"],
            "raizes": raizes,
            "pai": resultado["pai"],
            "descoberta": resultado["descoberta"],
            "finalizacao": resultado["finalizacao"],
            "arestas": [[u, v] for u, v, _ in grafo.arestas()],
        },
    )


def formatar_bfs(grafo, resultado, origem):
    linhas = []
    for v in resultado["ordem"]:
        caminho = reconstruir_caminho(resultado["pai"], v)
        linhas.append([v, resultado["nivel"][v], resultado["pai"][v] or "—", " → ".join(caminho)])

    nivel = resultado["nivel"]
    secoes = [
        {"tipo": "sequencia", "titulo": "Fila de execução (ordem de saída da fila)", "itens": resultado["ordem"]},
        {"tipo": "arvore", "titulo": "Árvore da BFS",
         "conteudo": desenhar_arvore(resultado["pai"], resultado["ordem"], origem)},
        {"tipo": "tabela", "titulo": "Caminho mais curto em número de arestas (ignora pesos)",
         "colunas": ["Vértice", "Nível", "Pai", "Caminho"], "linhas": linhas},
        {"tipo": "texto", "titulo": "Alcance do alerta",
         "conteudo": _texto_conectividade(grafo, origem, resultado["nao_alcancados"])},
    ]
    return _resposta(
        "bfs", "Busca em Largura (BFS)", secoes, resultado["passos"],
        tempo="O(V + E)", memoria="O(V)",
        explicacao="Cada vértice entra e sai da fila uma vez (V) e cada lista de vizinhos "
                   "é lida uma vez (E). Com matriz de adjacência seria O(V²).",
        prova={
            "origem": origem,
            # cada linha: quem saiu da fila (None na primeira) e a fila depois, com a distância de cada um
            "linhas": [{"vertice": v, "fila": [[x, nivel[x]] for x in fila]}
                       for v, fila in resultado["rodadas"]],
            "ordem": [[v, nivel[v]] for v in resultado["ordem"]],
            "nao_alcancados": resultado["nao_alcancados"],
        },
    )


def formatar_dijkstra(grafo, resultado, origem, destino):
    distancia = resultado["distancia"]
    anterior = resultado["anterior"]
    passos = list(resultado["passos"])

    linhas = []
    for v in grafo.vertices():
        if distancia[v] == float("inf"):
            linhas.append([v, "∞", "—", "inalcançável"])
        else:
            linhas.append([v, formatar_numero(distancia[v]), anterior[v] or "—",
                           " → ".join(reconstruir_caminho(anterior, v))])

    secoes = []
    if destino is not None:
        if distancia[destino] == float("inf"):
            secoes.append({"tipo": "destaque", "titulo": "Rota %s → %s" % (origem, destino),
                           "conteudo": "Não existe caminho de %s até %s." % (origem, destino)})
        else:
            caminho = reconstruir_caminho(anterior, destino)
            secoes.append({"tipo": "destaque", "titulo": "Rota mais curta %s → %s" % (origem, destino),
                           "conteudo": "%s  ·  custo %s" % (" → ".join(caminho), formatar_numero(distancia[destino]))})
            passos.append(_passo_caminho(caminho, distancia[destino]))

    secoes += [
        {"tipo": "tabela", "titulo": "Distâncias a partir de %s" % origem,
         "colunas": ["Vértice", "Distância", "Anterior", "Rota"], "linhas": linhas},
        {"tipo": "sequencia", "titulo": "Ordem de finalização", "itens": resultado["ordem"]},
    ]
    return _resposta(
        "dijkstra", "Dijkstra (caminho mínimo)", secoes, passos,
        tempo="O((V + E) log V)", memoria="O(V + E)",
        explicacao="Cada aresta pode gerar uma inserção no heap, e cada operação do heap custa "
                   "O(log V). Com matriz de adjacência a versão natural seria O(V²).",
        prova=_prova_dijkstra(grafo, resultado, origem),
    )


def formatar_kruskal(grafo, resultado):
    escolhidas = [["%s — %s" % (u, v), formatar_numero(p)] for u, v, p in resultado["arestas"]]
    analisadas = []
    for i, (u, v, p, aceita) in enumerate(resultado["analisadas"], start=1):
        analisadas.append([i, "%s — %s" % (u, v), formatar_numero(p),
                           "aceita" if aceita else "rejeitada (formaria ciclo)"])

    secoes = [
        {"tipo": "destaque", "titulo": "Custo total da rede", "conteudo": formatar_numero(resultado["custo_total"])},
        {"tipo": "tabela", "titulo": "Arestas selecionadas", "colunas": ["Aresta", "Peso"], "linhas": escolhidas},
        {"tipo": "tabela", "titulo": "Arestas analisadas (em ordem crescente de peso)",
         "colunas": ["#", "Aresta", "Peso", "Decisão"], "linhas": analisadas},
    ]
    nao_analisadas = grafo.numero_arestas() - len(resultado["analisadas"])
    if nao_analisadas > 0:
        secoes.append({"tipo": "texto", "titulo": "Parada antecipada",
                       "conteudo": "A árvore ficou completa com V − 1 = %d arestas; as %d arestas "
                                   "restantes nem precisaram ser analisadas."
                                   % (len(resultado["arestas"]), nao_analisadas)})
    if resultado["componentes"] > 1:
        secoes.append({"tipo": "texto", "titulo": "Grafo desconexo",
                       "conteudo": "Não dá para ligar todos os bairros: o grafo tem %d componentes. "
                                   "O resultado é uma floresta geradora mínima (uma árvore por componente)."
                                   % resultado["componentes"]})
    return _resposta(
        "kruskal", "Kruskal (árvore geradora mínima)", secoes, resultado["passos"],
        tempo="O(E log E)", memoria="O(V + E)",
        explicacao="Ordenar as arestas com merge sort domina o custo (E log E). Cada consulta "
                   "ao Union-Find custa praticamente O(1).",
        prova={
            "ordenadas": [[u, v, formatar_numero(peso)]
                          for u, v, peso in resultado["ordenadas"]],
            "iniciais": ["{%s}" % v for v in grafo.vertices()],
            "linhas": [
                {"aresta": "%s — %s" % (u, v), "peso": formatar_numero(peso),
                 "aceita": aceita, "componentes": passo["estrutura"]["itens"]}
                for (u, v, peso, aceita), passo in
                zip(resultado["analisadas"], resultado["passos"][1:])
            ],
            "escolhidas": escolhidas,
            "custo_total": formatar_numero(resultado["custo_total"]),
            "componentes": resultado["componentes"],
            "nao_analisadas": nao_analisadas,
        },
    )


# ----------------------------------------------------------------------
# Auxiliares
# ----------------------------------------------------------------------

def reconstruir_caminho(anterior, destino):
    """Volta pelos 'anteriores' do destino até a origem e inverte. O(V)."""
    caminho = []
    atual = destino
    while atual is not None:
        caminho.append(atual)
        atual = anterior[atual]
    caminho.reverse()
    return caminho


def desenhar_arvore(pai, ordem, raiz):
    """
    Desenha a árvore em texto:
        A
        ├── B
        │   └── D
        └── C
    """
    filhos = {v: [] for v in ordem}
    for v in ordem:
        if pai[v] is not None:
            filhos[pai[v]].append(v)

    linhas = [raiz]

    def desenhar(vertice, prefixo):
        for i, filho in enumerate(filhos[vertice]):
            ultimo = i == len(filhos[vertice]) - 1
            linhas.append(prefixo + ("└── " if ultimo else "├── ") + filho)
            desenhar(filho, prefixo + ("    " if ultimo else "│   "))

    desenhar(raiz, "")
    return "\n".join(linhas)


def _texto_conectividade(grafo, origem, nao_alcancados):
    total = grafo.numero_vertices()
    if not nao_alcancados:
        if grafo.direcionado:
            return "Todos os %d vértices são alcançáveis a partir de %s, seguindo o sentido das vias." % (total, origem)
        return "Grafo conexo: todos os %d vértices são alcançáveis a partir de %s." % (total, origem)
    texto = "Não alcançáveis a partir de %s: %s." % (origem, ", ".join(nao_alcancados))
    if not grafo.direcionado:
        texto += " O grafo é desconexo."
    return texto


def _texto_becos(grafo, becos):
    if not becos:
        return "Nenhum."
    if grafo.direcionado:
        return "Sem nenhuma via de saída: %s." % ", ".join(becos)
    return "Com uma única ligação (ou isolados): %s." % ", ".join(becos)


def _passo_caminho(caminho, custo):
    arestas = [(caminho[i], caminho[i + 1], "caminho") for i in range(len(caminho) - 1)]
    return {
        "descricao": "Rota mais curta: %s (custo %s)." % (" → ".join(caminho), formatar_numero(custo)),
        "atual": None,
        "foco": None,
        "vertices": {v: "caminho" for v in caminho},
        "arestas": [list(a) for a in arestas],
        "rotulos": {},
        "estrutura": None,
    }


def _prova_dijkstra(grafo, resultado, origem):
    """
    Matriz da prova: uma coluna por vértice e uma linha por vértice finalizado.
    Cada linha mostra as distâncias no momento da escolha; a coluna de quem já
    foi finalizado fica vazia dali para baixo.
    """
    linhas = []
    anterior = {}
    for linha in resultado["tabela"]:
        valores = {v: formatar_numero(d) for v, d in linha["distancias"].items()}
        linhas.append({
            "escolhido": linha["escolhido"],
            "valores": valores,
            "mudou": [v for v, d in valores.items() if v in anterior and anterior[v] != d],
        })
        anterior = valores
    finalizados = set(resultado["ordem"])
    return {
        "origem": origem,
        "colunas": grafo.vertices(),
        "linhas": linhas,
        "inalcancaveis": [v for v in grafo.vertices() if v not in finalizados],
        "resultado": [[v, formatar_numero(resultado["distancia"][v]), resultado["anterior"][v]]
                      for v in grafo.vertices()],
    }


def _resposta(algoritmo, titulo, secoes, passos, tempo, memoria, explicacao, prova=None):
    return {
        "algoritmo": algoritmo,
        "titulo": titulo,
        "complexidade": {"tempo": tempo, "memoria": memoria, "explicacao": explicacao},
        "secoes": secoes,
        "passos": passos,
        "prova": prova,
    }
