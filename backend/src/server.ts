import dotenv from "dotenv";
import {
  createServer,
  type IncomingMessage,
  type ServerResponse,
} from "node:http";
import { searchConcerts, type ConcertQuery } from "./ticketmaster.js";

dotenv.config({ path: new URL("../.env", import.meta.url) });

const port = Number(process.env.PORT ?? 8787);
const apiKey = process.env.TICKETMASTER_API_KEY;

function sendJson(response: ServerResponse, status: number, body: unknown) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
  });
  response.end(JSON.stringify(body));
}

function getQuery(request: IncomingMessage): ConcertQuery {
  const url = new URL(
    request.url ?? "/",
    `http://${request.headers.host ?? "localhost"}`,
  );
  return {
    keyword: url.searchParams.get("keyword")?.trim() || undefined,
    city: url.searchParams.get("city")?.trim() || undefined,
    category: url.searchParams.get("category")?.trim() || undefined,
    offset: Number(url.searchParams.get("offset") ?? 0),
    limit: Number(url.searchParams.get("limit") ?? 20),
  };
}

const server = createServer(async (request, response) => {
  if (request.method === "OPTIONS") {
    response.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
    });
    response.end();
    return;
  }

  const pathname = new URL(
    request.url ?? "/",
    `http://${request.headers.host ?? "localhost"}`,
  ).pathname;

  if (request.method !== "GET" || pathname !== "/api/concerts") {
    sendJson(response, 404, { error: "Not found" });
    return;
  }

  if (!apiKey) {
    sendJson(response, 500, {
      error: "TICKETMASTER_API_KEY is not configured",
    });
    return;
  }

  try {
    const concerts = await searchConcerts(getQuery(request), apiKey);
    sendJson(response, 200, { concerts });
  } catch (error) {
    console.error(error);
    sendJson(response, 502, { error: "Unable to load concerts" });
  }
});

server.listen(port, () => {
  console.log(`Encore backend listening on http://localhost:${port}`);
});
