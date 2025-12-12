/**
 * Validates Indian GST Number format
 * GST format: AABBCCCCCCCC0Z1
 * - AA: First 2 letters of PAN
 * - BB: Last 2 digits of PAN  
 * - CCCCCCCC: 8-digit registration number
 * - 0: Constant zero
 * - Z: Alphanumeric character
 * - 1: Check digit (0-9)
 * Total: 15 characters
 */
export function validateGSTNumber(gstNo: string): boolean {
  if (!gstNo || gstNo.trim().length === 0) {
    return true; // Optional field
  }

  const gst = gstNo.trim().toUpperCase();
  
  // Check length
  if (gst.length !== 15) {
    return false;
  }

  // Check pattern: AABBCCCCCCCC0Z1
  // AA: 2 letters
  if (!/^[A-Z]{2}/.test(gst)) {
    return false;
  }

  // BB: 2 digits  
  if (!/^\w{2}[0-9]{2}/.test(gst)) {
    return false;
  }

  // CCCCCCCC: 8 alphanumeric (registration number)
  if (!/^\w{6}[A-Z0-9]{8}/.test(gst)) {
    return false;
  }

  // 0: Constant zero at position 12
  if (gst[12] !== '0') {
    return false;
  }

  // Z1: Last 2 characters should be alphanumeric
  if (!/[A-Z0-9]{2}$/.test(gst.slice(13))) {
    return false;
  }

  return true;
}

export function getGSTErrorMessage(gstNo: string): string | null {
  if (!gstNo || gstNo.trim().length === 0) {
    return null; // Optional field
  }

  if (gstNo.trim().length !== 15) {
    return "GST number must be 15 characters long";
  }

  if (!validateGSTNumber(gstNo)) {
    return "Invalid GST number format. Expected: AABBCCCCCCCC0Z1 (15 chars)";
  }

  return null;
}
