# DMI Gerenciamento (v2)

Painel de Meta de Lucro - Vite + React (pronto para Vercel)

## Novidades na v2
- Meta ajustada para R$ 25.000,00
- Exibe também Faturamento total (soma das saídas) e Investimento total (soma das entradas)
- Relatórios mensais: selecione mês/ano para ver totais e tabela filtrada
- Export CSV para todo o histórico ou somente o mês filtrado

## Como rodar localmente

1. Instale dependências:
   ```bash
   npm install
   ```
2. Rode o ambiente de desenvolvimento:
   ```bash
   npm run dev
   ```
3. Abra o link indicado pelo Vite (ex: http://localhost:5173)

## Deploy na Vercel
- Crie um repositório no GitHub com estes arquivos e conecte na Vercel.
- Em **Build & Development Settings** garanta:
  - Framework Preset: **Vite**
  - Build Command: `npm run build`
  - Output Directory: `dist`

## Nota
- O app salva os dados no `localStorage` do navegador.
- Para exportar os registros, use o botão "Exportar CSV (todas)" ou "Exportar CSV (mês)".
