# Motor de locomoção quadrúpede nativo — Berofel 3D Create

## Regra de execução
**Não executar Blender nem exigir Blender no fluxo de trabalho.** Toda a criação, ajuste, visualização e exportação deve acontecer no Berofel 3D Create, em HTML/JavaScript/Three.js. O Blender e seus projetos servem somente como referências de pesquisa; nenhuma etapa da pipeline depende dele.

## Referências de comportamento e arquitetura
- Morphological Animal Design App (ETH Zürich): https://github.com/houskan/morph
  - Referência para anatomia parametrizada, hierarquia quadrúpede e parâmetros de locomoção. A licença precisa ser confirmada antes de reutilizar código ou ativos.
- Animal Animator: https://extensions.blender.org/add-ons/animal-animator/
  - Referência para organizar ciclos de quadrúpedes e rigs de gato/lobo/cavalo. A extensão é GPL-3.0-or-later, mas isso não autoriza copiar automaticamente qualquer outro componente nem elimina obrigações de licença/atribuição.
- Deer Me: https://github.com/mortgoldman/deer_me
  - Referência adicional para fases de marcha, IK e coordenação da coluna; avaliar licença e aplicabilidade antes de qualquer reutilização.

A regra é **reimplementar os conceitos necessários em JavaScript/Three.js**. Não copiar código-fonte de terceiros até verificar licença, compatibilidade e obrigações de atribuição. O fato de o Blender ser open source não torna automaticamente livre todo add-on, ativo ou algoritmo publicado em outro projeto.

## Funções que o motor HTML deve oferecer
1. Rig quadrúpede com juntas nomeadas e pivôs estáveis.
2. Ciclo de pata dividido em apoio e balanço, com curva contínua e elevação controlada.
3. Parâmetros ajustáveis de comprimento do passo, duração do apoio, altura da pata e frequência.
4. Coordenação entre pata dianteira/traseira e lado esquerdo/direito, evitando duas oscilações artificiais por ciclo.
5. Transferência de peso e oscilação vertical/longitudinal do tronco sincronizadas à marcha.
6. Flexão distribuída da coluna, ajuste de ombros/bacia, cabeça e cauda com movimento secundário amortecido.
7. IK de patas para manter o contato aproximado com o chão e reduzir deslizamento.
8. Perfis separados para caminhada, trote e galope; cada perfil deve ter fases e cadência próprias.
9. Controles no editor para reproduzir, pausar, reiniciar, alterar velocidade e ajustar parâmetros sem editar o código manualmente.
10. Exportação GLB preservando hierarquia e animação; validar também o pacote ZIP e as funções já existentes.

## Critérios de aceitação
- Visualizar a onça de frente e de lado no próprio editor.
- Cada pata completa uma única trajetória coerente por ciclo.
- A pata fica baixa durante o apoio e levanta durante o balanço; não há salto de posição na transição.
- Sem joelhos invertidos, membros esticados de forma impossível ou oscilações duplicadas.
- Tronco, ombros, bacia, cabeça e cauda acompanham o movimento sem vibrar em frequência dupla.
- O ciclo fecha sem salto entre o último e o primeiro instante.
- Exportar GLB, reimportar no próprio editor e confirmar a animação.
- Preservar os presets de cavalo, gnu, humanoide, armas, ambiente, edição de peças e demais funções existentes.

## Estado e honestidade de validação
- Branch: `feature/feline-gait-blender-pipeline`.
- O ciclo procedural atual foi ajustado anteriormente, mas ainda não foi validado visualmente em navegador nesta etapa.
- A interface foi atualizada para descrever o fluxo HTML-first; isso não significa que todos os recursos listados acima já estejam implementados.
- Não declarar a caminhada corrigida até testar o ciclo no editor e inspecionar o resultado visual.
