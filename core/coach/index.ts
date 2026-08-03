/**
 * The coach conversation — routing what you said, and answering it.
 *
 * The model, if one ever arrives, may only ever produce an `Intent`
 * (see ./types.ts). Every answer is composed here from the same engine the
 * screens use.
 */

export { outOfScope, routeIntent } from "./intent.ts";
export { parseIntent } from "./parse-intent.ts";
export { respond } from "./respond.ts";
export type { CoachContext } from "./respond.ts";
export type { CoachReply, Intent, IntentKind } from "./types.ts";
