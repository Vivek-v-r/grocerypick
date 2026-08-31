/**
 * UPI helpers — validation and URL building for QR codes.
 * No deep-link opening (UPI apps block browser-triggered launches).
 */

export function isValidUpiId(upiId) {
  if (!upiId || typeof upiId !== "string") return false;
  const trimmed = upiId.trim();
  if (trimmed.length < 3 || trimmed.length > 100) return false;
  return trimmed.includes("@");
}

/**
 * Build a UPI URL string for QR code generation.
 * Includes amount so QR scanner auto-fills it.
 */
export function buildUpiQrUrl(upiId, storeName, amount) {
  if (!isValidUpiId(upiId) || !storeName?.trim() || !amount || amount <= 0) {
    return "";
  }
  const params = new URLSearchParams({
    pa: upiId.trim(),
    pn: storeName.trim(),
    am: parseFloat(amount).toFixed(2),
    cu: "INR",
  });
  const url = `upi://pay?${params.toString()}`;
  console.log("[UPI] QR URL:", url);
  return url;
}

export async function copyUpiId(upiId) {
  if (!upiId) return false;
  try {
    await navigator.clipboard.writeText(upiId.trim());
    return true;
  } catch {
    const ta = document.createElement("textarea");
    ta.value = upiId.trim();
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
    return true;
  }
}
