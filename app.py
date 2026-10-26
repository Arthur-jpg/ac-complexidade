"""
SmartNet Analyzer — servidor web.

Rodar:  python app.py
Depois abrir http://localhost:5000 (o navegador abre sozinho).

Rotas:
    GET  /               -> a interface
    POST /api/estrutura  -> devolve como o grafo fica na lista de adjacência
    POST /api/executar   -> executa um algoritmo e devolve resultados + passos
    POST /api/finalizar  -> encerra a aplicação (botão "Finalizar aplicação")
"""

import os
import threading
import webbrowser

from flask import Flask, jsonify, render_template, request

from smartnet import central

PORTA = 5000

app = Flask(__name__)


@app.get("/")
def pagina_inicial():
    return render_template("index.html")


@app.post("/api/estrutura")
def api_estrutura():
    return jsonify(central.estrutura(request.get_json()))


@app.post("/api/executar")
def api_executar():
    return jsonify(central.executar(request.get_json()))


@app.post("/api/finalizar")
def api_finalizar():
    # espera a resposta chegar no navegador e então encerra o processo
    threading.Timer(0.5, lambda: os._exit(0)).start()
    return jsonify({"mensagem": "Aplicação finalizada."})


@app.errorhandler(ValueError)
def erro_de_validacao(erro):
    # erros "esperados" (grafo inválido, peso negativo no Dijkstra, ...) viram mensagem na tela
    return jsonify({"erro": str(erro)}), 400


if __name__ == "__main__":
    print("SmartNet Analyzer rodando em http://localhost:%d  (Ctrl+C para parar)" % PORTA)
    threading.Timer(1.0, lambda: webbrowser.open("http://localhost:%d" % PORTA)).start()
    app.run(port=PORTA, debug=False)
