export type DbProduct = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: string | null;
  gender: string;
  base_price: string | number;
  compare_price: string | number | null;
  is_active: boolean;
  variants: Array<{ size: string; stock: number }>;
  image_groups: Array<{ label: string; images: string[] }>;
  meta_title: string | null;
  meta_description: string | null;
  meta_keywords: string | null;
  created_at: string;
  updated_at: string;
};
