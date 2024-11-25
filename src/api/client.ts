import { API_BASE_URL } from "@/hooks/index";
import ApiResponse from "@/models/apiResponse";

export const fetchApiData = async (): Promise<ApiResponse> => {
  try {
    console.log(API_BASE_URL);
    const response = await fetch(`${API_BASE_URL}`);
    if (!response.ok) {
      throw new Error(`Error fetching API: ${response.statusText}`);
    }

    const data: ApiResponse = await response.json();
    console.log("data 1");
    console.log(data);
    return data;
  } catch (error) {
    console.error("Error fetching API data:", error);
    throw error;
  }
};