function firstMessage(value) {
  if (Array.isArray(value) && value[0]) {
    return String(value[0]);
  }
  if (typeof value === "string") {
    return value;
  }
  return null;
}

export function extractErrorMessage(err, fallback) {
  const data = err?.response?.data;
  if (!data) {
    return fallback;
  }
  const [firstKey] = Object.keys(data);
  return (
    firstMessage(data.detail) ||
    (firstKey && firstMessage(data[firstKey])) ||
    fallback
  );
}
