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
  is_featured: boolean;
  variants: Array<{ size: string; stock: number }>;
  image_groups: Array<{ label: string; images: string[] }>;
  meta_title: string | null;
  meta_description: string | null;
  meta_keywords: string | null;
  created_at: string;
  updated_at: string;
};

export type ComboItem = {
  product_id: string;
  product_name: string;
  image: string;
  base_price: number;
};

export type DbCombo = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
  items: ComboItem[];
  original_price: string | number;
  combo_price: string | number;
  image_url: string | null;
  meta_title: string | null;
  meta_description: string | null;
  created_at: string;
  updated_at: string;
};

export type DbPromoCode = {
  id: string;
  code: string;
  discount_percent: number;
  max_discount: string | number | null;
  min_order_amount: string | number;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
};
