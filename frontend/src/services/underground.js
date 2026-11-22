import { get, post } from "./api";

export function getUndergroundAgeVerification() {
  return get("/api/underground/age-verification");
}

export function submitUndergroundAgeVerification(age) {
  return post("/api/underground/age-verification", { age });
}

export function getUndergroundProducts(filters = {}, options = {}) {
  const searchParams = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.set(key, String(value));
    }
  });

  return get(`/api/underground/products?${searchParams.toString()}`, options);
}

export function getUndergroundCategories(options = {}) {
  return get("/api/underground/categories", options);
}

export function getUndergroundProduct(productId, options = {}) {
  return get(
    `/api/underground/products/${encodeURIComponent(productId)}`,
    options,
  );
}
