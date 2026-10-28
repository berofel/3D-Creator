# Pipeline de caminhada felina — Blender → Berofel 3D Create

## Objetivo
Substituir a caminhada procedural atual da onça por um ciclo quadrúpede validado no Blender, sem regressões nos demais presets e ferramentas.

## Referências a avaliar
- Morphological Animal Design App (ETH Zürich): https://github.com/houskan/morph
  - Usa um esqueleto quadrúpede parametrizado e gera caminhada com parâmetros de locomoção.
  - Inclui referências de leão, guepardo e lobo; a onça deve ser ajustada ao seu esqueleto, não tratada como cópia literal de outro animal.
  - Antes de redistribuir qualquer código ou arquivo, verificar a licença diretamente no repositório e no conteúdo do pacote. Não presumir licença apenas por ser público.
- Animal Animator: https://extensions.blender.org/add-ons/animal-animator/
  - GPL-3.0-or-later; compatível com Blender 4.2+ segundo a página da extensão.
  - Anima rigs existentes; não cria o rig automaticamente. A página avisa que a versão inicial ainda não foi extensivamente testada.

## Contrato de exportação para o editor
O artefato que o editor precisa receber é um GLB com:
1. malha/partes da onça;
2. armature e hierarquia de ossos/pivôs consistente;
3. ação de caminhada em loop, com duração e frame rate definidos;
4. patas em contato com o chão durante o apoio e sem deslizamento excessivo;
5. movimento coordenado de ombros, bacia, coluna, pescoço e cauda;
6. nomes estáveis para o rig e para a ação, com escala/orientação documentadas.

## Validação antes de integrar
- Conferir quatro patas em câmera lateral e frontal.
- Confirmar uma única passada por pata no ciclo e a ordem quadrúpede esperada.
- Verificar contato no apoio, elevação apenas no balanço e joelhos sem hiperextensão.
- Confirmar loop sem salto no primeiro/último frame.
- Reproduzir a ação no Blender antes de exportar.
- Reimportar o GLB e verificar que a animação está presente e em loop.

## Integração no HTML
O editor atual é Three.js e a onça atual usa pivôs procedurais. A animação do Blender não pode ser aplicada diretamente a esses pivôs sem um mapeamento compatível. A integração deve carregar o GLB e sua ação por `GLTFLoader`/`AnimationMixer`, ou mapear explicitamente a ação para a hierarquia atual. Não remover o preset procedural nem outras funções até que a nova versão passe a validação.

## Estado
- Branch de trabalho: `feature/feline-gait-blender-pipeline`
- Não declarar a animação como corrigida até que o GLB exportado seja reproduzido no editor e o ciclo seja verificado visualmente.
- Não copiar código ou ativos externos para o projeto antes de confirmar licença e atribuição.
