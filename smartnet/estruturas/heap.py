"""
Heap binário de mínimo (fila de prioridade). Usado pelo Dijkstra.

É uma árvore binária guardada dentro de uma lista:
    - o filho esquerdo de i está em 2*i + 1
    - o filho direito de i está em 2*i + 2
    - o pai de i está em (i - 1) // 2

Regra do heap: todo pai tem prioridade MENOR OU IGUAL à dos filhos.
Por isso o mínimo está sempre na posição 0.

    inserir         -> O(log n)  (sobe o elemento até o lugar certo)
    remover_minimo  -> O(log n)  (desce o elemento até o lugar certo)
"""


class HeapMinimo:
    def __init__(self):
        self._dados = []  # cada posição guarda (prioridade, item)

    def __len__(self):
        return len(self._dados)

    def vazio(self):
        return len(self._dados) == 0

    def inserir(self, prioridade, item):
        self._dados.append((prioridade, item))
        self._subir(len(self._dados) - 1)

    def remover_minimo(self):
        if self.vazio():
            raise IndexError("remover de um heap vazio")
        minimo = self._dados[0]
        ultimo = self._dados.pop()
        if self._dados:
            # o último elemento vai para a raiz e desce até o lugar certo
            self._dados[0] = ultimo
            self._descer(0)
        return minimo

    def conteudo(self):
        """A lista interna do heap, na ordem em que está guardada (só para exibição)."""
        return list(self._dados)

    def _subir(self, i):
        while i > 0:
            pai = (i - 1) // 2
            if self._dados[i][0] < self._dados[pai][0]:
                self._trocar(i, pai)
                i = pai
            else:
                break

    def _descer(self, i):
        n = len(self._dados)
        while True:
            menor = i
            esquerdo = 2 * i + 1
            direito = 2 * i + 2
            if esquerdo < n and self._dados[esquerdo][0] < self._dados[menor][0]:
                menor = esquerdo
            if direito < n and self._dados[direito][0] < self._dados[menor][0]:
                menor = direito
            if menor == i:
                break
            self._trocar(i, menor)
            i = menor

    def _trocar(self, i, j):
        self._dados[i], self._dados[j] = self._dados[j], self._dados[i]
