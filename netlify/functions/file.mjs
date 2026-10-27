import { fileStore, SLUG } from "../lib/common.mjs";

// GET /api/file/:board/:id[?download=1] → 올린 파일 내려받기/미리보기
// 미리보기는 안전한 형식(이미지·PDF·영상·음성)만 허용하고 나머지는 항상 다운로드로 내보냄
const INLINE = new Set([
  "image/png", "image/jpeg", "image/gif", "image/webp",
  "application/pdf",
  "video/mp4", "video/webm", "video/quicktime",
  "audio/mpeg", "audio/mp4", "audio/wav", "audio/x-m4a", "audio/webm",
]);

export default async (req, context) => {
  const parts = new URL(req.url).pathname.split("/").filter(Boolean); // api, file, board, id
  const board = context?.params?.board || parts[2];
  const id = context?.params?.id || parts[3];
  if (!SLUG.test(board || "") || !/^[a-z0-9]{1,40}$/.test(id || "")) {
    return new Response("잘못된 요청", { status: 400 });
  }
  const found = await fileStore().getWithMetadata(`${board}/${id}`, { type: "stream" });
  if (!found) return new Response("파일이 없어요", { status: 404 });

  const meta = found.metadata || {};
  const type = String(meta.type || "").toLowerCase();
  const wantDownload = new URL(req.url).searchParams.has("download");
  const inline = INLINE.has(type) && !wantDownload;
  const filename = String(meta.name || "file");
  const ascii = filename.replace(/[^\x20-\x7e]/g, "_").replace(/["\\]/g, "_");

  const headers = {
    "content-type": inline ? type : "application/octet-stream",
    "content-disposition": `${inline ? "inline" : "attachment"}; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
    "x-content-type-options": "nosniff",
    "cache-control": "private, max-age=3600",
  };
  if (meta.size) headers["content-length"] = String(meta.size);
  return new Response(found.data, { headers });
};

export const config = { path: "/api/file/:board/:id" };
