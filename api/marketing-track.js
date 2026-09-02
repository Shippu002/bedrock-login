/* global process */

const MAKE_WEBHOOK_URL = process.env.MAKE_MARKETING_WEBHOOK_URL || "";

function parseBody(req) {
  if (!req.body) return {};
  if (typeof req.body === "object") return req.body;

  try {
    return JSON.parse(req.body);
  } catch {
    return {};
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!MAKE_WEBHOOK_URL) {
    return res.status(204).end();
  }

  const payload = parseBody(req);
  const forwardedPayload = {
    ...payload,
    ...(payload?.user || {}),
    ...(payload?.flat || {}),
    ...(payload?.properties || {}),
  };

  try {
    await fetch(MAKE_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(forwardedPayload),
    });
  } catch {
    // Marketing tracking must never block the user experience.
  }

  return res.status(204).end();
}
