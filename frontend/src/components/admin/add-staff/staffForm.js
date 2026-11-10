import { isValidEmail } from "../../../services/validation";

export const emptyDetails = {
  full_name: "",
  email: "",
  phone: "",
  role: "Staff",
};

export function initialPlacement(departments, presetDepartmentId) {
  const hasPreset = Boolean(presetDepartmentId);
  return {
    deptMode: hasPreset || departments.length ? "existing" : "new",
    departmentId: hasPreset ? String(presetDepartmentId) : "",
    newDepartment: "",
    divMode: "existing",
    divisionId: "",
    newDivision: "",
  };
}

export function validateDetails(details, existingEmails) {
  if (!details.full_name.trim()) return "Enter the staff member's full name.";
  if (!isValidEmail(details.email)) return "Enter a valid email address.";
  if (existingEmails.has(details.email.trim().toLowerCase()))
    return "Someone with this email is already on the team.";
  return "";
}

export function validatePlacement(placement, divisionIsNew) {
  if (placement.deptMode === "existing" && !placement.departmentId)
    return "Choose a department, or create a new one.";
  if (placement.deptMode === "new" && !placement.newDepartment.trim())
    return "Name the new department.";
  if (divisionIsNew && !placement.newDivision.trim())
    return "Name the division they will work in.";
  if (!divisionIsNew && !placement.divisionId)
    return "Choose a division, or create a new one.";
  return "";
}

export function buildPayload(details, placement, divisionIsNew) {
  const payload = {
    full_name: details.full_name.trim(),
    email: details.email.trim().toLowerCase(),
    phone: details.phone.trim(),
    role: details.role,
  };
  if (placement.deptMode === "existing")
    payload.department = Number(placement.departmentId);
  else payload.department_name = placement.newDepartment.trim();
  if (divisionIsNew) payload.division_name = placement.newDivision.trim();
  else payload.division = Number(placement.divisionId);
  return payload;
}
