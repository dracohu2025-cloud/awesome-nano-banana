export type ModelType = 'nano-banana' | 'nano-banana-pro';
export type DataSource = 'scraped';

export interface SourceLink {
  url: string;
}

export interface Attribution {
  image_copyright_holder?: string;
  image_license?: string;
  prompt_author?: string;
  prompt_author_link?: string;
}

export interface Case {
  id: string;                    // Unique ID: source-number
  case_no: number;
  title: string;
  title_en: string;
  author: string;
  author_link: string;
  source_link: string;
  image_url: string;             // External URL or local path
  prompt: string;
  prompt_en: string;
  prompt_note?: string;
  prompt_note_en?: string;
  reference_note?: string;
  reference_note_en?: string;
  model: ModelType;
  source: DataSource;
  category?: string;
  attribution?: Attribution;
  scraped_at?: string;           // ISO timestamp when scraped
}

export interface CaseWithPath extends Case {
  imagePath: string;
}

// Source metadata for display
export const SOURCE_INFO: Record<DataSource, { name: string; url: string; color: string }> = {
  scraped: {
    name: 'Twitter Scraped',
    url: 'https://github.com/dracohu2025-cloud/awesome-nano-banana',
    color: 'bg-cyan-200',
  },
};

export const MODEL_INFO: Record<ModelType, { name: string; emoji: string; color: string }> = {
  'nano-banana': {
    name: 'Nano Banana',
    emoji: '🍌',
    color: 'bg-[var(--accent-yellow)]',
  },
  'nano-banana-pro': {
    name: 'Nano Banana Pro',
    emoji: '🍌✨',
    color: 'bg-[var(--accent-coral)]',
  },
};
