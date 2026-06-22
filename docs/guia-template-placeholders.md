# Guia: Como Criar/Editar Templates DOCX com Placeholders

Este guia explica como configurar os templates `.docx` para que o **CV Gen** substitua os dados dinamicamente via `docxtemplater`.

## Como funciona

O `docxtemplater` procura por `{placeholder}` dentro do arquivo `.docx` e substitui pelo valor correspondente do JSON. Para loops (listas como experience, education), usa `{#section}...{/section}`.

> **Os templates atuais** em `public/templates/` já foram gerados com placeholders pelo script `scripts/generate-templates.mjs`. Você pode usá-los diretamente ou personalizá-los no Word/Google Docs.

---

## Opção A — Usar os templates gerados (recomendado para começar)

Os arquivos já estão prontos em:
- `public/templates/cv-pt.docx` (Português)
- `public/templates/cv-en.docx` (Inglês)

Para regenerá-los após qualquer mudança no script:
```bash
node scripts/generate-templates.mjs
```

---

## Opção B — Personalizar no Word ou Google Docs

### 1. Abrir o template no Word/Google Docs

Abra `public/templates/cv-pt.docx` (ou o `-en`) no seu editor.

### 2. Placeholders simples

Substitua texto estático por placeholders. O docxtemplater procura por `{campo}`:

| Onde aparece no DOCX | Placeholder |
|---|---|
| Nome completo | `{name}` |
| Cargo/título | `{basicInfo.title}` |
| Localização | `{basicInfo.location}` |
| Email | `{basicInfo.email}` |
| Telefone | `{basicInfo.phone}` |
| Resumo profissional | `{summary}` |

### 3. Loops de lista

Para seções que se repetem, use `{#section}` para abrir e `{/section}` para fechar o bloco:

#### Experiências
```
{#experience}
  {role}  ·  {company}  —  {location}     {startDate} – {endDate}
  
  {#summary}{summary}{/summary}
  
  RESPONSABILIDADES PRINCIPAIS:
  {#responsibilities}
  • {.}
  {/responsibilities}
  
  RESULTADOS CHAVE:
  {#keyResults}
  • {.}
  {/keyResults}
  
  HABILIDADES: {#skills}{.}  {/skills}
{/experience}
```

> **`{.}`** = valor atual do loop (quando o array contém strings simples, não objetos)

#### Educação
```
{#education}
  {degree}  ·  {school}  —  {location}     {startDate} – {endDate}
  {#details}{details}{/details}
{/education}
```

#### Links (inline)
```
{#basicInfo.links}{label}: {url}  {/basicInfo.links}
```

#### Idiomas
```
{#languages}
  {name}: {level}
{/languages}
```

#### Certificações
```
{#certifications}
  {name}  ·  {issuer}  ·  {year}
{/certifications}
```

#### Skills gerais
```
{#skills}{.}  {/skills}
```

### 4. Blocos condicionais

Para mostrar uma seção **somente se o campo existir**:
```
{#summary}
Resumo Profissional
{summary}
{/summary}
```

### 5. Salvar e colocar na pasta correta

Salve como `.docx` (não `.docm`, não `.odt`) e coloque em:
```
public/templates/cv-pt.docx   (Português)
public/templates/cv-en.docx   (Inglês)
```

---

## Estrutura completa do JSON

Referência rápida dos campos disponíveis:

```json
{
  "name": "Seu Nome",
  "basicInfo": {
    "title": "Cargo Atual",
    "location": "Cidade, País",
    "email": "email@exemplo.com",
    "phone": "+55 11 99999-0000",
    "links": [
      { "label": "LinkedIn", "url": "https://linkedin.com/in/..." },
      { "label": "GitHub", "url": "https://github.com/..." }
    ]
  },
  "summary": "Resumo profissional opcional.",
  "experience": [
    {
      "role": "Senior Engineer",
      "company": "Empresa",
      "location": "Remoto",
      "startDate": "2022",
      "endDate": "Atual",
      "summary": "Resumo da experiência (opcional)",
      "responsibilities": ["Responsabilidade 1", "Responsabilidade 2"],
      "keyResults": ["Resultado 1", "Resultado 2"],
      "skills": ["React", "TypeScript"]
    }
  ],
  "education": [
    {
      "degree": "Bacharelado em Ciência da Computação",
      "school": "Universidade",
      "location": "Cidade",
      "startDate": "2014",
      "endDate": "2018",
      "details": "Detalhes opcionais"
    }
  ],
  "languages": [
    { "name": "Português", "level": "Nativo" },
    { "name": "Inglês", "level": "Fluente" }
  ],
  "certifications": [
    { "name": "AWS Certified", "issuer": "Amazon", "year": "2023" }
  ],
  "skills": ["React", "TypeScript", "Node.js"]
}
```

---

## Troubleshooting

### "Placeholder not found" no docxtemplater
- Verifique se o texto no DOCX está escrito exatamente como `{campo}` — sem espaços extras
- O Word/Google Docs às vezes fragmenta o texto internamente. Se isso acontecer, delete o placeholder e redigite manualmente

### PDF branco
- O PDF agora é gerado diretamente do HTML renderer, não do DOCX. Esse problema foi corrigido.

### DOCX exportado igual ao template
- Os templates originais (antes da correção) não tinham placeholders — eram os CVs reais
- Os templates em `public/templates/` agora têm os placeholders corretos
