export const ALLOWED_DOMAIN = "@mylauier.ca";
export function isAllowedEmail(email) {
  return typeof email === "string" &&
         email.toLowerCase().endsWith(ALLOWED_DOMAIN);
}
