# Berofel 3D Create

Editor web experimental de criaturas 3D, responsivo para computador e celular. Feito para abrir pelo Safari no iPhone sem instalar aplicativo.

## Testar no iPhone
1. Ative GitHub Pages em **Settings → Pages**.
2. Em Build and deployment, escolha **Deploy from a branch**, branch **main**, pasta **/(root)** e salve.
3. Abra https://berofel.github.io/3D-Creator/ no Safari.

O editor usa Three.js via CDN e precisa de internet para carregar o motor 3D. O protótipo inclui criação de quadrúpede, peças modulares, seleção, transformações, salvar/abrir JSON e exportação GLB. É uma base inicial e ainda precisa de testes em dispositivos reais.

## Arquivos
- `index.html`: interface web e motor 3D.
- `manifest.webmanifest`: metadados PWA.
- `sw.js`: cache básico para recursos estáticos (Three.js ainda depende de internet).
