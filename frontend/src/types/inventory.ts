export type MovementType = "IN" | "OUT" | "DAMAGED" | "RETURN" | "ADJUSTMENT";

export type Product = {
  id: number;
  name: string;
  barcode: string;
  sku: string;
  quantity: number;
  min_quantity: number;
  image: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
};

export type StockMovement = {
  id: number;
  product_id: number;
  product_name: string;
  product_sku: string;
  barcode: string;
  movement_type: MovementType;
  quantity: number;
  quantity_delta: number;
  timestamp: string;
};

export type InventoryMoveResponse = {
  product: Product;
  movement: StockMovement;
};

export type InventoryHistoryEntry = StockMovement;

export type InventoryHistoryFilter = {
  product: string;
  movement_type: "" | MovementType;
  date: string;
};
