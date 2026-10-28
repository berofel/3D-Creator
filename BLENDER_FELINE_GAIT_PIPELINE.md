# Motor de locomoção quadrúpede nativo — Berofel 3D Create

## Regra de execução
**Não executar Blender nem exigir Blender no fluxo de trabalho.** Toda a criação, ajuste, visualização e exportação deve acontecer no Berofel 3D Create, em HTML/JavaScript/Three.js. Projetos externos servem apenas como referências de pesquisa.

## Referências técnicas
- Morphological Animal Design App (ETH Zürich): https://github.com/houskan/morph — referência para anatomia parametrizada e parâmetros de locomoção. Confirmar licença antes de reutilizar código/ativos.
- Animal Animator: https://extensions.blender.org/add-ons/animal-animator/ — referência de organização de ciclos quadrúpedes; a extensão é GPL-3.0-or-later, mas isso não concede licença para copiar automaticamente outros componentes.
- Deer Me: https://github.com/mortgoldman/deer_me — referência adicional para fases de marcha e IK; verificar licença e aplicabilidade antes de reutilizar código.

A abordagem deste projeto é reimplementar os conceitos necessários em JavaScript/Three.js. O fato de o Blender ser open source não torna automaticamente livre todo add-on, ativo ou algoritmo de terceiros.

## Etapa atual implementada
Na branch `feature/feline-gait-blender-pipeline`, a interface agora inclui controles nativos para a marcha:
- **Cadência:** escala a velocidade do ciclo da onça.
- **Comprimento do passo:** ajusta a trajetória longitudinal das patas durante a caminhada.
- **Fase de apoio:** controla a fração normalizada do ciclo em que a pata permanece apoiada.
- **Elevação da pata:** ajusta a altura do balanço.
- **Restaurar parâmetros:** retorna aos valores padrão sem editar o código.
- Cache do service worker atualizado para v118 para evitar que o navegador continue usando a interface antiga.

Esses controles são ligados ao ciclo procedural existente da onça. Isso é uma primeira etapa incremental; ainda não equivale a um solver completo de IK nem a uma malha deformável com armature/skin.

## Próximas funções planejadas
1. Rig quadrúpede com juntas nomeadas e pivôs estáveis.
2. Trajetória contínua de apoio e balanço com controle da posição da pata.
3. IK simples de duas juntas para manter a pata perto do chão e reduzir deslizamento.
4. Coordenação de ombros, bacia, coluna, pescoço e cauda com amortecimento secundário.
5. Perfis separados para caminhada, trote e galope com fases próprias.
6. Exportação GLB com hierarquia e animação preservadas, seguida de reimportação no próprio editor.

## Critérios de aceitação
- Visualizar a onça de frente e de lado no próprio editor.
- Cada pata completa uma trajetória coerente por ciclo, sem oscilação duplicada.
- Pata baixa durante o apoio e elevada durante o balanço, com transições contínuas.
- Sem membros esticados de forma impossível ou vibração evidente.
- Ciclo fecha sem salto entre o fim e o começo.
- Exportar e reimportar GLB, confirmando a animação.
- Preservar os demais presets, ferramentas de edição e exportação.

## Estado de validação
- Alterações de interface e lógica gravadas no GitHub.
- Verificação realizada nesta etapa: presença dos quatro controles, ligação dos valores à caminhada e URL de cache v118.
- **Não foi executado teste visual em navegador nesta etapa.** Não declarar a animação corrigida até observar o ciclo no editor.
