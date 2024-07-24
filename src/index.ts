/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `wrangler dev src/index.ts` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `wrangler deploy src/index.ts --name my-worker` to deploy your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

export interface Env {
	// Example binding to KV. Learn more at https://developers.cloudflare.com/workers/runtime-apis/kv/
	// MY_KV_NAMESPACE: KVNamespace;
	//
	// Example binding to Durable Object. Learn more at https://developers.cloudflare.com/workers/runtime-apis/durable-objects/
	// MY_DURABLE_OBJECT: DurableObjectNamespace;
	//
	// Example binding to R2. Learn more at https://developers.cloudflare.com/workers/runtime-apis/r2/
	// MY_BUCKET: R2Bucket;
	//
	// Example binding to a Service. Learn more at https://developers.cloudflare.com/workers/runtime-apis/service-bindings/
	// MY_SERVICE: Fetcher;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname.split('/');

    // Function to fetch flag from R2 bucket
    async function fetchFlag(country) {
      try {
        // Fetch the object from the R2 bucket
        const object = await env['cc-fetch'].get(`${country}.png`);
        if (!object) {
          return new Response('Flag not found', { status: 404 });
        }

        return new Response(object.body, {
          headers: { 'Content-Type': 'image/png' },
        });
      } catch (err) {
        return new Response('Error fetching flag', { status: 500 });
      }
    }

    // Check if the request is for a specific country flag
    if (path[2] && path[2] !== 'secure') {
      const country = path[2].toUpperCase();
      return fetchFlag(country);
    }

    // Extract authentication headers
    const email = request.headers.get('cf-access-authenticated-user-email') || 'unknown';
    const timestamp = new Date().toISOString();
    const country = request.headers.get('cf-ipcountry') || 'unknown';

    // Construct response body with HTML and basic CSS
    const responseBody = `
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              background-color: #f4f4f9;
              margin: 0;
              padding: 20px;
            }
            .container {
              max-width: 600px;
              margin: auto;
              background: #fff;
              padding: 20px;
              box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
              border-radius: 8px;
            }
            h1 {
              color: #333;
            }
            p {
              color: #555;
              line-height: 1.6;
            }
            .country-link {
              color: #007bff;
              text-decoration: none;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>User Information</h1>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Authenticated at:</strong> ${timestamp}</p>
            <p><strong>From:</strong> <a href="/secure/${country}" class="country-link">${country}</a></p>
          </div>
        </body>
      </html>
    `;

    return new Response(responseBody, {
      headers: { 'Content-Type': 'text/html' },
    });
  }
};

