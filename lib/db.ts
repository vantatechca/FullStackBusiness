import { neon } from '@neondatabase/serverless';
 
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}
 
export const sql = neon(process.env.DATABASE_URL);
 
// Typed query helper
export async function query<T = any>(
  strings: TemplateStringsArray,
  ...values: any[]
): Promise<T[]> {
  return sql(strings, ...values) as Promise<T[]>;
}
 