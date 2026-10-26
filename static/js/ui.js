// Pequenos utilitários de interface.

export function escapar(texto) {
  return String(texto)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

// Mensagem rápida no rodapé da tela (no lugar de alert()).
export function avisar(mensagem, erro = false) {
  const area = document.getElementById("avisos");
  const aviso = document.createElement("div");
  aviso.className = "aviso" + (erro ? " erro-aviso" : "");
  aviso.textContent = mensagem;
  area.appendChild(aviso);
  setTimeout(() => aviso.remove(), erro ? 4500 : 2800);
}

// Botão que pede um segundo clique para confirmar ações destrutivas.
export function confirmarComSegundoClique(botao, textoConfirmar, acao) {
  const textoOriginal = botao.textContent;
  let timer = null;
  botao.addEventListener("click", () => {
    if (botao.classList.contains("confirmando")) {
      clearTimeout(timer);
      botao.classList.remove("confirmando");
      botao.textContent = textoOriginal;
      acao();
      return;
    }
    botao.classList.add("confirmando");
    botao.textContent = textoConfirmar;
    timer = setTimeout(() => {
      botao.classList.remove("confirmando");
      botao.textContent = textoOriginal;
    }, 3000);
  });
}
