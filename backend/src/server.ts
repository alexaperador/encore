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
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;
const MAX_OFFSET = 500;
const CACHE_TTL_MS = 60_000;
const MAX_CACHE_ENTRIES = 100;

type CacheEntry = { concerts: Awaited<ReturnType<typeof searchConcerts>>; expiresAt: number };
const responseCache = new Map<string, CacheEntry>();

class QueryValidationError extends Error {}

function getInteger(
  value: string | null,
  fallback: number,
  maximum: number,
): number {
  if (value === null) return fallback;
  if (!/^\d+$/.test(value)) throw new QueryValidationError("Invalid numeric parameter");

  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed > maximum) {
    throw new QueryValidationError("Numeric parameter is out of range");
  }
  return parsed;
}

function getTextParameter(
  searchParams: URLSearchParams,
  name: string,
  maximumLength: number,
): string | undefined {
  const value = searchParams.get(name)?.trim();
  if (!value) return undefined;
  if (value.length > maximumLength) {
    throw new QueryValidationError("Text parameter is too long");
  }
  return value;
}

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
  const countryCode = getTextParameter(url.searchParams, "countryCode", 2);
  if (countryCode && !/^[a-z]{2}$/i.test(countryCode)) {
    throw new QueryValidationError("Invalid country code");
  }

  const limit = getInteger(url.searchParams.get("limit"), DEFAULT_LIMIT, MAX_LIMIT);
  if (limit < 1) throw new QueryValidationError("Limit must be positive");

  return {
    keyword: getTextParameter(url.searchParams, "keyword", 100),
    city: getTextParameter(url.searchParams, "city", 100),
    countryCode: countryCode?.toUpperCase(),
    category: getTextParameter(url.searchParams, "category", 80),
    offset: getInteger(url.searchParams.get("offset"), 0, MAX_OFFSET),
    limit,
  };
}

function getCachedConcerts(key: string) {
  const entry = responseCache.get(key);
  if (!entry) return undefined;
  if (entry.expiresAt <= Date.now()) {
    responseCache.delete(key);
    return undefined;
  }

  // Refresh insertion order so recently used entries stay in the bounded cache.
  responseCache.delete(key);
  responseCache.set(key, entry);
  return entry.concerts;
}

function cacheConcerts(key: string, concerts: CacheEntry["concerts"]) {
  responseCache.delete(key);
  responseCache.set(key, { concerts, expiresAt: Date.now() + CACHE_TTL_MS });
  while (responseCache.size > MAX_CACHE_ENTRIES) {
    const oldestKey = responseCache.keys().next().value;
    if (oldestKey === undefined) break;
    responseCache.delete(oldestKey);
  }
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

  let query: ConcertQuery;
  try {
    query = getQuery(request);
  } catch (error) {
    if (error instanceof QueryValidationError) {
      sendJson(response, 400, { error: "Invalid search parameters" });
      return;
    }
    sendJson(response, 400, { error: "Invalid search parameters" });
    return;
  }

  const cacheKey = JSON.stringify(query);
  const cachedConcerts = getCachedConcerts(cacheKey);
  if (cachedConcerts) {
    sendJson(response, 200, { concerts: cachedConcerts });
    return;
  }

  try {
    const concerts = await searchConcerts(query, apiKey);
    cacheConcerts(cacheKey, concerts);
    sendJson(response, 200, { concerts });
  } catch {
    console.error("Ticketmaster request failed");
    sendJson(response, 502, { error: "Unable to load concerts" });
  }
});

server.listen(port, () => {
  console.log(`Encore backend listening on http://localhost:${port}`);
});
