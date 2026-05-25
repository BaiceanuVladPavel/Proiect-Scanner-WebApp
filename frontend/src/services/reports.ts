import { api } from "@/lib/api";
import type { LowStockResponse } from "@/types/reports";

export async function getLowStockReport() {
  const response = await api.get<LowStockResponse>("/reports/low-stock");
  return response.data;
}
