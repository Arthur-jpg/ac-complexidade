"""
Kruskal — Árvore Geradora Mínima: a rede de fibra ótica mais barata que
interliga todos os bairros, sem ligações redundantes (sem ciclos).

Ideia (algoritmo guloso):
    1. Ordena todas as arestas do MENOR para o MAIOR peso
       (empate -> ordem alfabética das pontas: A—B antes de A—C).
    2. Percorre as arestas nessa ordem. Para cada uma:
         - se as duas pontas estão em "ilhas" (componentes) diferentes,
           ACEITA a aresta e junta as duas ilhas;
         - se já estão na mesma ilha, REJEITA: ligar de novo formaria um ciclo.
    3. Para quando tiver V - 1 arestas (uma árvore com V vértices tem V - 1 arestas).

Para saber em O(α(V)) se duas pontas já estão na mesma ilha, usamos o Union-Find.

Só faz sentido em grafo NÃO-direcionado: a árvore geradora mínima é
definida para ligações de mão dupla. (Para grafos direcionados existe outro
problema, a "arborescência mínima", resolvido pelo algoritmo de Edmonds.)

Se o grafo for desconexo, o resultado é uma FLORESTA geradora mínima:
uma árvore mínima para cada componente.

Complexidade: O(E log E)  (que é o mesmo que O(E log V), pois E ≤ V²)
    - ordenar as arestas com merge sort                 -> O(E log E)  <- domina
    - para cada aresta, encontrar/unir no Union-Find    -> O(E · α(V)) ≈ O(E)
    - listar as arestas a partir da lista de adjacência -> O(V + E)
Memória extra: O(V + E).
"""

from ..estruturas.ordenacao import merge_sort
from ..estruturas.union_find import UnionFind
from ..ordem import chave_alfabetica
from ..passos import Registro, formatar_numero


def kruskal(grafo):
    if grafo.direcionado:
        raise ValueError(
            "O Kruskal só se aplica a grafos não-direcionados: a árvore geradora mínima é "
            "definida para ligações de mão dupla. Desmarque a opção 'Direcionado' para executá-lo."
        )

    registro = Registro()
    vertices = grafo.vertices()
    arestas = merge_sort(
        grafo.arestas(),
        chave=lambda a: (a[2], chave_alfabetica(a[0]), chave_alfabetica(a[1])),
    )
    conjuntos = UnionFind(vertices)
    escolhidas = []
    analisadas = []  # (u, v, peso, aceita?) — histórico para a tabela
    custo_total = 0

    registro.anotar(
        "Ordena as %d arestas por peso (empate em ordem alfabética)." % len(arestas),
        estrutura={"nome": "Arestas ordenadas", "itens": [_nome_aresta(a) for a in arestas]},
    )

    for u, v, peso in arestas:
        if len(escolhidas) == len(vertices) - 1:
            break  # a árvore já está completa

        if conjuntos.encontrar(u) != conjuntos.encontrar(v):
            conjuntos.unir(u, v)
            escolhidas.append((u, v, peso))
            analisadas.append((u, v, peso, True))
            custo_total += peso
            registro.anotar(
                "%s—%s (%s): pontas em componentes diferentes → ACEITA. Custo até agora: %s."
                % (u, v, formatar_numero(peso), formatar_numero(custo_total)),
                foco=(u, v),
                vertices={u: "visitado", v: "visitado"},
                arestas=[(u, v, "arvore")],
                estrutura=_mostrar_conjuntos(conjuntos, vertices),
            )
        else:
            analisadas.append((u, v, peso, False))
            registro.anotar(
                "%s—%s (%s): %s e %s já estão conectados → REJEITA (formaria ciclo)."
                % (u, v, formatar_numero(peso), u, v),
                foco=(u, v),
                arestas=[(u, v, "rejeitada")],
                estrutura=_mostrar_conjuntos(conjuntos, vertices),
            )

    componentes = len(vertices) - len(escolhidas)
    registro.anotar(
        "Fim do Kruskal. %d arestas escolhidas, custo total %s."
        % (len(escolhidas), formatar_numero(custo_total))
        + (" O grafo é desconexo: resultado é uma floresta com %d árvores." % componentes if componentes > 1 else "")
    )

    return {
        "arestas": escolhidas,
        "ordenadas": arestas,
        "analisadas": analisadas,
        "custo_total": custo_total,
        "componentes": componentes,
        "passos": registro.passos,
    }


def _nome_aresta(aresta):
    u, v, peso = aresta
    return "%s—%s:%s" % (u, v, formatar_numero(peso))


def _mostrar_conjuntos(conjuntos, vertices):
    grupos = conjuntos.grupos(vertices)
    return {"nome": "Componentes (Union-Find)", "itens": ["{" + ", ".join(g) + "}" for g in grupos]}
