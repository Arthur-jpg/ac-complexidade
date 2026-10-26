"""
Fila (FIFO: o primeiro que entra é o primeiro que sai). Usada pela BFS.

Implementação: uma lista + o índice de quem está no início da fila.
Em vez de apagar o primeiro elemento (o que obrigaria a "empurrar" todos os
outros uma posição para trás, custo O(n)), só andamos com o índice.

    enfileirar     -> O(1)
    desenfileirar  -> O(1)
"""


class Fila:
    def __init__(self):
        self._itens = []
        self._inicio = 0  # posição do próximo a sair

    def enfileirar(self, item):
        self._itens.append(item)

    def desenfileirar(self):
        if self.vazia():
            raise IndexError("desenfileirar de uma fila vazia")
        item = self._itens[self._inicio]
        self._inicio += 1
        return item

    def vazia(self):
        return self._inicio == len(self._itens)

    def conteudo(self):
        """Quem ainda está na fila, do início para o fim (só para exibição)."""
        return self._itens[self._inicio:]
