"""
Modo mapa: distâncias REAIS entre dois pontos da cidade.

Duas formas de medir uma via entre os bairros u e v:
    - pelas ruas:   pergunta ao OSRM (serviço público de rotas que usa os
                    dados do OpenStreetMap) o caminho de carro de u até v.
                    Ele devolve a distância, o tempo estimado e o desenho
                    da rota rua por rua.
    - linha reta:   fórmula de Haversine (distância sobre a esfera da Terra),
                    calculada aqui mesmo, sem internet.

Importante: o OSRM só é usado para MEDIR cada via (o peso da aresta).
Quem decide o caminho mínimo entre bairros, a árvore geradora etc. continua
sendo o nosso Dijkstra/Kruskal, rodando sobre a nossa lista de adjacência.
"""

import json
import math
import urllib.parse
import urllib.request

OSRM = "https://router.project-osrm.org/route/v1/driving/{lng1},{lat1};{lng2},{lat2}?overview=full&geometries=geojson"
NOMINATIM = "https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=16&accept-language=pt-BR&lat={lat}&lon={lng}"
AGENTE = "SmartNet-Analyzer/1.0 (trabalho academico IBMEC)"
RAIO_TERRA_KM = 6371.0

_cache_rotas = {}


def haversine_km(lat1, lng1, lat2, lng2):
    """Distância em linha reta sobre a superfície da Terra, em km."""
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp = math.radians(lat2 - lat1)
    dl = math.radians(lng2 - lng1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * RAIO_TERRA_KM * math.asin(math.sqrt(a))


def medir_via(lat1, lng1, lat2, lng2):
    """
    Mede a via entre dois pontos. Devolve:
        {"km": 4.3, "minutos": 9, "reta": 3.1, "geometria": [[lat, lng], ...], "fonte": "ruas"}
    Sem internet (ou se o OSRM falhar), usa a linha reta e "fonte" vira "linha_reta".
    """
    chave = (round(lat1, 5), round(lng1, 5), round(lat2, 5), round(lng2, 5))
    if chave in _cache_rotas:
        return _cache_rotas[chave]

    reta = round(haversine_km(lat1, lng1, lat2, lng2), 1)
    try:
        dados = _baixar_json(OSRM.format(lat1=lat1, lng1=lng1, lat2=lat2, lng2=lng2))
        rota = dados["routes"][0]
        pontos = [[round(lat, 5), round(lng, 5)] for lng, lat in rota["geometry"]["coordinates"]]
        resultado = {
            "km": round(rota["distance"] / 1000, 1),
            "minutos": max(1, round(rota["duration"] / 60)),
            "reta": reta,
            "geometria": simplificar(pontos, 0.00004),
            "fonte": "ruas",
        }
    except Exception:
        resultado = {
            "km": reta,
            "minutos": max(1, round(reta / 30 * 60)),  # supõe 30 km/h
            "reta": reta,
            "geometria": [[lat1, lng1], [lat2, lng2]],
            "fonte": "linha_reta",
        }
        return resultado  # não guarda no cache: na próxima pode ter internet

    _cache_rotas[chave] = resultado
    return resultado


def nome_do_local(lat, lng):
    """Sugere um nome para o ponto clicado (bairro ou rua), usando o Nominatim. None se falhar."""
    try:
        dados = _baixar_json(NOMINATIM.format(lat=lat, lng=lng))
    except Exception:
        return None
    endereco = dados.get("address", {})
    for campo in ("suburb", "neighbourhood", "quarter", "city_district", "road"):
        if endereco.get(campo):
            return endereco[campo]
    return None


def simplificar(pontos, tolerancia):
    """
    Douglas-Peucker: remove pontos quase alinhados do desenho da rota, para
    o arquivo ficar leve sem mudar o formato visível da rua.
    """
    if len(pontos) < 3:
        return pontos
    manter = [False] * len(pontos)
    manter[0] = manter[-1] = True
    pilha = [(0, len(pontos) - 1)]
    while pilha:
        inicio, fim = pilha.pop()
        maior, indice = 0.0, None
        for i in range(inicio + 1, fim):
            d = _distancia_ao_segmento(pontos[i], pontos[inicio], pontos[fim])
            if d > maior:
                maior, indice = d, i
        if indice is not None and maior > tolerancia:
            manter[indice] = True
            pilha.append((inicio, indice))
            pilha.append((indice, fim))
    return [p for p, m in zip(pontos, manter) if m]


def _distancia_ao_segmento(p, a, b):
    (y, x), (y1, x1), (y2, x2) = p, a, b
    dx, dy = x2 - x1, y2 - y1
    if dx == 0 and dy == 0:
        return math.hypot(x - x1, y - y1)
    t = max(0.0, min(1.0, ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy)))
    return math.hypot(x - (x1 + t * dx), y - (y1 + t * dy))


def _baixar_json(url):
    pedido = urllib.request.Request(url, headers={"User-Agent": AGENTE})
    with urllib.request.urlopen(pedido, timeout=8) as resposta:
        return json.loads(resposta.read().decode("utf-8"))
