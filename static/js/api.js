// Comunicação com o back-end (Flask).

async function enviar(url, dados) {
  let resposta;
  try {
    resposta = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dados),
    });
  } catch {
    throw new Error("O servidor não respondeu. Verifique se o app.py está rodando.");
  }
  const json = await resposta.json().catch(() => ({}));
  if (!resposta.ok) throw new Error(json.erro || "Erro inesperado no servidor.");
  return json;
}

// O back-end só precisa dos nomes e das ligações (as posições são da tela).
export function paraBackend(grafo) {
  return {
    direcionado: grafo.direcionado,
    ponderado: grafo.ponderado,
    vertices: grafo.vertices.map((v) => v.nome),
    arestas: grafo.arestas.map((a) => ({ origem: a.origem, destino: a.destino, peso: a.peso })),
  };
}

export const api = {
  estrutura: (grafo) => enviar("/api/estrutura", paraBackend(grafo)),
  executar: (grafo, algoritmo, origem, destino) =>
    enviar("/api/executar", { grafo: paraBackend(grafo), algoritmo, origem, destino }),
  via: (de, para) => enviar("/api/via", { de, para }),
  local: (lat, lng) => enviar("/api/local", { lat, lng }),
  finalizar: () => enviar("/api/finalizar", {}),
};
