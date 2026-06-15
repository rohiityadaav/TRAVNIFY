export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

export const isBackendAvailable = () => {
  // If in production and VITE_API_BASE_URL is not set, the backend is not deployed/configured yet.
  const isProd = import.meta.env.PROD;
  if (isProd && !import.meta.env.VITE_API_BASE_URL) {
    return false;
  }
  return true;
};

export async function safeFetch(path, options = {}) {
  if (!isBackendAvailable()) {
    throw new Error("Server features (Near Me, AI planning, premium) are temporarily disabled because the backend is not yet deployed.");
  }

  // Sanitize headers to prevent sending 'Bearer undefined', 'Bearer null', or empty 'Bearer '
  if (options.headers) {
    if (typeof options.headers.get === 'function' && typeof options.headers.delete === 'function') {
      const authVal = options.headers.get('authorization');
      if (!authVal || authVal === 'Bearer' || authVal === 'Bearer ' || authVal.includes('undefined') || authVal.includes('null')) {
        options.headers.delete('authorization');
      }
    } else {
      const authKey = Object.keys(options.headers).find(k => k.toLowerCase() === 'authorization');
      if (authKey) {
        const authVal = options.headers[authKey];
        if (!authVal || authVal === 'Bearer' || authVal === 'Bearer ' || authVal.includes('undefined') || authVal.includes('null')) {
          delete options.headers[authKey];
        }
      }
    }
  }

  // Prepend API_BASE_URL if it is configured
  const url = path.startsWith('/api') && API_BASE_URL ? `${API_BASE_URL}${path}` : path;
  
  const response = await fetch(url, options);
  
  // Exclude third-party APIs (like OpenStreetMap reverse geocoding in NearMe.jsx) from content-type validations
  if (path.includes('openstreetmap.org')) {
    return response;
  }

  const contentType = response.headers.get("content-type") || "";
  if (!response.ok || !contentType.includes("application/json")) {
    let errMessage = "Server returned an invalid response";
    const status = response.status;
    let code = undefined;

    if (contentType.includes("application/json")) {
      try {
        const errData = await response.json();
        errMessage = errData.error || errData.message || errMessage;
        if (errData.code) {
          code = errData.code;
        }
      } catch (e) {
        // Fallback if parsing fails
      }
    } else {
      const text = await response.text().catch(() => "");
      console.error("API error response:", text);
      if (contentType.includes("text/html") || text.trim().startsWith("<!DOCTYPE")) {
        errMessage = "Our servers might be offline right now or the backend is not yet deployed. Please try again later.";
      } else {
        errMessage = text || errMessage;
      }
    }
    
    const customErr = new Error(errMessage);
    customErr.status = status;
    if (code) {
      customErr.code = code;
    }
    throw customErr;
  }
  
  return response;
}

