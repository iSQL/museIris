// CLI: `npm --prefix server run hash-password -- <plaintext>`
// Prints a bcrypt hash to stdout. Paste it into server/.env as ADMIN_PASSWORD_HASH.
import bcrypt from "bcryptjs";

const plain = process.argv.slice(2).join(" ").trim();
if (!plain) {
  console.error("Usage: npm --prefix server run hash-password -- <plaintext>");
  process.exit(1);
}

const hash = bcrypt.hashSync(plain, 10);
console.log(hash);
