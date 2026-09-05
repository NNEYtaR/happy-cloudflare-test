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

    return env.ASSETS.fetch(request);
  },
};
