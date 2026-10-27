import { getStore } from "@netlify/blobs";

const opts = (name) => ({ name, consistency: "strong" });
export const boardStore = () => getStore(opts("boards"));
export const postStore = () => getStore(opts("posts"));
export const fileStore = () => getStore(opts("files"));

export const SLUG = /^[a-z0-9][a-z0-9-]{0,39}$/;
// Netlify 함수 요청 본문 한도(약 6MB) 안쪽으로 잡은 파일 크기 상한
export const MAX_FILE = 5 * 1024 * 1024;

export function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

export const fail = (msg, status = 400) => json({ error: msg }, status);

export function isAdmin(req) {
  const pw = process.env.ADMIN_PASSWORD || "";
  if (!pw) return false;
  const got = req.headers.get("x-admin-password") || "";
  const a = new TextEncoder().encode(got);
  const b = new TextEncoder().encode(pw);
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

export async function getBoard(slug) {
  if (!SLUG.test(slug || "")) return null;
  return boardStore().get(slug, { type: "json" });
}

export const clip = (v, n) => String(v ?? "").trim().slice(0, n);
