import crypto from 'crypto';
import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";



const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
    const body = `<!doctype html>
    <html><head>
        <title>ETag</title>
        <link rel="stylesheet" href="/main.css">
    </head>
    <h1>ETag Demo</h1>
    <p>Setting an ETag allows the Netlify Edge to do conditional get requests to the origin server.</p>
    <p>This page was generated at TIMESTAMP</p>
    <p><a href="/">Go back</a></p>
    <body></html>`;

    const etag = `"${crypto.createHash("md5").update(body).digest("hex")}"`;

    const headers = {
        "Content-Type": "text/html",
        "Cache-Control": "public, max-age=0, must-revalidate", // Tell browsers to always revalidate
        "Netlify-CDN-Cache-Control": "public, max-age=31536000, must-revalidate", // Tell Edge to cache asset for up to a year
        "ETag": etag,
    }

    if (event.headers["if-none-match"] === etag) {
        return { statusCode: 304, headers }
    }

    console.log("Regenerating String");

    return {
        statusCode: 200,
        body: body.replace(/TIMESTAMP/, new Date().toString()),
        headers
    }
};

export { handler };
