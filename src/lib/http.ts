import { actionErrorStatus } from "./actions";
import { recordArrival } from "./arrivals";
import { apiError, json, readJson, type Json } from "./api";
import { citizenFromRequest, requireWriteAuthNote } from "./auth";
import type { Citizen } from "@prisma/client";

export async function tracked<T extends Json>(
  request: Request,
  handler: () => Promise<T> | T,
  status = 200
) {
  await recordArrival(request);
  try {
    return json(await handler(), status);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Request failed";
    return apiError(message, actionErrorStatus(err));
  }
}

export async function withBody<T extends Json>(
  request: Request,
  handler: (body: Record<string, unknown>) => Promise<T>
) {
  await recordArrival(request);
  const body = await readJson<Record<string, unknown>>(request);
  if (!body) return apiError("JSON body required");
  const note = requireWriteAuthNote(body);
  if (note) return apiError(note, 400);
  try {
    return json(await handler(body));
  } catch (err) {
    const message = err instanceof Error ? err.message : "Request failed";
    return apiError(message, actionErrorStatus(err));
  }
}

export async function withCitizen<T extends Json>(
  request: Request,
  handler: (citizen: Citizen, body: Record<string, unknown>) => Promise<T>
) {
  await recordArrival(request);
  const citizen = await citizenFromRequest(request);
  if (!citizen) return apiError("Authorization: Bearer ac_sk_... required", 401);
  const body = (await readJson<Record<string, unknown>>(request)) || {};
  const note = requireWriteAuthNote(body);
  if (note) return apiError(note, 400);
  try {
    return json(await handler(citizen, body));
  } catch (err) {
    const message = err instanceof Error ? err.message : "Request failed";
    return apiError(message, actionErrorStatus(err));
  }
}
