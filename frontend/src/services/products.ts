import { api } from "@/lib/api";
import type { ProductFormInput, ProductRecord } from "@/types/products";

function toFormData(input: ProductFormInput) {
  const formData = new FormData();
  formData.append("name", input.name);
  formData.append("barcode", input.barcode);
  formData.append("sku", input.sku);
  formData.append("quantity", String(input.quantity));
  formData.append("min_quantity", String(input.min_quantity));
  if (input.image) {
    formData.append("image", input.image);
  }
  return formData;
}

export async function listProducts(search = "", signal?: AbortSignal) {
  const response = await api.get<ProductRecord[]>("/products/", {
    params: search ? { q: search } : {},
    signal,
  });
  return response.data;
}

export async function createProduct(input: ProductFormInput) {
  const response = await api.post<ProductRecord>("/products/", toFormData(input));
  return response.data;
}

export async function updateProduct(productId: number, input: ProductFormInput) {
  const response = await api.put<ProductRecord>(`/products/id/${productId}/`, toFormData(input));
  return response.data;
}

export async function deleteProduct(productId: number) {
  await api.delete(`/products/id/${productId}/`);
}
