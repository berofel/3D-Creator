# Teste do felino de referência — Creature Forge

## O que foi adicionado
O preset **Felino referência (teste de animação)** foi adicionado ao editor sem substituir o preset original **Onça-pintada**. Ele reutiliza a estrutura de rig e a função de movimentação felina já existentes, com uma paleta cinza-acastanhada e manchas quadradas mais próximas da referência.

## Como testar
1. Abra o Berofel 3D Create na versão que contém a branch `feature/img2threejs-reference-import`.
2. Em **Adicionar → Animais**, selecione **Felino referência (teste de animação)**.
3. Aguarde a cena ser criada e confira a vista 3D.
4. No seletor **Animação**, teste nesta ordem:
   - **Parar** — pose neutra e restauração dos pivôs.
   - **Respirar** — movimento sutil de repouso.
   - **Caminhar** — alternância das patas e balanço do tronco/cauda.
   - **Galopar** — passada mais ampla e ciclo mais rápido.
5. Volte para **Parar** entre os testes se precisar conferir a pose-base.
6. Recarregue a página e confirme que o preset original **Onça-pintada** ainda está disponível.
7. Se algo falhar, informe qual modo de animação, o comportamento observado e uma captura de tela.

## O que ainda não foi validado
Não executei o navegador nem os testes de interação/GLB neste ambiente. A animação é procedural de pré-visualização, não um esqueleto deformável de produção. O teste humano é necessário antes de mesclar a branch na versão principal.

## Segurança e rollback
- Backup anterior: `backup/pre-img2threejs-2026-10-29`
- Branch com a implementação: `feature/img2threejs-reference-import`
- O preset original foi mantido; a nova criatura é um preset adicional.
