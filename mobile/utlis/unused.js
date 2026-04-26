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


//   const handleAdminLogin = async () => {
//     if (!email.trim() || !password) {
//       Alert.alert("Missing details", "Enter both admin email and password.");
//       return;
//     }

//     setLoading(true);

//     try {
//       const response = await loginAdmin({
//         email: email.trim(),
//         password,
//       });

//       if (!response.success || response.data?.user?.role !== "admin") {
//         Alert.alert(
//           "Admin login failed",
//           response.error || "This account does not have admin access.",
//         );
//         return;
//       }

//       router.replace("/admin/dashboard" as never);
//     } catch {
//       Alert.alert("Admin login failed", "Please try again.");
//     } finally {
//       setLoading(false);
//     }
//   };