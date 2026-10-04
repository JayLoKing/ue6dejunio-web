export const HandoverUrl = {
  /** GET (204 si no hay), POST y DELETE sobre el mismo recurso. */
  Base: "/users/director-handover",
  /** Quién es el dueño de un correo, antes de mandar el POST que ascendería a esa persona. */
  Lookup: "/users/lookup",
} as const
