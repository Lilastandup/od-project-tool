/**
 * 浏览器端 / 无状态 Supabase 客户端
 * ⚠️ 此文件不能 import next/headers，会被 Client Component 使用
 */
import { createClient } from '@supabase/supabase-js';
import { createBrowserClient as _createBrowserClient } from '@supabase/ssr';

function getEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error(
      '[Supabase] 缺少环境变量。请复制 .env.local.example → .env.local 并填入密钥。'
    );
  }
  return { url, key };
}

/** 无状态客户端（查询层 fallback 用） */
export function getSupabaseClient() {
  const { url, key } = getEnv();
  return createClient(url, key);
}

/** Client Component 专用（在浏览器中管理 session cookie） */
export function createBrowserSupabase() {
  const { url, key } = getEnv();
  return _createBrowserClient(url, key);
}
