"""
Registro dos passos de um algoritmo, para a interface animar depois.

O registro NÃO muda a lógica do algoritmo: ele só anota o que aconteceu,
como um "diário de bordo". A interface lê essa lista e vai acendendo
vértices e arestas na tela, passo a passo.

Cada passo pode informar:
    descricao  -> texto explicando o passo
    atual      -> vértice em destaque neste passo
    foco       -> aresta sendo analisada neste passo (u, v)
    vertices   -> mudanças de estado dos vértices   {vértice: estado}
    arestas    -> mudanças de estado das arestas    [(u, v, estado)]
    rotulos    -> textos mostrados ao lado dos vértices {vértice: texto}
    estrutura  -> conteúdo da estrutura auxiliar (pilha, fila, heap...)

"vertices", "arestas" e "rotulos" são acumulativos (valem até alguém mudar);
"atual" e "foco" valem só para aquele passo.
"""


class Registro:
    def __init__(self):
        self.passos = []

    def anotar(self, descricao, atual=None, foco=None, vertices=None,
               arestas=None, rotulos=None, estrutura=None):
        self.passos.append({
            "descricao": descricao,
            "atual": atual,
            "foco": list(foco) if foco else None,
            "vertices": vertices or {},
            "arestas": [list(a) for a in (arestas or [])],
            "rotulos": rotulos or {},
            "estrutura": estrutura,
        })


def formatar_numero(valor):
    """5.0 -> "5", 2.345 -> "2.35", infinito -> "∞"."""
    if valor == float("inf"):
        return "∞"
    if float(valor).is_integer():
        return str(int(valor))
    return str(round(valor, 2))
