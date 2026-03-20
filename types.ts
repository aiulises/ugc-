
export enum AppStep {
  LANDING,
  DEFINE_PRODUCT,
  SELECT_ANGLE,
  GENERATE_VISUALS,
}

export type GenerationMode = 'Image' | 'Video';
export type Language = 'en' | 'da';

export interface UploadedFile {
  file: File;
  data: string; // base64
  mimeType: string;
}

export interface ProductInfo {
  name: string;
  audience: string;
  sellingPoints: string;
  goal: string;
  brandArchetype: string;
  platform: string;
}

export interface AdAngle {
  title: string;
  description: string;
  visual_prompt_idea: string;
}
