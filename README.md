# SWR & Fine Grained Cache Control on Netlify

This is a demo of using `Netlify-CDN-Cache-Control` with `ETag` and  `stale-while-revalidate` instructions on Netlify Edge.

Visit [the demo site](https://netlify-edge-cache-demo.netlify.app/) to see this in action.

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/netlify-labs/cache-control-and-swr)

Netlify supports the `Cache-Control`, `CDN-Cache-Control` and `Netlify-CDN-Cache-Control` headers, allowing you to send different cache instructions to your end users browser (`Cache-Control`), Netlify’s Edge (`Netlify-CDN-Cache-Control`), or any standards compliant CDN sitting in-between Netlify and your end user (`CDN-Cache-Control`).

Here’s an example of a Function that will be cached on Netlify’s edge nodes until a new deploy goes live:

```jsx
import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
    console.log("Regenerating String")

    const headers = {
        "Content-Type": "text/plain",
        "Cache-Control": "public, max-age=0, must-revalidate", // Tell browsers to always revalidate
        "Netlify-CDN-Cache-Control": "public, max-age=31536000, must-revalidate", // Tell Edge to cache asset for up to a year
    }

    return {
        statusCode: 200,
        body: "Hello, World!",
        headers
    }
};

export { handler };
```

When you access this function repeatedly, you’ll see it getting cached on Netlify Edge. If you redeploy, the cache will be invalidated and the function will be called again.

Netlify Edge nodes can also handle Conditional Get Requests for content that you wan’t to avoid regenerating after a new deploy. Here’s a small tweak to the function above:

```jsx
import crypto from 'crypto';
import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";

const body = "Hello, World";

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
    const etag = `"${crypto.createHash("md5").update(body).digest("hex")}"`;

    const headers = {
        "Content-Type": "text/plain",
        "Cache-Control": "public, max-age=0, must-revalidate", // Tell browsers to always revalidate
        "Netlify-CDN-Cache-Control": "public, max-age=31536000, must-revalidate", // Tell Edge to cache asset for up to a year
        "ETag": etag,
    }

    if (event.headers["if-none-match"] === etag) {
        return { statusCode: 304, headers }
    }

    console.log("Regenerating String");

    return { statusCode: 200, body, headers }
};

export { handler };
```

In this case, if you deploy this function and visit it from an edge node, the string “Hello, World” will get cached on Netlify Edge. If you do a new deploy with no changes to the function, then the first time you visit the function our Edge Node will send a request back to the function with an `If-None-Match` header. The function will detect this and send back an empty 304 response, telling Netlify Edge to go ahead and keep using the response from the cache.

## Stale While Revalidate

Another powerful caching technique is the “stale-while-revalidate” pattern. This pattern tells our Edge to serve a cached response even when it’s stale, but revalidate it in the background without requiring the client to wait for the result.

Here’s an example of a function using stale while revalidate:

```jsx
import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
    const resp = await fetch('https://reqres.in/api/news')
    const body = await resp.json()

    return {
        statusCode: 200,
        body: JSON.stringify({
					time: new Date(),
					news: body
				}),
        headers: {
            "Content-Type": "application/json",
            "Cache-Control": "public, max-age=0, must-revalidate", // Tell browsers to always revalidate
            "Netlify-CDN-Cache-Control": "public, max-age=0, stale-while-revalidate=31536000", // Tell Edge to cache asset for up to a year
        }
    }
};

export { handler };
```

This function wraps a public Rest API that could take some time to get back and might very well be subject to strict rate limits.

If you deploy this and visit the function, the first request will be served from the function, stored in the Edge Cache, and then when you refresh the browser, you’ll notice that the following responses are instant and served out of the edge.

If this endpoint had thousands of concurrent visitors, after the initial function load, each of them would keep getting a cached response, while our edge node would continuously revalidate the cached object in the background by sending one request at a time to the serverless function, protecting the underlying API from traffic spikes and delivering instant responses to every user.
