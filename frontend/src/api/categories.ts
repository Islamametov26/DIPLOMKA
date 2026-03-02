import { request } from './client'
import type { Category } from '../types/category'

type CategoriesResponse = {
  items: Category[]
}

export async function listCategories(signal?: AbortSignal): Promise<Category[]> {
  const data = await request<CategoriesResponse>('/api/categories', { signal })
  return data.items
}

type CategoryPayload = {
  name: string
}

export async function createCategory(payload: CategoryPayload): Promise<Category> {
  return request<Category>('/api/categories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}
