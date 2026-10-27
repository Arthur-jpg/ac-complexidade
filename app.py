"""
SmartNet Analyzer — servidor web.

Rodar:  python app.py
Depois abrir http://localhost:5000 (o navegador abre sozinho).

Rotas:
    GET  /               -> a interface (quadro branco)
    GET  /mapa           -> a interface no mapa real da cidade
    POST /api/estrutura  -> devolve como o grafo fica na lista de adjacência
    POST /api/executar   -> executa um algoritmo e devolve resultados + passos
    POST /api/via        -> mede uma via no mapa (distância pelas ruas, tempo, desenho)
    POST /api/local      -> sugere o nome de um ponto clicado no mapa
    POST /api/finalizar  -> encerra a aplicação (botão "Finalizar aplicação")
"""

import os
import socket
import threading
import webbrowser

from flask import Flask, jsonify, render_template, request

from smartnet import central, mapa

PORTA_PREFERIDA = 5000

app = Flask(__name__)


@app.get("/")
def pagina_inicial():
    return render_template("index.html")


@app.get("/mapa")
def pagina_mapa():
    return render_template("mapa.html")


@app.post("/api/estrutura")
def api_estrutura():
    return jsonify(central.estrutura(request.get_json()))


@app.post("/api/executar")
def api_executar():
    return jsonify(central.executar(request.get_json()))


@app.post("/api/via")
def api_via():
    pedido = request.get_json()
    de, para = pedido.get("de"), pedido.get("para")
    return jsonify(mapa.medir_via(_coordenada(de["lat"]), _coordenada(de["lng"]),
                                  _coordenada(para["lat"]), _coordenada(para["lng"])))


@app.post("/api/local")
def api_local():
    pedido = request.get_json()
    return jsonify({"nome": mapa.nome_do_local(_coordenada(pedido["lat"]), _coordenada(pedido["lng"]))})


def _coordenada(valor):
    try:
        return float(valor)
    except (TypeError, ValueError):
        raise ValueError("Coordenada inválida.")


@app.post("/api/finalizar")
def api_finalizar():
    # espera a resposta chegar no navegador e então encerra o processo
    threading.Timer(0.5, lambda: os._exit(0)).start()
    return jsonify({"mensagem": "Aplicação finalizada."})


@app.errorhandler(ValueError)
def erro_de_validacao(erro):
    # erros "esperados" (grafo inválido, peso negativo no Dijkstra, ...) viram mensagem na tela
    return jsonify({"erro": str(erro)}), 400


def porta_livre():
    """Usa a 5000; se estiver ocupada (no Mac o AirPlay usa a 5000), tenta 5001, 5002..."""
    for porta in range(PORTA_PREFERIDA, PORTA_PREFERIDA + 20):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as teste:
            if teste.connect_ex(("127.0.0.1", porta)) != 0:
                return porta
    raise SystemExit("Nenhuma porta livre entre 5000 e 5019.")


if __name__ == "__main__":
    porta = porta_livre()
    endereco = "http://localhost:%d" % porta
    print()
    print("  SmartNet Analyzer rodando em  %s" % endereco)
    print("  Modo mapa:                    %s/mapa" % endereco)
    print("  (o navegador abre sozinho; para encerrar use o botão Finalizar ou Ctrl+C)")
    print()
    threading.Timer(1.0, lambda: webbrowser.open(endereco)).start()
    app.run(port=porta, debug=False)
