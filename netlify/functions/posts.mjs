import {
  postStore, fileStore, json, fail, isAdmin, getBoard, SLUG, MAX_FILE, clip,
} from "../lib/common.mjs";

// GET    /api/posts?b=slug        → 게시물 목록
// POST   /api/posts (FormData)    → 게시물 올리기 {b,name,title,text,file?}
// DELETE /api/posts?b=slug&id=x   → 게시물 삭제 (교사)
export default async (req) => {
  const url = new URL(req.url);
  const admin = isAdmin(req);

  if (req.method === "GET") {
    const slug = (url.searchParams.get("b") || "").toLowerCase();
    if (!(await getBoard(slug))) return fail("보드를 찾을 수 없어요.", 404);
    const store = postStore();
    const { blobs } = await store.list({ prefix: `${slug}/` });
    const posts = (await Promise.all(blobs.map((b) => store.get(b.key, { type: "json" }))))
      .filter(Boolean)
      .sort((a, b) => b.createdAt - a.createdAt);
    return json({ posts });
  }

  if (req.method === "POST") {
    const len = Number(req.headers.get("content-length") || 0);
    if (len > MAX_FILE + 200 * 1024) return fail("파일이 너무 커요. 5MB 이하로 올려 주세요.", 413);

    let form;
    try { form = await req.formData(); } catch { return fail("업로드 형식이 올바르지 않아요."); }

    const slug = clip(form.get("b"), 40).toLowerCase();
    const board = await getBoard(slug);
    if (!board) return fail("보드를 찾을 수 없어요.", 404);
    if (board.locked && !admin) return fail("이 보드는 제출이 마감되었어요.", 403);

    const name = clip(form.get("name"), 30);
    const title = clip(form.get("title"), 100);
    const text = clip(form.get("text"), 2000);
    const file = form.get("file");
    const hasFile = file && typeof file === "object" && file.size > 0;

    if (!name) return fail("이름을 적어 주세요.");
    if (!hasFile && !title && !text) return fail("제목, 내용, 파일 중 하나는 있어야 해요.");
    if (hasFile && file.size > MAX_FILE) return fail("파일이 너무 커요. 5MB 이하로 올려 주세요.", 413);

    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    const post = { id, board: slug, name, title, text, createdAt: Date.now(), file: null };

    if (hasFile) {
      const meta = {
        name: clip(file.name || "file", 150),
        type: clip(file.type || "application/octet-stream", 100),
        size: file.size,
      };
      await fileStore().set(`${slug}/${id}`, await file.arrayBuffer(), { metadata: meta });
      post.file = meta;
    }

    await postStore().setJSON(`${slug}/${id}`, post);
    return json({ post }, 201);
  }

  if (req.method === "DELETE") {
    if (!admin) return fail("교사 비밀번호가 필요해요.", 401);
    const slug = (url.searchParams.get("b") || "").toLowerCase();
    const id = url.searchParams.get("id") || "";
    if (!SLUG.test(slug) || !/^[a-z0-9]{1,40}$/.test(id)) return fail("잘못된 요청이에요.");
    await Promise.all([postStore().delete(`${slug}/${id}`), fileStore().delete(`${slug}/${id}`)]);
    return json({ ok: true });
  }

  return fail("지원하지 않는 요청이에요.", 405);
};

export const config = { path: "/api/posts" };
