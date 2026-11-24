import { getSql } from "./db.js";

export const MAX_FAILURES = 8;
const WINDOW_MINUTES = 15;

export async function countFailures(ip) {
  const sql = getSql();
  const rows = await sql`
    SELECT count(*)::int AS c FROM login_attempts
    WHERE ip = ${ip} AND ts > now() - make_interval(mins => ${WINDOW_MINUTES})
  `;
  return rows[0].c;
}

export async function recordFailure(ip) {
  const sql = getSql();
  await sql`INSERT INTO login_attempts (ip) VALUES (${ip})`;
  await sql`DELETE FROM login_attempts WHERE ts < now() - interval '1 day'`;
}

export async function clearFailures(ip) {
  const sql = getSql();
  await sql`DELETE FROM login_attempts WHERE ip = ${ip}`;
}
