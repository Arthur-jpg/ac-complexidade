"""
Regra da turma: sempre que houver empate na escolha, vence o vértice que
vem primeiro em ordem alfabética.

Toda comparação entre nomes de vértices no projeto passa por esta função.
Assim a regra fica definida em um lugar só.
"""


def chave_alfabetica(nome):
    """
    Devolve a "chave" usada para ordenar o nome de um vértice.

    - Nomes com letras: ordem alfabética, sem diferenciar maiúscula/minúscula.
    - Nomes só com dígitos: ordem numérica ("2" vem antes de "10"),
      e vêm antes dos nomes com letras.
    """
    if nome.isdigit():
        return (0, int(nome), "", nome)
    return (1, 0, nome.upper(), nome)
