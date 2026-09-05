export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/hello") {
      return Response.json({
        message: "Hello from Cloudflare Worker! ☁️",
      });
    }

    if (url.pathname === "/api/notes" && request.method === "GET") {
      const result = await env.DB.prepare(
        `
          SELECT id, title, content, created_at
          FROM notes
          ORDER BY id DESC
        `,
      ).all();

      return Response.json({
        notes: result.results,
      });
    }

    if (url.pathname === "/api/notes" && request.method === "POST") {
      const body = await request.json();

      const title = body.title?.trim();
      const content = body.content?.trim() || null;

      if (!title) {
        return Response.json({ error: "title is required" }, { status: 400 });
      }

      const result = await env.DB.prepare(
        `
        INSERT INTO notes (title, content)
        VALUES (?, ?)
        `,
      )
        .bind(title, content)
        .run();

      return Response.json(
        {
          success: true,
          id: result.meta.last_row_id,
        },
        { status: 201 },
      );
    }

    if (url.pathname.startsWith("/api/notes/") && request.method === "PUT") {
      const id = Number(url.pathname.split("/").pop());

      if (!Number.isInteger(id) || id <= 0) {
        return Response.json({ error: "invalid note id" }, { status: 400 });
      }

      const body = await request.json();

      const title = body.title?.trim();
      const content = body.content?.trim() || null;

      if (!title) {
        return Response.json({ error: "title is required" }, { status: 400 });
      }

      const result = await env.DB.prepare(
        `
        UPDATE notes
        SET title = ?, content = ?
        WHERE id = ?
        `,
      )
        .bind(title, content, id)
        .run();

      if (result.meta.changes === 0) {
        return Response.json({ error: "note not found" }, { status: 404 });
      }

      return Response.json({
        success: true,
        updated_id: id,
      });
    }

    if (url.pathname.startsWith("/api/notes/") && request.method === "DELETE") {
      const id = Number(url.pathname.split("/").pop());

      if (!Number.isInteger(id) || id <= 0) {
        return Response.json({ error: "invalid note id" }, { status: 400 });
      }

      const result = await env.DB.prepare(
        `
        DELETE FROM notes
        WHERE id = ?
        `,
      )
        .bind(id)
        .run();

      if (result.meta.changes === 0) {
        return Response.json({ error: "note not found" }, { status: 404 });
      }

      return Response.json({
        success: true,
        deleted_id: id,
      });
    }

    return env.ASSETS.fetch(request);
  },
};
