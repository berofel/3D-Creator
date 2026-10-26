# Protocolo obrigatório de atualização segura — Berofel 3D Create

Este protocolo deve ser seguido antes de publicar qualquer mudança que altere a visualização 3D.

## Regra principal
**Nunca modificar diretamente a versão funcional sem preservar um ponto de retorno.** Toda alteração visual deve ser pequena, isolada e reversível.

## Fluxo obrigatório
1. Buscar a versão atual de `index.html` e `sw.js` na branch `main`; não trabalhar com cópias antigas ou trechos lembrados.
2. Criar uma branch de trabalho a partir do commit estável antes de uma mudança visual relevante.
3. Fazer uma única categoria de mudança por vez (geometria, materiais, rig/animação, renderização ou interface).
4. Verificar sintaxe JavaScript e confirmar que todos os identificadores usados existem. Procurar erros de escopo, imports, parênteses e chaves antes de publicar.
5. Não publicar se não for possível fazer uma validação mínima. Para mudanças de renderização, testar criação do renderer, render inicial, presets de cavalo/humano/ogro, alternância pele/esqueleto, animação e exportação GLB.
6. Preferir pull request para alterações de renderização; não mesclar automaticamente sem validação. Manter o último commit conhecido como funcional identificado no PR.
7. Só alterar a versão de cache do service worker quando o HTML for atualizado. O service worker não deve ser usado como substituto para testar o código.
8. Se uma atualização causar tela preta, erro de console ou perda do modelo, reverter imediatamente para o último commit comprovadamente funcional antes de tentar outra correção.
9. Evitar grandes substituições por busca textual. Fazer patches pequenos e conferir o diff após cada alteração.
10. Informar claramente o que foi testado de verdade e o que permanece sem teste em navegador.

## Proteções do aplicativo
- O loop de renderização deve capturar exceções e pausar a renderização com uma mensagem visível, em vez de continuar falhando silenciosamente.
- Tratar perda do contexto WebGL e registrar o erro no console.
- Mudanças de geometria devem ter limites de complexidade adequados a dispositivos móveis; não aumentar segmentos indiscriminadamente.
- Presets devem ser capazes de reconstruir a cena sem deixar meshes antigos ou materiais/geométricas descartados ainda referenciados.
- Antes de remover ou substituir meshes, validar que as referências da cena, seleção, rig e exportador continuam coerentes.

## Limitação importante
A proteção de erro não garante que a cena esteja visualmente correta. Uma tela preta sem exceção pode resultar de câmera, materiais, iluminação, contexto WebGL, cache ou erro lógico. A validação visual real continua obrigatória.
