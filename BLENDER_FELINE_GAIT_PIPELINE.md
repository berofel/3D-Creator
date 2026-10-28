# Motor de locomoção quadrúpede nativo — Berofel 3D Create

## Regra de execução
**Não executar Blender nem exigir Blender no fluxo de trabalho.** Toda a criação, ajuste, visualização e exportação deve acontecer no Berofel 3D Create, em HTML/JavaScript/Three.js.

## Implementado na branch
Branch: `feature/feline-gait-blender-pipeline`

- Controles de cadência, comprimento do passo, fase de apoio e elevação da pata.
- Perfis procedurais separados para caminhada e galope.
- Solver geométrico aproximado de duas juntas, com alcance limitado e ângulos de quadril/anca e joelho calculados.
- Coordenação secundária de tronco, coluna lombar, pescoço, cabeça e cauda.
- Exportação de clipes amostrando também o rig específico da onça; anteriormente o bake chamava apenas o atualizador dos outros rigs.
- Duração de exportação da caminhada e do galope calculada para abranger um ciclo inteiro na cadência selecionada, com frame final no tempo exato de fim do ciclo.
- Cache do service worker atualizado para v121.

## Limites conhecidos
- O rig é formado por volumes modulares e pivôs, não por malha deformável/armature.
- O IK é uma aproximação sobre o sistema de coordenadas atual; não foi possível verificar visualmente o eixo efetivo dos joelhos ou o contato exato das patas neste ambiente.
- A exportação agora inclui amostras do atualizador da onça, mas nenhum arquivo GLB real foi gerado ou reimportado durante esta etapa. O fluxo depende da execução do editor no navegador e do modelo presente na cena.
- Não há perfil de trote independente na interface; o escopo atual mantém caminhada e galope.

## Checklist de validação pendente antes dos testes gerais
1. Abrir a branch no navegador, criar uma onça e inspecionar a caminhada de frente, de lado e em perspectiva.
2. Confirmar apoio das patas sem elevação e balanço com elevação, sem atravessar o chão nem deslizar excessivamente.
3. Conferir os eixos dos joelhos, alcance e ausência de inversões ou extensões impossíveis.
4. Confirmar que o loop não salta ao reiniciar e que a caminhada difere do galope.
5. Selecionar Walk e exportar GLB; confirmar que a exportação termina, tem tamanho não nulo e contém canais de animação.
6. Reimportar o GLB no editor ou Godot e verificar reprodução e continuidade.
7. Repetir a exportação para Gallop e verificar que o clipe correto foi selecionado.
8. Regressão: testar cavalo, gnu, humanoide, edição modular e pacote ZIP.

## Estado de validação
- Código e documentação atualizados no GitHub.
- Checagens estáticas confirmaram a presença dos controles, o solver geométrico, a chamada de atualização do rig da onça durante o bake e o cache v121.
- **Não foi possível executar um navegador gráfico nesta sessão.** Não foi feita inspeção visual, exportação GLB real nem reimportação. Portanto, a implementação está preparada para a rodada de validação, mas os critérios visuais e de exportação não podem ser marcados como aprovados até o teste no editor.
