# Berofel Character Library

Primeira fundação da biblioteca modular de personagens do Berofel 3D Create.

## Objetivo da primeira versão

Receber uma imagem 2D e montar uma aproximação visual em 3D a partir de componentes pré-existentes. A primeira versão não promete reconstrução perfeita nem geração automática de geometria inédita.

O fluxo pretendido é:

1. A IA analisa a imagem frontal e classifica silhueta, proporção, formato da cabeça, cabelo, roupa, acessórios e arma.
2. O catálogo procura componentes compatíveis.
3. O editor combina uma base humanoide, cabeça/cabelo, roupa e acessórios.
4. O personagem recebe o rig humanoide compatível com a base.
5. O resultado pode ser ajustado manualmente e exportado como GLB.
6. Em outra etapa, o personagem 3D rigado pode ser renderizado em sprites 2D.

## Bibliotecas avaliadas

Consulte `catalog.json` para URLs, funções, formatos, licenças e status de cada fonte.

### Fontes prioritárias

- **Quaternius Universal Base Characters:** seis bases humanoides em proporções teen/regular/superhero, masculinas e femininas, rig humanoide e 20 cabelos; CC0.
- **Quaternius Modular Character Outfits - Fantasy:** 12 conjuntos, 62 peças modulares e três variações de textura; CC0 e compatível com as bases Universal.
- **Quaternius Universal Animation Library:** mais de 120 animações para rig humanoide; CC0.
- **Three.js GLTFLoader:** já é utilizado pelo editor; deve continuar sendo o caminho de importação GLB, sem adicionar um segundo motor 3D.

### Ferramentas de produção / referências

- **MPFB/MakeHuman:** gerador e biblioteca humanoide para Blender. Código GPL-3.0-or-later; licenças dos assets devem ser verificadas individualmente.
- **CharacterCreator (kblood):** referência arquitetural próxima do fluxo Blender/MPFB → GLB/JSON → visualizador Three.js. O repositório está GPL-3.0-or-later desde 2026-10-03; não copiar código para o editor sem decisão explícita sobre obrigações GPL.
- **Sprite Sheet Maker:** conversor Blender 3D → sprites com pixelização; GPL-3.0-or-later. Estudar como ferramenta separada ou implementar um conversor independente.
- **CharMorph:** candidato a estudo para morfologia modular; licença de código e assets ainda precisa de auditoria antes de qualquer incorporação.

## Arquitetura de ponte

### Ponte imediata: catálogo + GLB

O editor atual é uma aplicação web baseada em Three.js e já carrega `GLTFLoader`. A integração mais segura é:

- catálogo JSON com metadados e origem/licença de cada asset;
- arquivos GLB locais no diretório da biblioteca;
- carregamento sob demanda pelo GLTFLoader já existente;
- componentes anexados a ossos ou âncoras nomeadas;
- ficha JSON de montagem para reconstruir a combinação.

O módulo `three-gltf-bridge.js` fornece primitivas reutilizáveis para carregar GLB e anexar acessórios a ossos/âncoras. Ele não substitui o importador, rig ou animação existentes.

### Limite importante: roupas skinned

Acessórios rígidos (cabelo, capacete, arma) podem ser anexados a um osso nomeado. Roupas que deformam com o corpo precisam compartilhar um esqueleto compatível e pesos de skinning corretos. Não basta colocar uma malha perto do tronco; não faremos uma falsa integração que pareça funcionar em repouso e quebre ao animar.

### Ponte avançada: Blender local

MPFB e os conversores Blender são ferramentas Python executadas dentro do Blender. Uma página web não pode iniciar Blender diretamente por segurança do navegador. Para automação local, será necessário um pequeno serviço local/worker que receba tarefas e invoque o Blender em modo headless. Isso fica para uma etapa posterior; o editor web continua funcionando com GLBs prontos.

## Padrão de asset

Cada asset importado deve ter um registro com:

- `id`, `name`, `category`, `tags`;
- `sourceUrl`, `license`, `licenseFile`, `author`;
- `file`, `format`, `preview`;
- `rigId`, `anchorId`, `compatibleBases`;
- `styleTags` e `proportionTags`.

Categorias iniciais: `body-base`, `head`, `hair`, `face`, `eyes`, `top`, `bottom`, `shoes`, `armor`, `weapon`, `accessory`, `animation`.

## Próxima implementação funcional

1. Obter os arquivos oficiais Standard dos três pacotes Quaternius e preservar os arquivos de licença.
2. Auditar os GLBs: escala, hierarquia, nomes de ossos, materiais, texturas e rig.
3. Importar primeiro uma base masculina e uma feminina, depois cabelo e um conjunto de roupa.
4. Criar um preset de montagem que prove troca de cabelo/arma/acessório sem quebrar o rig.
5. Só então conectar a seleção de peças à interface e ao fluxo de IA.

## Preservação

Esta etapa é aditiva. Não modifica os modelos existentes da onça, cavalo ou gnu, nem o motor de rig/animação, a câmera, o visualizador ou o fluxo de exportação.
