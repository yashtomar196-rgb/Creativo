// Role matrix, exactly as specified:
//   Super Admin      -> everything, including Admin Management
//   Admin            -> Products, Orders, Reviews & Leads
//   Order Manager    -> Orders only
//   Product Manager  -> Products only
// Only Super Admin can create/edit/disable/delete other admin accounts.

export const ROLE_LABELS = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  ORDER_MANAGER: "Order Manager",
  PRODUCT_MANAGER: "Product Manager",
};

export const ROLE_PERMISSIONS = {
  SUPER_ADMIN: ["dashboard", "products", "orders", "reviews", "admins"],
  ADMIN: ["dashboard", "products", "orders", "reviews"],
  ORDER_MANAGER: ["orders"],
  PRODUCT_MANAGER: ["products"],
};

export function canAccess(role, section) {
  return ROLE_PERMISSIONS[role]?.includes(section) ?? false;
}

export function defaultSectionFor(role) {
  return ROLE_PERMISSIONS[role]?.[0] ?? "dashboard";
}

// Per the requested spec, the Super Admin's "delete account" action is only
// shown for managed accounts with the plain "Admin" role — Order Manager and
// Product Manager accounts can only be renamed / reset / disabled, not deleted.
export function canDeleteManagedRole(role) {
  return role === "ADMIN";
}
