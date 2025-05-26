import { serve } from "bun";
import { createProxy } from "http-proxy";

// Load environment variables
const TELEGRAM_API_URL =
  process.env.TELEGRAM_API_URL || "https://api.telegram.org";
const PORT = parseInt(process.env.PORT || "3000");
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split(",") || "*";

// Create proxy instance
const proxy = createProxy({
  target: TELEGRAM_API_URL,
  changeOrigin: true,
  xfwd: true,
});

// Start server
serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);
    const path = url.pathname;

    // Handle CORS
    const corsHeaders = {
      "Access-Control-Allow-Origin":
        ALLOWED_ORIGINS === "*"
          ? "*"
          : ALLOWED_ORIGINS.includes(req.headers.get("origin") || "")
          ? req.headers.get("origin") || ""
          : ALLOWED_ORIGINS[0],
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    };

    // Handle OPTIONS preflight
    if (req.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      });
    }

    // Health check endpoint
    if (path === "/health") {
      return new Response(JSON.stringify({ status: "healthy" }), {
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      });
    }

    // Proxy Telegram API requests
    if (path.startsWith("/telegram")) {
      try {
        // Modify the path to match Telegram API format
        const newPath = path.replace("/telegram", "/bot");
        const newUrl = new URL(newPath, TELEGRAM_API_URL);

        // You can add authentication here if needed
        // if (req.headers.get('x-api-key') !== process.env.API_KEY) {
        //   return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        //     status: 401,
        //     headers: { 'Content-Type': 'application/json', ...corsHeaders },
        //   });
        // }

        // Proxy the request
        return (
          (await new Promise()) <
          Response >
          (async (resolve, reject) => {
            proxy.web(
              req,
              new Response(),
              {
                target: newUrl.toString(),
                ignorePath: true,
                buffer: req.body
                  ? Buffer.from(await req.arrayBuffer())
                  : undefined,
              },
              (err, req, res) => {
                if (err) {
                  console.error("Proxy error:", err);
                  reject(
                    new Response(JSON.stringify({ error: "Proxy error" }), {
                      status: 502,
                      headers: {
                        "Content-Type": "application/json",
                        ...corsHeaders,
                      },
                    })
                  );
                } else {
                  resolve(res);
                }
              }
            );
          })
        );
      } catch (error) {
        console.error("Error:", error);
        return new Response(
          JSON.stringify({ error: "Internal server error" }),
          {
            status: 500,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }
    }

    // Not found
    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  },
});

console.log(`Telegram proxy server running on port ${PORT}`);
console.log(`Proxying requests to: ${TELEGRAM_API_URL}`);
