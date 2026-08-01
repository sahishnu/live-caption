import { createLocalTransport } from './localTransport'

/** The single Transport instance for this window. See ADR 0006. */
export const transport = createLocalTransport()
