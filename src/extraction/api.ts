import { httpClient } from "~/extraction/httpClient.js";
import { CategoryDto, FiltersResponseDto, ProductDetailsDto } from "~/types/dto.js";
import axios from "axios";
  
export async function getAllCategories(): Promise<CategoryDto[]> {
  const response = await httpClient.get<{ categories: CategoryDto[] }>("/pt/en/categories");
  return response.data.categories;
}

export async function getCategoryFilters(
  categoryId: number,
): Promise<FiltersResponseDto> {
  try {
    const response = await httpClient.get<FiltersResponseDto>(
      `/pt/en/category/${categoryId}/filters`,
      {
        params: {
          ajax: true
        },
        headers: {
          "x-requested-with": "XMLHttpRequest",
          accept: "application/json, text/plain, */*"
        }
      }
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return { filters: [], sorting: { id: "", title: "", value: [] } };
    }
    throw error;
  }
}

export async function getProductDetails(
  productIds: number[],
): Promise<ProductDetailsDto[]> {
  try {
    const response = await httpClient.get<ProductDetailsDto[]>(
      `/pt/en/products-details`,
      {
        params: {
          productIds,
          ajax: true
        }
      }
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return [];
    }
    throw error;
  }
}