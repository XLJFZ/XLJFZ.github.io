import type { PhotoMetadata } from './photo-metadata';

export const THEMES = [
  { zh: '建筑', en: 'architecture' },
  { zh: '街道', en: 'street' },
  { zh: '山景', en: 'mountain' },
  { zh: '海岸', en: 'coast' },
  { zh: '夜景', en: 'night' },
  { zh: '人物', en: 'portrait' },
  { zh: '动物', en: 'animal' },
  { zh: '室内', en: 'interior' },
  { zh: '细节', en: 'detail' },
] as const;

export type RenameLanguage = 'zh' | 'en';
export type ThemeKey = (typeof THEMES)[number]['en'];

export function slugify(value: string, language: RenameLanguage) {
  const normalized = value.trim().normalize('NFKC');
  if (language === 'zh') {
    return normalized
      .replace(/[\\/:*?"<>|\s_]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }
  return normalized
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function exifDate(value?: string) {
  const match = value?.match(/^(\d{4})[:/-](\d{2})[:/-](\d{2})/);
  return match ? `${match[1]}-${match[2]}-${match[3]}` : '';
}

export function cameraSlug(
  metadata: PhotoMetadata | null,
  language: RenameLanguage,
) {
  return slugify(metadata?.cameraModel ?? '', language);
}

export function buildPhotoName(input: {
  originalName: string;
  date?: string;
  location: string;
  theme?: ThemeKey;
  customTheme?: string;
  camera?: string;
  sequence: number;
  language: RenameLanguage;
}) {
  const extension =
    input.originalName.match(/\.[^.]+$/)?.[0].toLowerCase() ?? '.jpg';
  const theme =
    input.customTheme ||
    THEMES.find((item) => item.en === input.theme)?.[input.language];
  const parts = [
    input.date,
    slugify(input.location, input.language),
    slugify(theme ?? '', input.language),
    slugify(input.camera ?? '', input.language),
    String(input.sequence).padStart(3, '0'),
  ].filter(Boolean);
  return `${parts.join('-')}${extension}`;
}

export function duplicateNames(names: string[]) {
  const counts = new Map<string, number>();
  for (const name of names) counts.set(name, (counts.get(name) ?? 0) + 1);
  return new Set(
    [...counts].filter(([, count]) => count > 1).map(([name]) => name),
  );
}
