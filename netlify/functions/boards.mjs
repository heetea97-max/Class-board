import {
  boardStore, postStore, fileStore, json, fail, isAdmin, getBoard, SLUG, clip,
} from "../lib/common.mjs";

// GET    /api/boards?b=slug   → 보드 정보 (누구나)
// GET    /api/boards          → 보드 목록 (교사)
// POST   /api/boards          → 보드 만들기/수정 (교사) {slug,title,description,locked}
// DELETE /api/boards?b=slug   → 보드와 게시물·파일 전부 삭제 (교사)
export default async (req) => {
  const url = new URL(req.url);
  const slug = (url.searchParams.get("b") || "").toLowerCase();
  const admin = isAdmin(req);

  if (req.method === "GET") {
    if (slug) {
      const board = await getBoard(slug);
      return board ? json({ board, admin }) : fail("보드를 찾을 수 없어요.", 404);
    }
    if (!admin) return fail("교사 비밀번호가 필요해요.", 401);
    const store = boardStore();
    const { blobs } = await store.list();
    const boards = (await Promise.all(blobs.map((b) => store.get(b.key, { type: "json" }))))
      .filter(Boolean)
      .sort((a, b) => b.createdAt - a.createdAt);
    return json({ boards, admin });
  }

  if (!admin) return fail("교사 비밀번호가 필요해요.", 401);

  if (req.method === "POST") {
    const body = await req.json().catch(() => ({}));
    const s = clip(body.slug, 40).toLowerCase();
    if (!SLUG.test(s)) return fail("보드 주소는 영문 소문자·숫자·하이픈(-)만 쓸 수 있어요.");
    const prev = (await getBoard(s)) || { slug: s, createdAt: Date.now(), locked: false };
    const board = {
      ...prev,
      title: body.title !== undefined ? clip(body.title, 80) || s : prev.title || s,
      description: body.description !== undefined ? clip(body.description, 300) : prev.description || "",
      locked: body.locked !== undefined ? Boolean(body.locked) : prev.locked,
    };
    await boardStore().setJSON(s, board);
    return json({ board });
  }

  if (req.method === "DELETE") {
    if (!SLUG.test(slug)) return fail("보드 주소가 올바르지 않아요.");
    for (const store of [postStore(), fileStore()]) {
      const { blobs } = await store.list({ prefix: `${slug}/` });
      await Promise.all(blobs.map((b) => store.delete(b.key)));
    }
    await boardStore().delete(slug);
    return json({ ok: true });
  }

  return fail("지원하지 않는 요청이에요.", 405);
};

export const config = { path: "/api/boards" };
