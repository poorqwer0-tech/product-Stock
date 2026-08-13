import { createClient } from '@libsql/client';
import 'dotenv/config'; // ดึงค่าจากไฟล์ .env มาใช้

export const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// ตัวอย่างการเรียกดูข้อมูล
async function main() {
  const res = await db.execute("SELECT 1 + 1 AS result;");
  console.log(res.rows);
}

main();