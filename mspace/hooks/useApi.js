import useAuth from "./useAuth";
import apiCall from "../utils/apiCall";

export default function useApi() {
  const { authState } = useAuth();

  async function callApi(
    endpoint,
    method = "GET",
    data = null,
    contentType = "application/json",
    tempAuthState = null,
    customConfig = {}
  ) {
    const effectiveContentType = method === "GET" ? undefined : contentType;
    const tokenState = tempAuthState ?? authState;

    // apiCall returns the parsed JSON body
    const responseData = await apiCall(
      endpoint,
      method,
      data,
      effectiveContentType || "",
      tokenState,
      customConfig
    );
    return responseData;
  }

  return { callApi };
}
