export type ProductRecord = {
  id: number;
  name: string;
  barcode: string;
  sku: string;
  quantity: number;
  min_quantity: number;
  image: string | null;
  image_path: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
};

export type ProductFormInput = {
  name: string;
  barcode: string;
  sku: string;
  quantity: number;
  min_quantity: number;
  image: File | null;
};
