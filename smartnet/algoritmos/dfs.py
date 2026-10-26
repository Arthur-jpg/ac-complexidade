"""
Busca em Profundidade (DFS) — auditoria de rotas, conectividade e becos sem saída.

Ideia: a partir da origem, segue o mais FUNDO possível por um caminho.
Quando chega num vértice sem vizinho novo, VOLTA (backtracking) para o
vértice anterior e tenta o próximo vizinho dele.
Os vizinhos são tentados em ordem alfabética (a lista já está ordenada).

Para cada vértice anotamos:
    descoberta  -> o "instante" em que a busca chegou nele
    finalizacao -> o "instante" em que todos os vizinhos dele foram explorados
    pai         -> quem o descobriu (as ligações pai -> filho formam a árvore da DFS)

Complexidade com lista de adjacência: O(V + E)
    - cada vértice é visitado uma única vez                    -> O(V)
    - a lista de vizinhos de cada vértice é percorrida uma vez,
      e a soma de todas as listas é E (ou 2E no não-direcionado) -> O(E)
Com matriz seria O(V²): para achar os vizinhos de um vértice é preciso
varrer a linha inteira da matriz, mesmo que ele tenha só 1 vizinho.
Memória extra: O(V) (dicionários + pilha de recursão).
"""

from ..passos import Registro


def dfs(grafo, origem):
    registro = Registro()
    descoberta = {}
    finalizacao = {}
    pai = {origem: None}
    ordem_visita = []
    pilha = []  # só para mostrar na tela a pilha de chamadas recursivas
    tempo = 0

    def visitar(vertice):
        nonlocal tempo
        tempo += 1
        descoberta[vertice] = tempo
        ordem_visita.append(vertice)
        pilha.append(vertice)
        registro.anotar(
            "Chega em %s (descoberta = %d)." % (vertice, tempo),
            atual=vertice,
            vertices={vertice: "fronteira"},
            rotulos={vertice: "%d/" % tempo},
            estrutura=_mostrar_pilha(pilha),
        )

        for vizinho, _peso in grafo.vizinhos(vertice):  # já em ordem alfabética
            if vizinho not in descoberta:
                pai[vizinho] = vertice
                registro.anotar(
                    "%s → %s: %s ainda não foi visitado, desce por essa aresta." % (vertice, vizinho, vizinho),
                    atual=vertice,
                    foco=(vertice, vizinho),
                    arestas=[(vertice, vizinho, "arvore")],
                    estrutura=_mostrar_pilha(pilha),
                )
                visitar(vizinho)
                registro.anotar(
                    "Volta para %s (backtracking)." % vertice,
                    atual=vertice,
                    estrutura=_mostrar_pilha(pilha),
                )
            else:
                registro.anotar(
                    "%s → %s: %s já foi visitado, ignora." % (vertice, vizinho, vizinho),
                    atual=vertice,
                    foco=(vertice, vizinho),
                    estrutura=_mostrar_pilha(pilha),
                )

        tempo += 1
        finalizacao[vertice] = tempo
        pilha.pop()
        registro.anotar(
            "%s finalizado: todos os vizinhos foram explorados (finalização = %d)." % (vertice, tempo),
            atual=vertice,
            vertices={vertice: "visitado"},
            rotulos={vertice: "%d/%d" % (descoberta[vertice], tempo)},
            estrutura=_mostrar_pilha(pilha),
        )

    visitar(origem)

    nao_alcancados = [v for v in grafo.vertices() if v not in descoberta]
    registro.anotar(
        "Fim da DFS. Ordem de visita: %s." % ", ".join(ordem_visita)
        + (" Não alcançados a partir de %s: %s." % (origem, ", ".join(nao_alcancados)) if nao_alcancados else "")
    )

    return {
        "ordem": ordem_visita,
        "pai": pai,
        "descoberta": descoberta,
        "finalizacao": finalizacao,
        "nao_alcancados": nao_alcancados,
        "becos_sem_saida": becos_sem_saida(grafo),
        "passos": registro.passos,
    }


def becos_sem_saida(grafo):
    """
    Direcionado: vértice sem nenhuma aresta saindo (quem chega, não sai).
    Não-direcionado: vértice com no máximo uma ligação (rua sem saída ou isolado).
    """
    becos = []
    for v in grafo.vertices():
        grau = len(grafo.vizinhos(v))
        if grafo.direcionado and grau == 0:
            becos.append(v)
        elif not grafo.direcionado and grau <= 1:
            becos.append(v)
    return becos


def _mostrar_pilha(pilha):
    return {"nome": "Pilha de recursão (topo à direita)", "itens": list(pilha)}
