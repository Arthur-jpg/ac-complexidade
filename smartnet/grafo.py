"""
Grafo armazenado em LISTA DE ADJACÊNCIA, implementada do zero.

Cada vértice guarda a lista dos seus vizinhos, junto com o peso da aresta:

    A -> [(B, 4), (C, 2)]
    B -> [(A, 4)]
    C -> [(A, 2)]

As listas ficam SEMPRE em ordem alfabética (e a lista de vértices também).
Assim, todo algoritmo que percorre os vizinhos já segue a regra da turma
(empate -> ordem alfabética) sem precisar ordenar nada na hora: o custo da
ordenação fica na construção do grafo, não nos algoritmos.

Grafo não-direcionado: a aresta A—B é guardada nos dois sentidos
(B aparece na lista de A e A aparece na lista de B).
Grafo sem peso: toda aresta recebe peso 1.

Por que lista e não matriz? (explicação completa no README)
    - Memória: a lista usa O(V + E); a matriz usa O(V²) sempre.
    - Achar os vizinhos de v: lista O(grau(v)); matriz O(V) (varre a linha toda).
    - Com isso DFS/BFS custam O(V + E) com lista, contra O(V²) com matriz.
    - O mapa de uma cidade é ESPARSO: cada bairro liga a poucos outros (E << V²).
"""

from .ordem import chave_alfabetica


class Grafo:
    def __init__(self, direcionado=False, ponderado=True):
        self.direcionado = direcionado
        self.ponderado = ponderado
        self._adjacencia = {}  # vértice -> lista de (vizinho, peso), em ordem alfabética
        self._vertices = []    # todos os vértices, em ordem alfabética

    # ------------------------------------------------------------------
    # Construção
    # ------------------------------------------------------------------

    def adicionar_vertice(self, vertice):
        """O(V) — por causa da inserção em ordem alfabética na lista de vértices."""
        if vertice not in self._adjacencia:
            self._adjacencia[vertice] = []
            self._inserir_ordenado(self._vertices, vertice)

    def adicionar_aresta(self, origem, destino, peso=1):
        """O(grau) — por causa da inserção em ordem alfabética."""
        if not self.ponderado:
            peso = 1
        self.adicionar_vertice(origem)
        self.adicionar_vertice(destino)
        self._inserir_vizinho(origem, destino, peso)
        if not self.direcionado and origem != destino:
            self._inserir_vizinho(destino, origem, peso)

    def _inserir_vizinho(self, vertice, vizinho, peso):
        """
        Coloca o vizinho na posição certa da lista, mantendo a ordem
        alfabética (mesma ideia do insertion sort). Se a aresta já existe,
        só atualiza o peso.
        """
        lista = self._adjacencia[vertice]
        for i in range(len(lista)):
            if lista[i][0] == vizinho:
                lista[i] = (vizinho, peso)
                return
        posicao = len(lista)
        for i in range(len(lista)):
            if chave_alfabetica(vizinho) < chave_alfabetica(lista[i][0]):
                posicao = i
                break
        lista.insert(posicao, (vizinho, peso))

    # ------------------------------------------------------------------
    # Consulta
    # ------------------------------------------------------------------

    @staticmethod
    def _inserir_ordenado(lista, vertice):
        posicao = len(lista)
        for i in range(len(lista)):
            if chave_alfabetica(vertice) < chave_alfabetica(lista[i]):
                posicao = i
                break
        lista.insert(posicao, vertice)

    def vertices(self):
        """Todos os vértices em ordem alfabética. O(V) — a lista já é mantida ordenada."""
        return list(self._vertices)

    def vizinhos(self, vertice):
        """Lista de (vizinho, peso) em ordem alfabética. O(1) para obter a lista."""
        return self._adjacencia[vertice]

    def existe_vertice(self, vertice):
        return vertice in self._adjacencia

    def numero_vertices(self):
        return len(self._adjacencia)

    def numero_arestas(self):
        return len(self.arestas())

    def arestas(self):
        """
        Lista de (origem, destino, peso). O(V + E).
        No não-direcionado, cada aresta aparece uma vez só, com as pontas
        em ordem alfabética: (A, B) e nunca (B, A).
        """
        resultado = []
        for u in self.vertices():
            for v, peso in self._adjacencia[u]:
                if self.direcionado or chave_alfabetica(u) <= chave_alfabetica(v):
                    resultado.append((u, v, peso))
        return resultado

    def tem_peso_negativo(self):
        for u in self._adjacencia:
            for _, peso in self._adjacencia[u]:
                if peso < 0:
                    return True
        return False

    def representacao(self):
        """
        Como o grafo está guardado na memória, para a interface desenhar.
        É lido direto da estrutura — a tela mostra exatamente o que existe aqui.
        """
        linhas = []
        entradas = 0
        for v in self.vertices():
            vizinhos = [{"vertice": viz, "peso": peso} for viz, peso in self._adjacencia[v]]
            entradas += len(vizinhos)
            linhas.append({"vertice": v, "vizinhos": vizinhos})
        n = self.numero_vertices()
        return {
            "tipo": "lista_adjacencia",
            "direcionado": self.direcionado,
            "ponderado": self.ponderado,
            "linhas": linhas,
            "numero_vertices": n,
            "numero_arestas": self.numero_arestas(),
            "memoria_lista": n + entradas,  # V cabeças de lista + uma entrada por vizinho
            "memoria_matriz": n * n,        # o que uma matriz ocuparia
        }

    # ------------------------------------------------------------------
    # Conversão a partir do JSON enviado pela interface
    # ------------------------------------------------------------------

    @classmethod
    def de_dict(cls, dados):
        """
        Formato esperado:
            {
              "direcionado": false,
              "ponderado": true,
              "vertices": ["A", "B", "C"],
              "arestas": [{"origem": "A", "destino": "B", "peso": 4}, ...]
            }
        """
        if not isinstance(dados, dict):
            raise ValueError("Grafo inválido.")
        grafo = cls(
            direcionado=bool(dados.get("direcionado", False)),
            ponderado=bool(dados.get("ponderado", True)),
        )
        for nome in dados.get("vertices", []):
            grafo.adicionar_vertice(_validar_nome(nome))
        for aresta in dados.get("arestas", []):
            origem = _validar_nome(aresta.get("origem"))
            destino = _validar_nome(aresta.get("destino"))
            peso = _validar_peso(aresta.get("peso", 1)) if grafo.ponderado else 1
            grafo.adicionar_aresta(origem, destino, peso)
        return grafo


def _validar_nome(nome):
    if nome is None or str(nome).strip() == "":
        raise ValueError("Todo vértice precisa de um nome.")
    return str(nome).strip()


def _validar_peso(peso):
    if isinstance(peso, bool):
        raise ValueError("Peso inválido: %r." % peso)
    try:
        valor = float(peso)
    except (TypeError, ValueError):
        raise ValueError("Peso inválido: %r. Use um número." % peso)
    if valor != valor or valor in (float("inf"), float("-inf")):
        raise ValueError("Peso inválido: %r." % peso)
    return int(valor) if valor.is_integer() else valor
