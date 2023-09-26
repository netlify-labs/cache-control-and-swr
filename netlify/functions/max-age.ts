import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
    console.log("Regenerating String")

    const headers = {
        "Content-Type": "text/html",
        "Cache-Control": "public, max-age=0, must-revalidate", // Tell browsers to always revalidate
        "Netlify-CDN-Cache-Control": "public, max-age=31536000, must-revalidate", // Tell Edge to cache asset for up to a year
    }

    return {
        statusCode: 200,
        body: `<!doctype html>
<html><head>
    <title>Max Age</title>
    <link rel="stylesheet" href="/main.css">
</head>
<h1>Max Age Demo</h1>
<p>Max Age is a cache control header that tells the browser to cache the asset for a certain amount of time.</p>
<p>This page was generated at ${new Date()}</p>
<p><a href="/">Go back</a></p>
<body></html>`,
        headers
    }
};

export { handler };