export type LowStockItem = {
  id: number;
  name: string;
  barcode: string;
  sku: string;
  quantity: number;
  min_quantity: number;
  shortfall: number;
  image_url: string | null;
};

export type LowStockResponse = {
  count: number;
  results: LowStockItem[];
};
