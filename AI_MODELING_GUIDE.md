# Berofel 3D Create — Manual de modelagem assistida por IA

Este projeto é uma bancada leve para criar criaturas low-poly/HD-2.5D no navegador e exportá-las para Blender. A ideia é a IA construir o modelo usando peças nomeadas, hierarquia, transformações e animação, enquanto a pessoa fornece referências e decide o resultado final.

## Fluxo recomendado para uma IA

1. Leia `index.html` antes de editar. O protótipo concentra cena, presets, rig, controles e exportação nesse arquivo.
2. Analise todas as referências visuais fornecidas. Registre silhueta, proporções, materiais, cores, articulações, detalhes, poses e ciclos de movimento.
3. Planeje o modelo por grupos: massa principal, volumes secundários, placas/faixas, articulações, detalhes de rosto e extremidades.
4. Use peças low-poly com propósito. Combine blocos, prismas/peças inclinadas e faixas finas. Prefira silhueta e proporções corretas a adicionar centenas de polígonos.
5. Dê nomes descritivos em português às peças (por exemplo, “Garupa”, “Canela dianteira esquerda”, “Faixa do peito”). Isso facilita seleção, depuração e animação.
6. Organize as peças móveis em hierarquia com `Object3D.attach()` quando for necessário preservar a posição global; lembre-se de que a peça passa a herdar o movimento do pai. Evite escala não uniforme em pais de articulações quando possível.
7. Faça uma pose neutra e depois implemente animações em ciclos. Guarde a pose base e calcule as transformações a partir dela a cada quadro, para evitar acumular rotação.
8. Teste o preset, câmera, animações, JSON e GLB. Não declare que está validado em navegador se não executou o teste real.
9. Preserve os controles de toque para iPhone: não dependa apenas de hover ou de interações exclusivas de mouse.
10. Depois de mudar o app, atualize a constante `CACHE` em `sw.js` para invalidar o cache do service worker.

## Padrão visual do projeto

- Estilo: low-poly estilizado, com volumes facetados, blocos proporcionais, placas diagonais e faixas de cor.
- Complexidade: baixa a moderada; cada polígono deve contribuir para a silhueta, articulação ou leitura de material.
- Modelagem: separar torso/garupa, peito/ombros, pescoço, cabeça, focinho, orelhas, olhos, crina/cauda e segmentos das pernas.
- Animação: respiração/idle, caminhada com alternância de pernas, flexão das canelas, movimento da cabeça/pescoço e balanço da cauda.
- Exportação: conferir hierarquia e transformações antes de exportar GLB. JSON atualmente registra nome, tipo, posição, escala, rotação e cor de cada peça; ao importar, a hierarquia não é reconstruída automaticamente.

## Convenções de código

A função `make(type, position, scale, color, name)` cria uma malha, adiciona-a a `scene` e a `parts`, seleciona-a e atualiza a lista. Ao criar presets, isso significa que a função pode mudar a seleção muitas vezes; no fim do preset, use `select(null)` ou selecione a peça inicial desejada.

A função `cacheRigPose()` guarda a pose inicial das peças em `rigBase`. Chame-a **depois** de terminar de criar um modelo. A função `updateRig(dt)` anima as peças com base nesses valores.

Antes de alterar um preset, procure os identificadores usados em `updateRig`; tipos e nomes das peças precisam corresponder aos testes de animação. Para pernas, use nomes consistentes como “Perna superior dianteira esquerda”, “Canela dianteira esquerda” e “Casco dianteira esquerda”.

## Critérios de aceitação

- A página abre sem tela preta nem erros de JavaScript.
- A silhueta corresponde à referência em vista lateral, frontal e 3/4.
- Peças móveis acompanham seus pais corretamente.
- A animação é contínua, cíclica e sem deslocamento acumulado.
- A câmera e os controles continuam funcionais em toque.
- JSON e GLB exportam sem erros.
- A IA registra o que foi realmente testado e o que ainda precisa de validação humana.
