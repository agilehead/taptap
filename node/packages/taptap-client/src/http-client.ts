import type { Logger, Result } from "./types.js";
import { success, failure } from "./types.js";

export type GraphQLRequestOptions = {
  endpoint: string;
  query: string;
  variables?: Record<string, unknown>;
  timeout?: number;
  logger?: Logger;
};

type GraphQLResponse<T> = {
  data?: T;
  errors?: Array<{ message: string }>;
};

export async function graphqlRequest<T>(
  options: GraphQLRequestOptions,
): Promise<Result<T>> {
  const { endpoint, query, variables, timeout, logger } = options;

  try {
    logger?.debug("TapTap GraphQL request:", { endpoint });

    const controller = new AbortController();
    const timeoutId =
      timeout !== undefined
        ? setTimeout(() => {
            controller.abort();
          }, timeout)
        : undefined;

    let response: Response;
    try {
      response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query, variables }),
        signal: controller.signal,
      });
    } finally {
      if (timeoutId !== undefined) {
        clearTimeout(timeoutId);
      }
    }

    if (!response.ok) {
      const message = `TapTap API error: ${String(response.status)}`;
      logger?.error("TapTap request failed:", {
        status: response.status,
        error: message,
      });
      return failure(new Error(message));
    }

    const body = (await response.json()) as GraphQLResponse<T>;

    if (body.errors && body.errors.length > 0) {
      const message = body.errors.map((e) => e.message).join("; ");
      logger?.error("TapTap GraphQL error:", { errors: body.errors });
      return failure(new Error(message));
    }

    if (body.data === undefined || body.data === null) {
      return failure(new Error("No data in TapTap response"));
    }

    return success(body.data);
  } catch (err: unknown) {
    if (err instanceof DOMException && err.name === "AbortError") {
      logger?.error("TapTap request timed out:", { endpoint });
      return failure(new Error("Request timed out"));
    }
    const message = err instanceof Error ? err.message : String(err);
    logger?.error("TapTap request error:", { endpoint, error: message });
    return failure(new Error(`Network error: ${message}`));
  }
}
