// netlify/functions/workbenches.js
import fetch from "node-fetch";

const TENANT = "nikeonis-partner-sandbox.us-2.celonis.cloud";

export async function handler(event, context) {
  try {
    const token = process.env.CELONIS_PAT; // ← Set this in Netlify Environment Variables

    if (!token) {
      return {
        statusCode: 500,
        body: "Missing CELONIS_PAT environment variable"
      };
    }

    // 1) Fetch all Apps
    const appsRes = await fetch(`https://${TENANT}/intelligence/api/applications`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!appsRes.ok) {
      return {
        statusCode: appsRes.status,
        body: `Error fetching apps: ${await appsRes.text()}`
      };
    }

    const apps = await appsRes.json();
    const workbenches = [];

    // 2) For each app, fetch pages and filter workbenches
    for (const app of apps.data || []) {
      const pagesRes = await fetch(
        `https://${TENANT}/intelligence/api/applications/${app.id}/pages`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (!pagesRes.ok) continue;

      const pages = await pagesRes.json();

      (pages.data || [])
        .filter(p => p.type === "WORKBENCH")
        .forEach(p => {
          workbenches.push({
            appName: app.name,
            appId: app.id,
            pageId: p.id,
            pageName: p.name
          });
        });
    }

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify(workbenches)
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: `Server error: ${err.message}`
    };
  }
}
