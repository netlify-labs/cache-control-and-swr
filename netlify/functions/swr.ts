import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
    const start = Date.now()
    const resp = await fetch('https://fakestoreapi.com/products?sort=desc')
    const json = await resp.json()
    const time = (Date.now() - start)

    return {
        statusCode: 200,
        body: `<!doctype html><html>
        <head>
            <title>SWR</title>
            <link rel="stylesheet" href="/main.css">
        </head>
        <body>
            <h1>SWR Demo</h1>
            <p>Stale While Revalidate is a cache standard that allows an HTTP Cache to serve stale content while fetching a fresh object in the background</p>
            <p>Products from <a href="https://fakestoreapi.com/">https://fakestoreapi.com/</a> were fetched ${new Date}</p>
            <p>The request took ${time} ms</p>
            <ul>${json.map((item) => `<li>${item.title}</li>`).join("\n")}</ul>
            <p><a href="/">Go back</a></p>
        </body><html>`,
        headers: {
            "Content-Type": "text/html",
            "Cache-Control": "public, max-age=0, must-revalidate", // Tell browsers to always revalidate
            "Netlify-CDN-Cache-Control": "public, max-age=0, stale-while-revalidate=31536000", // Tell Edge to cache asset for up to a year
        }
    }
};

export { handler };
