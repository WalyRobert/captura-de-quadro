# Captura de Quadro

Extrator local de frames de vídeo com exportação PNG/JPG.

**Estado:** projeto experimental de portfólio, com melhorias de reprodutibilidade e testes. Autor: Waly Robert.

## Executar

Requer Node.js 22.16 ou superior e npm.

```bash
npm ci
npm run dev
```

Abra o endereço informado pelo Vite. Para produção local: `npm run build` e `npm run preview`. Os arquivos estáticos ficam em `dist/`.

## Recursos e limites

- Seleção de até 10 vídeos locais (300 MB por arquivo).
- Captura em Canvas e exportação com conversão real PNG/JPEG.
- Navegação temporal e seleção aproximada de frames.
- Liberação de URLs temporárias ao remover vídeos ou fechar a aplicação.

Os arquivos permanecem no navegador. O suporte a codec depende do navegador; aceitar uma extensão não garante sua reprodução. A captura rejeita frames maiores que 24 milhões de pixels. A busca de último frame é aproximada; não é extração bit a bit de todos os frames do arquivo.

## Verificação

```bash
npm test
npm run build
```

O build verifica TypeScript antes de compilar. O CI repete os testes e build em Node.js 22. `package-lock.json` registra as versões instaladas. Testes de DOM usam APIs simuladas e não substituem validação real de codecs, permissões, hardware ou provedores externos.

## Origem e organização

Derivado do projeto do autor no Google AI Studio. Esta versão adiciona entrada Vite portátil, estilos Tailwind compilados localmente, limites e correções do fluxo principal. As alterações são locais; não substituem automaticamente a versão no Studio.

- `App.tsx` e `components/`: interface e fluxo da aplicação.
- `utils/` e/ou `services/`: conversão, validação ou integração.
- `tests/`: regressões do comportamento principal.
- `.github/workflows/ci.yml`: verificação automática.

## Dados e licenciamento

Use arquivos de exemplo sintéticos ou que você tenha autorização para compartilhar. Segredos, dependências instaladas e builds são excluídos do Git. As dependências/modelos mantêm suas próprias licenças. Uma licença de redistribuição para o código deste projeto ainda não foi definida pelo autor.
