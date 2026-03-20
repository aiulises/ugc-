export interface BrandArchetype {
  name: string;
  vibe: string;
  tone: string;
  examples: string[];
  description: string;
}

export const brandArchetypes: Record<string, Record<'en' | 'da', BrandArchetype>> = {
  ruler: {
    en: {
      name: "The Ruler",
      vibe: "Luxury & Control",
      tone: "Commanding, refined, exclusive",
      examples: ["Rolex", "Mercedes-Benz"],
      description: "Represents power, control, and leadership."
    },
    da: {
      name: "Herskeren",
      vibe: "Luksus & Kontrol",
      tone: "Kommanderende, raffineret, eksklusiv",
      examples: ["Rolex", "Mercedes-Benz"],
      description: "Repræsenterer magt, kontrol og lederskab."
    }
  },
  hero: {
    en: {
      name: "The Hero",
      vibe: "Mastery & Performance",
      tone: "Brave, determined, confident",
      examples: ["Nike", "Red Bull"],
      description: "Inspires courage and achievement."
    },
    da: {
      name: "Helten",
      vibe: "Mestring & Præstation",
      tone: "Modig, beslutsom, selvsikker",
      examples: ["Nike", "Red Bull"],
      description: "Inspirerer til mod og bedrifter."
    }
  },
  lover: {
    en: {
      name: "The Lover",
      vibe: "Intimacy & Beauty",
      tone: "Passionate, sensual, elegant",
      examples: ["Chanel", "Dior"],
      description: "Focuses on aesthetics and sensuality."
    },
    da: {
      name: "Den Elskende",
      vibe: "Intimitet & Skønhed",
      tone: "Lidenskabelig, sensuel, elegant",
      examples: ["Chanel", "Dior"],
      description: "Fokuserer på æstetik og sensualitet."
    }
  },
  sage: {
    en: {
      name: "The Sage",
      vibe: "Wisdom & Intelligence",
      tone: "Knowledgeable, analytical, guiding",
      examples: ["Google", "Harvard"],
      description: "Acts as a source of wisdom."
    },
    da: {
      name: "Den Vise",
      vibe: "Visdom & Intelligens",
      tone: "Velfunderet, analytisk, vejledende",
      examples: ["Google", "Harvard"],
      description: "Fungerer som en kilde til visdom."
    }
  },
  creator: {
    en: {
      name: "The Creator",
      vibe: "Innovation & Self-Expression",
      tone: "Imaginative, inventive, original",
      examples: ["Apple", "LEGO"],
      description: "Drives innovation and creation."
    },
    da: {
      name: "Skaberen",
      vibe: "Innovation & Selvudfoldelse",
      tone: "Idérig, opfindsom, original",
      examples: ["Apple", "LEGO"],
      description: "Driver innovation og skabelse."
    }
  }
};