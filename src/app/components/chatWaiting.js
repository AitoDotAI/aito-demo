/**
 * What the chat says while a reply is on its way.
 *
 * A reply took 37 s on demo.aito.ai with nothing but "Thinking..." on screen,
 * which reads as broken. The server gives up at 60 s with a plain answer
 * (shared/llm/completion.cjs); until then the visitor sees that work is going on.
 */
export function waitingMessage(seconds) {
  if (seconds < 8) return 'Thinking...'
  if (seconds < 25) return 'Searching the catalogue and your shopping history...'
  return `Still working on it (${Math.round(seconds)} s). The AI service is slow right now; this gives up at 60 s.`
}
