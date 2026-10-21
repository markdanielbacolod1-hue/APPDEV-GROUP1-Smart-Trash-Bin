const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000/api";

export async function apiGet(path) {
  const url = `${API_URL}${path}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      cache: "no-store",
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.error("API request failed:", {
        url,
        status: response.status,
        response: payload,
      });

      throw new Error(
        `${url} returned ${response.status}: ${
          payload.error || "Request failed"
        }`
      );
    }

    return payload;
  } catch (error) {
    console.error("API error:", error);
    throw error;
  }
}

export async function apiPost(path, body) {
  const url = `${API_URL}${path}`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body ?? {}),
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.error("API POST failed:", {
        url,
        status: response.status,
        response: payload,
      });

      throw new Error(
        `${url} returned ${response.status}: ${
          payload.error || "Request failed"
        }`
      );
    }

    return payload;
  } catch (error) {
    console.error("API POST error:", error);
    throw error;
  }
}
