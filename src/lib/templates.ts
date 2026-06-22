export type LanguageOption = {
  id: string;
  label: string;
  templatePath: string | null;
  disabled?: boolean;
};

export const languageOptions: LanguageOption[] = [
  { id: "pt-BR", label: "PT-BR", templatePath: "/templates/cv-pt.docx" },
  { id: "en-US", label: "EN-US", templatePath: "/templates/cv-en.docx" },
  {
    id: "es-ES",
    label: "ES-ES",
    templatePath: null,
    disabled: true,
  },
  {
    id: "de-DE",
    label: "DE-DE",
    templatePath: null,
    disabled: true,
  },
];

export function getTemplatePath(languageId: string): string | null {
  const match = languageOptions.find((option) => option.id === languageId);
  return match?.templatePath ?? null;
}
