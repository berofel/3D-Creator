# Fluxo de referência img2threejs — Berofel 3D Create

## Objetivo
Quando o usuário enviar uma imagem, a ordem é sempre:
1. **Copiar primeiro a estética** usando o fluxo/skill img2threejs: silhueta, proporções, materiais, cores e detalhes.
2. Conferir e aprovar visualmente a reconstrução.
3. **Adicionar/adaptar o rig depois**, preservando a estética recém-criada.
4. Testar movimentos e exportação.

## Regra absoluta
Não remover nem substituir nenhuma funcionalidade existente: presets, animações, estilos, rig mappings, ferramentas, câmera, controles de toque, importação/exportação ou peças. Toda alteração é aditiva, em branch separada, com backup e diff.

## Repositório oficial
https://github.com/img2threejs/img2threejs

O img2threejs é um fluxo de reconstrução procedural assistido por agente, não uma API mágica que o HTML do editor chama sozinho. O painel do editor apenas prepara o briefing; o agente de programação precisa receber a imagem e executar o fluxo de verdade.

## Perfil visual aprovado para o felino atual
- Silhueta atlética, torso alongado e facetado.
- Estética low-poly com aparência voxel/quadriculada, sem virar um cubo rígido.
- Pelagem cinza-acastanhada com manchas quadradas irregulares em tons escuros e claros.
- Cabeça felina compacta, focinho curto, orelhas pequenas e cauda longa com ponta escura.
- Pernas angulares segmentadas, com proporções ajustadas para o rig atual.
- A imagem define a estética; não deve substituir nem redefinir o ciclo de movimento.

**Movimentação:** manter a movimentação felina já existente no Creature Forge. Ajustar pivôs, nomes, proporções e mapeamento da nova geometria para o rig atual. Não substituir as animações nem alterar os outros presets. Se houver incompatibilidade, criar um adaptador isolado e documentar a limitação.

## Ordem técnica
- Fase A: analisar imagem e criar geometria/material procedural.
- Fase B: comparar render com referência e refinar a estética.
- Fase C: mapear as peças ao rig atual por adaptador.
- Fase D: preservar animações existentes e adicionar suporte ao novo modelo.
- Fase E: validar presets antigos, movimentos novos, toque, JSON e GLB.

Consulte skills/img2threejs-reference-first/SKILL.md e SAFE_UPDATE_PROTOCOL.md antes de qualquer mudança.
