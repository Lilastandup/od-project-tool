/**
 * 服务端专用 Supabase 客户端
 * ⚠️ 只能在 Server Components / Server Actions / Route Handlers 中使用
 *    不能被 Client Component 直接导入
 */
import { createServerClient as _createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

function getEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error('[Supabase] 缺少环境变量。');
  }
  return { url, key };
}

/** Server Component / Server Action 专用（自动读取 cookie 中的 session） */
export async function createServerSupabase() {
  const { url, key } = getEnv();
  const cookieStore = await cookies();
  return _createServerClient(url, key, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Server Component 中调用 set 会抛出，忽略即可
        }
      },
    },
  });
}
