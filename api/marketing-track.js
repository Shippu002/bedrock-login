/* global process */

const MAKE_WEBHOOK_URL = process.env.MAKE_MARKETING_WEBHOOK_URL || "";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!MAKE_WEBHOOK_URL) {
    return res.status(503).json({ error: "Marketing webhook is not configured" });
  }

  const payload =
    typeof req.body === "object" ? req.body : JSON.parse(req.body || "{}");

  try {
    const response = await fetch(MAKE_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      return res.status(502).json({ error: "Make webhook rejected the event" });
    }
  } catch {
    return res.status(502).json({ error: "Unable to reach Make webhook" });
  }

  return res.status(204).end();
}
