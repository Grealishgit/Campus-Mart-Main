// export interface AdminLoginRequest {
//   email: string;
//   password: string;
// }


/**
 * Login admin user from the separate admin portal.
 */
// export async function loginAdmin(
//   data: AdminLoginRequest,
// ): Promise<ApiResponse<AuthResponse>> {
//   const response = await apiRequest<AuthResponse>("/admin/login", {
//     method: "POST",
//     body: data,
//   });

//   if (response.success && response.data?.token) {
//     await setAuthToken(response.data.token);
//   }

//   return response;
// }