export interface CategoryColor {
  label: string;
  color: string;
  text: string;
}

export const CATEGORY_COLORS: Record<string, CategoryColor> = {
  Cytrusowe: { label: "cytrusowy", color: "#F9FF52", text: "#000000" },
  Drzewne: { label: "drzewny", color: "#774414", text: "#FFFFFF" },
  "Świeże": { label: "świeży", color: "#9be5ed", text: "#000000" },
  Korzenne: { label: "korzenny", color: "#D84800", text: "#FFFFFF" },
  Kwiatowe: { label: "kwiatowy", color: "#FF5F8D", text: "#000000" },
  "Słodkie": { label: "słodki", color: "#ee363b", text: "#FFFFFF" },
  Orientalne: { label: "orientalny", color: "#bc4d10", text: "#FFFFFF" },
  Aromatyczne: { label: "aromatyczny", color: "#37a089", text: "#000000" },
  "Skórzane": { label: "skórzany", color: "#78483A", text: "#FFFFFF" },
  Zielone: { label: "zielony", color: "#0E8C1D", text: "#FFFFFF" },
  "Fougère": { label: "lawenda", color: "#9B7DB8", text: "#000000" },
  Ambrowe: { label: "ambrowy", color: "#bc4d10", text: "#FFFFFF" },
  "Piżmowe": { label: "piżmowy", color: "#E7D8EA", text: "#000000" },
  Wodne: { label: "wodny", color: "#63cce2", text: "#000000" },
  Owocowe: { label: "owocowy", color: "#FC4B29", text: "#000000" },
  Napoje: { label: "alkoholowy", color: "#F8EA8C", text: "#000000" },
  Inne: { label: "inne", color: "#9CA3AF", text: "#FFFFFF" },
};

export const CATEGORY_FALLBACK: CategoryColor = {
  label: "inne",
  color: "#9CA3AF",
  text: "#FFFFFF",
};

export function categoryColor(name: string): CategoryColor {
  return CATEGORY_COLORS[name] || CATEGORY_FALLBACK;
}
