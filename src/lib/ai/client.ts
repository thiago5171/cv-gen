/**
 * client.ts
 * Anthropic client factory (browser mode) and error mapping to friendly
 * Portuguese messages. The API key lives only in the browser (localStorage) —
 * see storage.ts and the UI warning.
 */

import Anthropic from "@anthropic-ai/sdk";

export function makeClient(apiKey: string): Anthropic {
  return new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
}

/** Translate SDK/API errors into a message safe to show the user. */
export function friendlyError(error: unknown): string {
  if (error instanceof Anthropic.AuthenticationError) {
    return "Chave da API inválida ou sem permissão. Verifique a API key.";
  }
  if (error instanceof Anthropic.PermissionDeniedError) {
    return "Acesso negado para esta chave (verifique billing/permissões).";
  }
  if (error instanceof Anthropic.RateLimitError) {
    return "Limite de requisições atingido. Aguarde alguns segundos e tente de novo.";
  }
  if (error instanceof Anthropic.BadRequestError) {
    if (/credit balance is too low/i.test(error.message)) {
      return "Saldo de créditos insuficiente na conta Anthropic. Vá em Plans & Billing (console.anthropic.com) e adicione créditos.";
    }
    return `Requisição inválida: ${error.message}`;
  }
  if (error instanceof Anthropic.APIConnectionError) {
    return "Falha de conexão com a API da Anthropic. Verifique sua internet.";
  }
  if (error instanceof Anthropic.APIError) {
    return `Erro da API (${error.status ?? "?"}): ${error.message}`;
  }
  return error instanceof Error ? error.message : "Erro desconhecido.";
}

/**
 * Guard the response's stop_reason before reading content. Returns an error
 * message if the turn didn't complete cleanly, else null.
 */
export function stopReasonError(stopReason: string | null | undefined): string | null {
  if (stopReason === "refusal") {
    return "O modelo recusou a solicitação por motivos de segurança.";
  }
  if (stopReason === "max_tokens") {
    return "Resposta truncada (max_tokens). Tente novamente ou reduza o escopo.";
  }
  return null;
}
