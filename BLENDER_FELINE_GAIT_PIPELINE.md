# Motor de locomoção quadrúpede nativo — Berofel 3D Create

## Regra de execução
**Não executar Blender nem exigir Blender no fluxo de trabalho.** Toda a criação, ajuste, visualização e exportação deve acontecer no Berofel 3D Create, em HTML/JavaScript/Three.js. Projetos externos servem apenas como referências de pesquisa.

## Referências técnicas
- Morphological Animal Design App (ETH Zürich): https://github.com/houskan/morph — referência para anatomia parametrizada e parâmetros de locomoção. Confirmar licença antes de reutilizar código/ativos.
- Animal Animator: https://extensions.blender.org/add-ons/animal-animator/ — referência de organização de ciclos quadrúpedes; confirmar licença e obrigações antes de reutilizar componentes.
- Deer Me: https://github.com/mortgoldman/deer_me — referência adicional para fases de marcha e IK; verificar licença e aplicabilidade antes de reutilizar código.

A abordagem deste projeto é reimplementar os conceitos necessários em JavaScript/Three.js. Não copiar código ou ativos de terceiros sem confirmar as respectivas licenças.

## Implementado na branch
Branch: `feature/feline-gait-blender-pipeline`

- Controles de **cadência**, **comprimento do passo**, **fase de apoio** e **elevação da pata**, com restauração dos padrões.
- Caminhada e galope com perfis e fases diferentes.
- Trajetória longitudinal de apoio/balanço, com apoio sem elevação e arco de balanço.
- Solver procedural de duas juntas: estima o alcance da cadeia, limita a extensão e calcula ângulos de quadril/anca e joelho a partir do alvo da pata.
- Movimento secundário coordenado do tronco, coluna lombar, pescoço, cabeça e cauda.
- Reset da pose ao parar a animação.
- Cache do service worker atualizado para v119.

## Limites conhecidos
- O rig da onça é formado por volumes modulares e pivôs; ainda não é uma armature com deformação de pele.
- O solver atual é uma primeira solução geométrica aproximada. O encaixe exato dos eixos, a orientação dos joelhos, a posição do contato e o deslizamento precisam ser observados no navegador.
- O galope usa uma trajetória própria simplificada; não declarar contato físico ou suspensão perfeita sem teste visual.
- O trote ainda não é um modo separado na interface.
- A exportação GLB já existe no editor, mas a preservação correta da nova cinemática precisa de teste de ida e volta.

## Critérios de aceitação para a rodada de testes
1. Adicionar a onça e inspecionar a caminhada de frente, de lado e em perspectiva.
2. Confirmar que cada pata faz uma única trajetória por ciclo, sem tremor ou oscilação duplicada.
3. Confirmar que a pata fica baixa durante o apoio e sobe no balanço, sem atravessar o chão nem deslizar excessivamente.
4. Confirmar que a flexão das juntas não causa inversão ou extensão impossível.
5. Confirmar continuidade do loop, coordenação do tronco/coluna/cauda e diferenças claras entre caminhada e galope.
6. Exportar GLB e validar a animação reimportando no editor ou na Godot.
7. Regressão: verificar presets de cavalo, gnu, humanoide, ferramentas e edição modular.

## Estado de validação
- Código e documentação atualizados no GitHub.
- Checagens estáticas: a função de marcha contém o cálculo geométrico das duas juntas, os controles continuam presentes, o fluxo de exportação permanece no arquivo e a versão de cache é v119.
- **Não foi executado teste visual em navegador nem teste de reimportação GLB nesta etapa.** A cinemática está implementada como primeira versão, mas não deve ser chamada de validada até passar pelos testes acima.
