"""
Gera static/dados/cidades.json: os bairros e as vias prontas de cada cidade,
já com a distância pelas ruas, o tempo de carro e o desenho de cada rota.

Assim a apresentação não depende do serviço de rotas estar no ar: as redes
prontas vêm desse arquivo. (Os mapas de fundo ainda precisam de internet.)

Rodar (só quando quiser mudar as redes):
    python ferramentas/gerar_cidades.py
"""

import json
import os
import sys
import time

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from smartnet.mapa import medir_via  # noqa: E402

CIDADES = [
    {
        "id": "rio",
        "nome": "Rio de Janeiro",
        "centro": [-22.925, -43.33],
        "zoom": 11,
        "bairros": {
            "Centro": (-22.9035, -43.1770),
            "Lapa": (-22.9130, -43.1795),
            "Flamengo": (-22.9320, -43.1745),
            "Botafogo": (-22.9510, -43.1835),
            "Copacabana": (-22.9690, -43.1860),
            "Ipanema": (-22.9840, -43.2030),
            "Leblon": (-22.9840, -43.2235),
            "Jardim Botânico": (-22.9660, -43.2200),
            "São Conrado": (-22.9990, -43.2640),
            "Barra da Tijuca": (-23.0000, -43.3650),
            "Recreio": (-23.0170, -43.4630),
            "Jacarepaguá": (-22.9380, -43.3400),
            "Tijuca": (-22.9240, -43.2330),
            "Maracanã": (-22.9120, -43.2290),
            "São Cristóvão": (-22.8990, -43.2200),
            "Méier": (-22.9020, -43.2800),
            "Madureira": (-22.8720, -43.3380),
            "Penha": (-22.8410, -43.2760),
            "Ilha do Governador": (-22.8110, -43.2050),
            "Bangu": (-22.8770, -43.4650),
            "Campo Grande": (-22.9030, -43.5600),
        },
        "vias": [
            ("Centro", "Lapa"), ("Centro", "São Cristóvão"), ("Lapa", "Flamengo"),
            ("Lapa", "Tijuca"), ("Flamengo", "Botafogo"), ("Botafogo", "Copacabana"),
            ("Botafogo", "Jardim Botânico"), ("Copacabana", "Ipanema"), ("Ipanema", "Leblon"),
            ("Ipanema", "Jardim Botânico"), ("Leblon", "Jardim Botânico"), ("Leblon", "São Conrado"),
            ("São Conrado", "Barra da Tijuca"), ("Jardim Botânico", "Tijuca"), ("Tijuca", "Maracanã"),
            ("Maracanã", "São Cristóvão"), ("Maracanã", "Méier"), ("São Cristóvão", "Penha"),
            ("São Cristóvão", "Ilha do Governador"), ("Penha", "Ilha do Governador"),
            ("Méier", "Madureira"), ("Penha", "Madureira"), ("Méier", "Jacarepaguá"),
            ("Tijuca", "Jacarepaguá"), ("Jacarepaguá", "Barra da Tijuca"), ("Madureira", "Jacarepaguá"),
            ("Barra da Tijuca", "Recreio"), ("Madureira", "Bangu"), ("Bangu", "Campo Grande"),
            ("Recreio", "Campo Grande"),
        ],
    },
    {
        "id": "sp",
        "nome": "São Paulo",
        "centro": [-23.56, -46.66],
        "zoom": 12,
        "bairros": {
            "Sé": (-23.5503, -46.6339),
            "República": (-23.5432, -46.6424),
            "Liberdade": (-23.5587, -46.6353),
            "Bela Vista": (-23.5614, -46.6558),
            "Pinheiros": (-23.5670, -46.6930),
            "Vila Madalena": (-23.5536, -46.6911),
            "Itaim Bibi": (-23.5855, -46.6787),
            "Moema": (-23.6009, -46.6640),
            "Vila Mariana": (-23.5891, -46.6340),
            "Mooca": (-23.5505, -46.5995),
            "Santana": (-23.5000, -46.6250),
            "Lapa": (-23.5226, -46.7039),
            "Morumbi": (-23.6000, -46.7200),
        },
        "vias": [
            ("Sé", "República"), ("Sé", "Liberdade"), ("Sé", "Mooca"), ("República", "Bela Vista"),
            ("República", "Santana"), ("Liberdade", "Bela Vista"), ("Liberdade", "Vila Mariana"),
            ("Bela Vista", "Pinheiros"), ("Bela Vista", "Vila Madalena"), ("Pinheiros", "Vila Madalena"),
            ("Vila Madalena", "Lapa"), ("Lapa", "Santana"), ("Pinheiros", "Itaim Bibi"),
            ("Itaim Bibi", "Moema"), ("Vila Mariana", "Moema"), ("Pinheiros", "Morumbi"),
            ("Itaim Bibi", "Morumbi"), ("Mooca", "Vila Mariana"), ("Mooca", "Santana"),
        ],
    },
    {
        "id": "bh",
        "nome": "Belo Horizonte",
        "centro": [-19.91, -43.95],
        "zoom": 12,
        "bairros": {
            "Centro": (-19.9191, -43.9386),
            "Savassi": (-19.9389, -43.9346),
            "Lourdes": (-19.9330, -43.9450),
            "Santa Efigênia": (-19.9250, -43.9250),
            "Floresta": (-19.9140, -43.9300),
            "Mangabeiras": (-19.9500, -43.9150),
            "Belvedere": (-19.9750, -43.9400),
            "Gutierrez": (-19.9370, -43.9580),
            "Buritis": (-19.9750, -43.9670),
            "Barreiro": (-19.9770, -44.0190),
            "Cidade Nova": (-19.8900, -43.9300),
            "Pampulha": (-19.8510, -43.9690),
            "Venda Nova": (-19.8150, -43.9550),
        },
        "vias": [
            ("Centro", "Savassi"), ("Centro", "Lourdes"), ("Centro", "Floresta"),
            ("Centro", "Santa Efigênia"), ("Savassi", "Lourdes"), ("Savassi", "Mangabeiras"),
            ("Savassi", "Santa Efigênia"), ("Lourdes", "Gutierrez"), ("Gutierrez", "Buritis"),
            ("Buritis", "Barreiro"), ("Gutierrez", "Barreiro"), ("Savassi", "Belvedere"),
            ("Belvedere", "Buritis"), ("Mangabeiras", "Belvedere"), ("Floresta", "Cidade Nova"),
            ("Cidade Nova", "Pampulha"), ("Centro", "Pampulha"), ("Pampulha", "Venda Nova"),
            ("Cidade Nova", "Venda Nova"),
        ],
    },
]


def gerar():
    saida = []
    for cidade in CIDADES:
        bairros = cidade["bairros"]
        vias = []
        for u, v in cidade["vias"]:
            (lat1, lng1), (lat2, lng2) = bairros[u], bairros[v]
            medida = medir_via(lat1, lng1, lat2, lng2)
            if medida["fonte"] != "ruas":
                raise SystemExit("Falha ao consultar o OSRM para %s — %s. Tente de novo." % (u, v))
            print("%-16s %-20s → %-20s %5.1f km  %3d min  (%d pontos)"
                  % (cidade["nome"], u, v, medida["km"], medida["minutos"], len(medida["geometria"])))
            vias.append({"origem": u, "destino": v, "km": medida["km"], "minutos": medida["minutos"],
                         "reta": medida["reta"], "geometria": medida["geometria"]})
            time.sleep(0.4)  # educação com o servidor público
        saida.append({
            "id": cidade["id"],
            "nome": cidade["nome"],
            "centro": cidade["centro"],
            "zoom": cidade["zoom"],
            "bairros": [{"nome": n, "lat": lat, "lng": lng} for n, (lat, lng) in bairros.items()],
            "vias": vias,
        })

    destino = os.path.join(os.path.dirname(__file__), "..", "static", "dados", "cidades.json")
    os.makedirs(os.path.dirname(destino), exist_ok=True)
    with open(destino, "w", encoding="utf-8") as arquivo:
        json.dump(saida, arquivo, ensure_ascii=False, separators=(",", ":"))
    print("Gerado:", os.path.normpath(destino), "(%d KB)" % (os.path.getsize(destino) // 1024))


if __name__ == "__main__":
    gerar()
