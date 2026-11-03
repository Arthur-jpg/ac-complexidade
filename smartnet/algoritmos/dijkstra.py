"""
Dijkstra — rota mais curta para veículos de emergência, da origem até todos os bairros.

Ideia:
    1. Todo mundo começa com distância ∞, menos a origem (distância 0).
    2. Pega o vértice ainda não finalizado com a MENOR distância
       (empate -> ordem alfabética) e o FINALIZA: a distância dele não muda mais.
    3. RELAXAMENTO: para cada vizinho, testa se passar pelo vértice
       finalizado deixa o caminho mais curto:
            se dist[v] + peso(v, vizinho) < dist[vizinho]:
                dist[vizinho] = dist[v] + peso(v, vizinho)
                anterior[vizinho] = v
    4. Repete até não sobrar ninguém.

Para achar rapidamente "o de menor distância" usamos um HEAP de mínimo
(fila de prioridade). Quando a distância de um vértice melhora, inserimos
uma entrada nova no heap; a antiga fica lá e é ignorada quando sair
("remoção preguiçosa"), porque aquele vértice já estará finalizado.

Só funciona com pesos NÃO-negativos: o algoritmo supõe que, depois de
finalizado, nenhum caminho futuro consegue ficar mais barato — com peso
negativo isso deixa de ser verdade.

Complexidade com lista de adjacência + heap: O((V + E) log V)
    - cada aresta pode gerar uma inserção no heap        -> O(E log V)
    - cada entrada sai do heap uma vez                   -> O((V + E) log V)
    - os vizinhos de cada vértice são lidos uma vez      -> O(E)
Com matriz de adjacência a versão natural é O(V²) (varre a linha inteira
para achar os vizinhos). Em grafo esparso, como uma cidade, O((V + E) log V)
é bem menor que O(V²).
Memória extra: O(V + E) (heap + dicionários).
"""

from ..estruturas.heap import HeapMinimo
from ..ordem import chave_alfabetica
from ..passos import Registro, formatar_numero

INFINITO = float("inf")


def dijkstra(grafo, origem):
    if grafo.tem_peso_negativo():
        raise ValueError(
            "O Dijkstra não funciona com pesos negativos: ele assume que uma distância "
            "finalizada nunca mais diminui. Remova os pesos negativos."
        )

    registro = Registro()
    distancia = {v: INFINITO for v in grafo.vertices()}
    anterior = {v: None for v in grafo.vertices()}
    finalizados = set()
    ordem_finalizacao = []
    tabela = []  # uma linha por vértice finalizado: distâncias naquele momento (matriz da prova)
    heap = HeapMinimo()

    distancia[origem] = 0
    # prioridade = (distância, nome em ordem alfabética) -> empate resolvido pelo nome
    heap.inserir((0, chave_alfabetica(origem)), origem)
    rotulos = {v: formatar_numero(distancia[v]) for v in grafo.vertices()}
    registro.anotar(
        "Distância da origem %s = 0; todos os outros começam com ∞." % origem,
        vertices={origem: "fronteira"},
        rotulos=rotulos,
        estrutura=_mostrar_heap(heap),
    )

    while not heap.vazio():
        (dist_v, _), vertice = heap.remover_minimo()
        if vertice in finalizados:
            registro.anotar(
                "Sai do heap uma entrada antiga de %s (%s); já finalizado, ignora." % (vertice, formatar_numero(dist_v)),
                estrutura=_mostrar_heap(heap),
            )
            continue

        tabela.append({
            "escolhido": vertice,
            "distancias": {v: distancia[v] for v in grafo.vertices() if v not in finalizados},
        })
        finalizados.add(vertice)
        ordem_finalizacao.append(vertice)
        registro.anotar(
            "Menor distância no heap: %s (%s). Finaliza %s." % (vertice, formatar_numero(dist_v), vertice),
            atual=vertice,
            vertices={vertice: "visitado"},
            estrutura=_mostrar_heap(heap),
        )

        for vizinho, peso in grafo.vizinhos(vertice):
            if vizinho in finalizados:
                continue
            nova_distancia = distancia[vertice] + peso
            texto = "Relaxa %s → %s: %s + %s = %s" % (
                vertice, vizinho, formatar_numero(distancia[vertice]),
                formatar_numero(peso), formatar_numero(nova_distancia),
            )

            if nova_distancia < distancia[vizinho]:  # RELAXAMENTO
                texto += " < %s → atualiza." % formatar_numero(distancia[vizinho])
                mudancas = [(vertice, vizinho, "arvore")]
                if anterior[vizinho] is not None:
                    mudancas.insert(0, (anterior[vizinho], vizinho, "normal"))  # caminho antigo deixa de valer
                distancia[vizinho] = nova_distancia
                anterior[vizinho] = vertice
                heap.inserir((nova_distancia, chave_alfabetica(vizinho)), vizinho)
                registro.anotar(
                    texto,
                    atual=vertice,
                    foco=(vertice, vizinho),
                    vertices={vizinho: "fronteira"},
                    arestas=mudancas,
                    rotulos={vizinho: formatar_numero(nova_distancia)},
                    estrutura=_mostrar_heap(heap),
                )
            else:
                registro.anotar(
                    texto + " ≥ %s → não melhora." % formatar_numero(distancia[vizinho]),
                    atual=vertice,
                    foco=(vertice, vizinho),
                    estrutura=_mostrar_heap(heap),
                )

    registro.anotar("Fim do Dijkstra. Ordem de finalização: %s." % ", ".join(ordem_finalizacao))

    return {
        "distancia": distancia,
        "anterior": anterior,
        "ordem": ordem_finalizacao,
        "tabela": tabela,
        "passos": registro.passos,
    }


def _mostrar_heap(heap):
    itens = ["%s:%s" % (item, formatar_numero(prioridade[0])) for prioridade, item in heap.conteudo()]
    return {"nome": "Heap de mínimo (vetor interno; o menor fica na frente)", "itens": itens}
