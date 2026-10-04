export interface HandoverParty {
  id: string
  fullName: string
  email: string
}

export interface DirectorHandover {
  id: string
  outgoing: HandoverParty
  incoming: HandoverParty & {
    /** true mientras no cambió la contraseña temporal; al cambiarla el cambio se cierra. */
    mustChangePassword: boolean
  }
  /** true si el cambio creó la cuenta; false si ascendió a alguien que ya existía. */
  incomingCreated: boolean
  startedAt: string
}

/** Quién es el dueño de un correo; lo justo para decidir si se asciende o se crea. */
export interface UserLookup {
  id: string
  fullName: string
  email: string
  role: string
  active: boolean
}
