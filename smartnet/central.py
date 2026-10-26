"""
Central de execução: recebe o pedido da interface, monta o grafo e
direciona para o algoritmo escolhido.

Fluxo:
    interface  --(JSON: grafo + algoritmo + origem)-->  central.executar()
    central    --> Grafo.de_dict()       monta a lista de adjacência
               --> dfs/bfs/dijkstra/kruskal   executa
               --> apresentacao.formatar_*()  transforma em textos/tabelas
    interface  <--(JSON: seções + passos da animação)--
"""

from . import apresentacao
from .algoritmos import bfs, dfs, dijkstra, kruskal
from .grafo import Grafo


def executar(pedido):
    grafo = Grafo.de_dict(pedido.get("grafo"))
    algoritmo = pedido.get("algoritmo")
    origem = pedido.get("origem")
    destino = pedido.get("destino") or None

    if grafo.numero_vertices() == 0:
        raise ValueError("O grafo está vazio. Adicione pelo menos um vértice.")

    if algoritmo in ("dfs", "bfs", "dijkstra") and not grafo.existe_vertice(origem):
        raise ValueError("Escolha um vértice de origem válido.")

    if algoritmo == "dfs":
        resultado = dfs(grafo, origem)
        return apresentacao.formatar_dfs(grafo, resultado, origem)

    if algoritmo == "bfs":
        resultado = bfs(grafo, origem)
        return apresentacao.formatar_bfs(grafo, resultado, origem)

    if algoritmo == "dijkstra":
        if destino is not None and not grafo.existe_vertice(destino):
            raise ValueError("Vértice de destino inválido.")
        resultado = dijkstra(grafo, origem)
        return apresentacao.formatar_dijkstra(grafo, resultado, origem, destino)

    if algoritmo == "kruskal":
        resultado = kruskal(grafo)
        return apresentacao.formatar_kruskal(grafo, resultado)

    raise ValueError("Algoritmo desconhecido: %r." % algoritmo)


def estrutura(dados_grafo):
    """Devolve como o grafo fica guardado na lista de adjacência (para a tela)."""
    return Grafo.de_dict(dados_grafo).representacao()
