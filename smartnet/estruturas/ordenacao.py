"""
Merge Sort, implementado do zero. Usado para ordenar as arestas no Kruskal
e os vértices em ordem alfabética.

Ideia (dividir e conquistar):
    1. divide a lista ao meio;
    2. ordena cada metade (recursivamente);
    3. intercala as duas metades já ordenadas.

Complexidade: O(n log n) em qualquer caso — são log n níveis de divisão
e, em cada nível, a intercalação passa por n elementos.

É ESTÁVEL: elementos com a mesma chave mantêm a ordem original.
"""


def merge_sort(itens, chave):
    if len(itens) <= 1:
        return list(itens)
    meio = len(itens) // 2
    esquerda = merge_sort(itens[:meio], chave)
    direita = merge_sort(itens[meio:], chave)
    return _intercalar(esquerda, direita, chave)


def _intercalar(esquerda, direita, chave):
    resultado = []
    i = 0
    j = 0
    while i < len(esquerda) and j < len(direita):
        # "<=" garante a estabilidade: no empate, vai primeiro quem veio da esquerda
        if chave(esquerda[i]) <= chave(direita[j]):
            resultado.append(esquerda[i])
            i += 1
        else:
            resultado.append(direita[j])
            j += 1
    # o que sobrou de um dos lados já está ordenado
    resultado.extend(esquerda[i:])
    resultado.extend(direita[j:])
    return resultado
