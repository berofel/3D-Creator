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

## Ordem técnica
- Fase A: analisar imagem e criar geometria/material procedural.
- Fase B: comparar render com referência e refinar a estética.
- Fase C: mapear as peças ao rig atual por adaptador.
- Fase D: preservar animações existentes e adicionar suporte ao novo modelo.
- Fase E: validar presets antigos, movimentos novos, toque, JSON e GLB.

Consulte skills/img2threejs-reference-first/SKILL.md e SAFE_UPDATE_PROTOCOL.md antes de qualquer mudança.
