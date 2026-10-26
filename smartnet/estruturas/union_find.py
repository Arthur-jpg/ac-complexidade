"""
Union-Find (conjuntos disjuntos). Usado pelo Kruskal para saber, de forma
rápida, se dois vértices já estão conectados (se estiverem, ligar os dois
de novo formaria um ciclo).

Cada conjunto é uma árvore; o "representante" do conjunto é a raiz.

    encontrar(x)  -> devolve a raiz do conjunto de x
    unir(a, b)    -> junta os conjuntos de a e de b

Duas otimizações clássicas:
    - compressão de caminho: ao procurar a raiz, todo mundo no caminho
      passa a apontar direto para ela;
    - união por rank: a árvore mais baixa é pendurada na mais alta.
Com as duas, cada operação custa O(α(V)), onde α é a inversa da função de
Ackermann — na prática, uma constante (≤ 4 para qualquer grafo real).
"""


class UnionFind:
    def __init__(self, elementos):
        self._pai = {}
        self._rank = {}
        for elemento in elementos:
            self._pai[elemento] = elemento  # no início, cada um é o seu próprio conjunto
            self._rank[elemento] = 0

    def encontrar(self, x):
        # 1) sobe até a raiz
        raiz = x
        while self._pai[raiz] != raiz:
            raiz = self._pai[raiz]
        # 2) compressão de caminho: todos no caminho apontam direto para a raiz
        while self._pai[x] != raiz:
            proximo = self._pai[x]
            self._pai[x] = raiz
            x = proximo
        return raiz

    def unir(self, a, b):
        raiz_a = self.encontrar(a)
        raiz_b = self.encontrar(b)
        if raiz_a == raiz_b:
            return False  # já estavam no mesmo conjunto
        # união por rank: a árvore mais baixa vira filha da mais alta
        if self._rank[raiz_a] < self._rank[raiz_b]:
            raiz_a, raiz_b = raiz_b, raiz_a
        self._pai[raiz_b] = raiz_a
        if self._rank[raiz_a] == self._rank[raiz_b]:
            self._rank[raiz_a] += 1
        return True

    def grupos(self, ordem):
        """Lista os conjuntos atuais seguindo a ordem dada (só para exibição)."""
        por_raiz = {}
        resultado = []
        for elemento in ordem:
            raiz = self.encontrar(elemento)
            if raiz not in por_raiz:
                por_raiz[raiz] = []
                resultado.append(por_raiz[raiz])
            por_raiz[raiz].append(elemento)
        return resultado
