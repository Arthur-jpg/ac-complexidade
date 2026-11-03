"""
Testes dos algoritmos com grafos cujas respostas são conhecidas.
Rodar com:  python -m unittest -v
"""

import json
import os
import unittest

from smartnet import apresentacao, central, mapa
from smartnet.algoritmos import bfs, dfs, dijkstra, kruskal
from smartnet.estruturas.fila import Fila
from smartnet.estruturas.heap import HeapMinimo
from smartnet.estruturas.ordenacao import merge_sort
from smartnet.estruturas.union_find import UnionFind
from smartnet.grafo import Grafo


def montar(arestas, direcionado=False, ponderado=True, vertices=()):
    grafo = Grafo(direcionado=direcionado, ponderado=ponderado)
    for v in vertices:
        grafo.adicionar_vertice(v)
    for aresta in arestas:
        grafo.adicionar_aresta(*aresta)
    return grafo


class TestEstruturas(unittest.TestCase):
    def test_fila_fifo(self):
        fila = Fila()
        for x in "ABC":
            fila.enfileirar(x)
        self.assertEqual(fila.desenfileirar(), "A")
        self.assertEqual(fila.conteudo(), ["B", "C"])

    def test_heap_devolve_em_ordem(self):
        heap = HeapMinimo()
        for x in [5, 3, 8, 1, 9, 2, 7]:
            heap.inserir(x, str(x))
        saida = [heap.remover_minimo()[0] for _ in range(7)]
        self.assertEqual(saida, [1, 2, 3, 5, 7, 8, 9])

    def test_merge_sort_estavel(self):
        itens = [(2, "a"), (1, "b"), (2, "c"), (1, "d")]
        self.assertEqual(merge_sort(itens, chave=lambda x: x[0]),
                         [(1, "b"), (1, "d"), (2, "a"), (2, "c")])

    def test_union_find(self):
        uf = UnionFind("ABCD")
        self.assertTrue(uf.unir("A", "B"))
        self.assertTrue(uf.unir("C", "D"))
        self.assertFalse(uf.unir("B", "A"))
        self.assertNotEqual(uf.encontrar("A"), uf.encontrar("C"))
        uf.unir("B", "D")
        self.assertEqual(uf.encontrar("A"), uf.encontrar("C"))


class TestGrafo(unittest.TestCase):
    def test_vizinhos_ficam_em_ordem_alfabetica(self):
        grafo = montar([("C", "D"), ("C", "A"), ("C", "B")])
        self.assertEqual([v for v, _ in grafo.vizinhos("C")], ["A", "B", "D"])

    def test_nao_direcionado_guarda_nos_dois_sentidos(self):
        grafo = montar([("A", "B", 4)])
        self.assertEqual(grafo.vizinhos("A"), [("B", 4)])
        self.assertEqual(grafo.vizinhos("B"), [("A", 4)])
        self.assertEqual(grafo.arestas(), [("A", "B", 4)])

    def test_direcionado_guarda_um_sentido(self):
        grafo = montar([("A", "B", 4)], direcionado=True)
        self.assertEqual(grafo.vizinhos("B"), [])

    def test_sem_peso_vira_peso_1(self):
        grafo = montar([("A", "B", 7)], ponderado=False)
        self.assertEqual(grafo.vizinhos("A"), [("B", 1)])

    def test_nomes_numericos_em_ordem_numerica(self):
        grafo = montar([("1", "10"), ("1", "2"), ("1", "3")])
        self.assertEqual([v for v, _ in grafo.vizinhos("1")], ["2", "3", "10"])


class TestDFS(unittest.TestCase):
    def test_regra_alfabetica(self):
        # começa em C, ligado a A, B e D -> vai primeiro para A
        grafo = montar([("C", "A"), ("C", "B"), ("C", "D"), ("A", "B")])
        r = dfs(grafo, "C")
        self.assertEqual(r["ordem"], ["C", "A", "B", "D"])
        self.assertEqual(r["pai"], {"C": None, "A": "C", "B": "A", "D": "C"})

    def test_tempos_cormen(self):
        # Figura 22.4 do Cormen (direcionado), começando em u.
        # Ao terminar a árvore de u, recomeça em w (próximo não visitado em ordem alfabética).
        grafo = montar([("u", "v"), ("u", "x"), ("v", "y"), ("w", "y"), ("w", "z"),
                        ("x", "v"), ("y", "x"), ("z", "z")], direcionado=True)
        r = dfs(grafo, "u")
        self.assertEqual(r["ordem"], ["u", "v", "y", "x", "w", "z"])
        self.assertEqual(r["raizes"], ["u", "w"])
        self.assertEqual(r["descoberta"], {"u": 1, "v": 2, "y": 3, "x": 4, "w": 9, "z": 10})
        self.assertEqual(r["finalizacao"], {"x": 5, "y": 6, "v": 7, "u": 8, "z": 11, "w": 12})
        self.assertEqual(r["nao_alcancados"], ["w", "z"])

    def test_recomeca_em_ordem_alfabetica(self):
        # duas ilhas: {C, D} e {A, B}; começando em C, recomeça por A
        grafo = montar([("C", "D"), ("B", "A")])
        r = dfs(grafo, "C")
        self.assertEqual(r["ordem"], ["C", "D", "A", "B"])
        self.assertEqual(r["raizes"], ["C", "A"])

    def test_becos_sem_saida(self):
        grafo = montar([("A", "B"), ("B", "C"), ("B", "D"), ("C", "D")], vertices=["E"])
        self.assertEqual(dfs(grafo, "A")["becos_sem_saida"], ["A", "E"])


class TestBFS(unittest.TestCase):
    def test_niveis_cormen(self):
        # Figura 22.3 do Cormen (não-direcionado), começando em s
        grafo = montar([("r", "s"), ("r", "v"), ("s", "w"), ("t", "u"), ("t", "w"),
                        ("t", "x"), ("u", "x"), ("u", "y"), ("w", "x"), ("x", "y")])
        r = bfs(grafo, "s")
        # r sai da fila antes de w, então v (vizinho de r) entra antes de t e x (vizinhos de w)
        self.assertEqual(r["ordem"], ["s", "r", "w", "v", "t", "x", "u", "y"])
        self.assertEqual(r["nivel"], {"s": 0, "r": 1, "w": 1, "t": 2, "x": 2, "v": 2, "u": 3, "y": 3})

    def test_regra_alfabetica(self):
        grafo = montar([("C", "D"), ("C", "B"), ("C", "A")])
        self.assertEqual(bfs(grafo, "C")["ordem"], ["C", "A", "B", "D"])


class TestDijkstra(unittest.TestCase):
    def test_cormen(self):
        # Figura 24.6 do Cormen (direcionado), origem s
        grafo = montar([("s", "t", 10), ("s", "y", 5), ("t", "x", 1), ("t", "y", 2),
                        ("y", "t", 3), ("y", "x", 9), ("y", "z", 2), ("x", "z", 4),
                        ("z", "s", 7), ("z", "x", 6)], direcionado=True)
        r = dijkstra(grafo, "s")
        self.assertEqual(r["distancia"], {"s": 0, "t": 8, "x": 9, "y": 5, "z": 7})
        self.assertEqual(r["anterior"], {"s": None, "t": "y", "x": "t", "y": "s", "z": "y"})
        self.assertEqual(r["ordem"], ["s", "y", "z", "t", "x"])

    def test_empate_alfabetico(self):
        # B e C ficam com distância 1; B é finalizado antes
        grafo = montar([("A", "C", 1), ("A", "B", 1), ("B", "D", 1), ("C", "D", 1)])
        r = dijkstra(grafo, "A")
        self.assertEqual(r["ordem"], ["A", "B", "C", "D"])
        self.assertEqual(r["anterior"]["D"], "B")

    def test_inalcancavel(self):
        grafo = montar([("A", "B", 2)], vertices=["Z"])
        self.assertEqual(dijkstra(grafo, "A")["distancia"]["Z"], float("inf"))

    def test_peso_negativo_e_recusado(self):
        grafo = montar([("A", "B", -1)])
        with self.assertRaises(ValueError):
            dijkstra(grafo, "A")


class TestKruskal(unittest.TestCase):
    def test_cormen(self):
        # Figura 23.4 do Cormen: custo mínimo = 37
        grafo = montar([("a", "b", 4), ("a", "h", 8), ("b", "c", 8), ("b", "h", 11),
                        ("c", "d", 7), ("c", "f", 4), ("c", "i", 2), ("d", "e", 9),
                        ("d", "f", 14), ("e", "f", 10), ("f", "g", 2), ("g", "h", 1),
                        ("g", "i", 6), ("h", "i", 7)])
        r = kruskal(grafo)
        self.assertEqual(r["custo_total"], 37)
        self.assertEqual(len(r["arestas"]), 8)
        # no empate de peso 8, a—h vem antes de b—c (ordem alfabética) e é escolhida
        self.assertIn(("a", "h", 8), r["arestas"])
        self.assertNotIn(("b", "c", 8), r["arestas"])

    def test_desconexo_vira_floresta(self):
        grafo = montar([("A", "B", 1), ("C", "D", 2)])
        r = kruskal(grafo)
        self.assertEqual(r["componentes"], 2)
        self.assertEqual(r["custo_total"], 3)

    def test_direcionado_e_recusado(self):
        with self.assertRaises(ValueError):
            kruskal(montar([("A", "B", 1)], direcionado=True))

    def test_folha_de_prova_registra_componentes_e_ciclo(self):
        grafo = montar([("A", "B", 1), ("B", "C", 2), ("A", "C", 3),
                        ("C", "D", 4), ("A", "D", 5)])
        resposta = apresentacao.formatar_kruskal(grafo, kruskal(grafo))
        prova = resposta["prova"]
        self.assertEqual(prova["ordenadas"], [["A", "B", "1"], ["B", "C", "2"],
                                               ["A", "C", "3"], ["C", "D", "4"], ["A", "D", "5"]])
        self.assertEqual(prova["iniciais"], ["{A}", "{B}", "{C}", "{D}"])
        self.assertEqual([linha["aceita"] for linha in prova["linhas"]], [True, True, False, True])
        self.assertEqual(prova["linhas"][2]["componentes"], ["{A, B, C}", "{D}"])
        self.assertEqual(prova["linhas"][-1]["componentes"], ["{A, B, C, D}"])
        self.assertEqual(prova["nao_analisadas"], 1)

    def test_folha_de_prova_mostra_vertice_isolado(self):
        grafo = montar([("A", "B", 1)], vertices=["C"])
        resposta = apresentacao.formatar_kruskal(grafo, kruskal(grafo))
        self.assertEqual(resposta["prova"]["linhas"][-1]["componentes"], ["{A, B}", "{C}"])
        self.assertTrue(any(s["titulo"] == "Grafo desconexo" for s in resposta["secoes"]))


class TestCentral(unittest.TestCase):
    GRAFO = {
        "direcionado": False,
        "ponderado": True,
        "vertices": ["A", "B", "C", "D"],
        "arestas": [
            {"origem": "A", "destino": "B", "peso": 3},
            {"origem": "A", "destino": "C", "peso": 1},
            {"origem": "C", "destino": "B", "peso": 1},
            {"origem": "B", "destino": "D", "peso": 5},
        ],
    }

    def test_todos_os_algoritmos_geram_json_valido(self):
        for algoritmo in ("dfs", "bfs", "dijkstra", "kruskal"):
            resposta = central.executar({"grafo": self.GRAFO, "algoritmo": algoritmo,
                                         "origem": "A", "destino": "D"})
            json.loads(json.dumps(resposta, allow_nan=False))  # sem Infinity/NaN no JSON
            self.assertTrue(resposta["secoes"])
            self.assertTrue(resposta["passos"])

    def test_dijkstra_com_destino(self):
        resposta = central.executar({"grafo": self.GRAFO, "algoritmo": "dijkstra",
                                     "origem": "A", "destino": "D"})
        self.assertEqual(resposta["secoes"][0]["conteudo"], "A → C → B → D  ·  custo 7")

    def test_origem_invalida(self):
        with self.assertRaises(ValueError):
            central.executar({"grafo": self.GRAFO, "algoritmo": "dfs", "origem": "X"})

    def test_estrutura(self):
        rep = central.estrutura(self.GRAFO)
        self.assertEqual(rep["linhas"][0], {"vertice": "A", "vizinhos": [
            {"vertice": "B", "peso": 3}, {"vertice": "C", "peso": 1}]})
        self.assertEqual(rep["memoria_lista"], 4 + 8)
        self.assertEqual(rep["memoria_matriz"], 16)


class TestMapa(unittest.TestCase):
    def test_haversine(self):
        # Centro -> Copacabana: uns 7,3 km em linha reta
        km = mapa.haversine_km(-22.9035, -43.1770, -22.9690, -43.1860)
        self.assertAlmostEqual(km, 7.3, delta=0.1)
        self.assertEqual(mapa.haversine_km(-22.9, -43.1, -22.9, -43.1), 0)

    def test_simplificar_remove_pontos_alinhados(self):
        reta = [[0, 0], [0, 1], [0, 2], [0, 3]]
        self.assertEqual(mapa.simplificar(reta, 0.01), [[0, 0], [0, 3]])
        curva = [[0, 0], [1, 1], [0, 2]]
        self.assertEqual(mapa.simplificar(curva, 0.01), curva)

    def test_sem_internet_usa_linha_reta(self):
        original = mapa._baixar_json

        def sem_rede(url):
            raise OSError("sem rede")

        mapa._baixar_json = sem_rede
        try:
            medida = mapa.medir_via(-22.9035, -43.1770, -22.9690, -43.1860)
        finally:
            mapa._baixar_json = original
        self.assertEqual(medida["fonte"], "linha_reta")
        self.assertEqual(medida["km"], medida["reta"])
        self.assertEqual(len(medida["geometria"]), 2)

    def test_redes_prontas_sao_grafos_validos(self):
        # as cidades do modo mapa passam pelo mesmo back-end do quadro branco
        caminho = os.path.join(os.path.dirname(__file__), "..", "static", "dados", "cidades.json")
        with open(caminho, encoding="utf-8") as arquivo:
            cidades = json.load(arquivo)
        rio = next(c for c in cidades if c["id"] == "rio")
        resposta = central.executar({
            "grafo": {"direcionado": False, "ponderado": True,
                      "vertices": [b["nome"] for b in rio["bairros"]],
                      "arestas": [{"origem": v["origem"], "destino": v["destino"], "peso": v["km"]}
                                  for v in rio["vias"]]},
            "algoritmo": "dijkstra", "origem": "Copacabana", "destino": "Campo Grande",
        })
        self.assertTrue(resposta["secoes"][0]["conteudo"].startswith("Copacabana → "))
        self.assertTrue(resposta["secoes"][0]["conteudo"].split(" → ")[-1].startswith("Campo Grande"))


if __name__ == "__main__":
    unittest.main()
