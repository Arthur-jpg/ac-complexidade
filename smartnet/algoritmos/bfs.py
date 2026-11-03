"""
Busca em Largura (BFS) — propagação de alertas de emergência / ondas de rádio.

Ideia: a partir da origem, visita primeiro TODOS os vizinhos diretos
(nível 1), depois os vizinhos dos vizinhos (nível 2), e assim por diante —
como uma onda se espalhando. Para isso usa uma FILA: quem é descoberto
primeiro é processado primeiro.

Como a onda avança um nível por vez, o nível de cada vértice é o menor
número de arestas da origem até ele (caminho mais curto ignorando pesos).

Complexidade com lista de adjacência: O(V + E)
    - cada vértice entra e sai da fila uma única vez (O(1) cada) -> O(V)
    - a lista de vizinhos de cada vértice é percorrida uma vez   -> O(E)
Com matriz seria O(V²), pelo mesmo motivo da DFS.
Memória extra: O(V) (fila + dicionários).
"""

from ..estruturas.fila import Fila
from ..passos import Registro


def bfs(grafo, origem):
    registro = Registro()
    nivel = {origem: 0}  # também serve para saber quem já foi descoberto
    pai = {origem: None}
    ordem_visita = []
    fila = Fila()

    fila.enfileirar(origem)
    rodadas = [(None, fila.conteudo())]  # (quem saiu da fila, como a fila ficou) — formato da prova
    registro.anotar(
        "Coloca a origem %s na fila (nível 0)." % origem,
        vertices={origem: "fronteira"},
        rotulos={origem: "0"},
        estrutura=_mostrar_fila(fila),
    )

    while not fila.vazia():
        vertice = fila.desenfileirar()
        ordem_visita.append(vertice)
        registro.anotar(
            "Tira %s da fila e analisa seus vizinhos." % vertice,
            atual=vertice,
            estrutura=_mostrar_fila(fila),
        )

        for vizinho, _peso in grafo.vizinhos(vertice):  # já em ordem alfabética
            if vizinho not in nivel:
                nivel[vizinho] = nivel[vertice] + 1
                pai[vizinho] = vertice
                fila.enfileirar(vizinho)
                registro.anotar(
                    "%s → %s: descobre %s (nível %d) e coloca no fim da fila." % (vertice, vizinho, vizinho, nivel[vizinho]),
                    atual=vertice,
                    foco=(vertice, vizinho),
                    vertices={vizinho: "fronteira"},
                    arestas=[(vertice, vizinho, "arvore")],
                    rotulos={vizinho: str(nivel[vizinho])},
                    estrutura=_mostrar_fila(fila),
                )
            else:
                registro.anotar(
                    "%s → %s: %s já foi descoberto, ignora." % (vertice, vizinho, vizinho),
                    atual=vertice,
                    foco=(vertice, vizinho),
                    estrutura=_mostrar_fila(fila),
                )

        rodadas.append((vertice, fila.conteudo()))
        registro.anotar(
            "%s concluído." % vertice,
            vertices={vertice: "visitado"},
            estrutura=_mostrar_fila(fila),
        )

    nao_alcancados = [v for v in grafo.vertices() if v not in nivel]
    registro.anotar(
        "Fim da BFS. Ordem da fila: %s." % ", ".join(ordem_visita)
        + (" Não alcançados a partir de %s: %s." % (origem, ", ".join(nao_alcancados)) if nao_alcancados else "")
    )

    return {
        "ordem": ordem_visita,
        "nivel": nivel,
        "pai": pai,
        "rodadas": rodadas,
        "nao_alcancados": nao_alcancados,
        "passos": registro.passos,
    }


def _mostrar_fila(fila):
    return {"nome": "Fila (início à esquerda)", "itens": fila.conteudo()}
