/**
 * Host half of the Codex theme bundle.
 *
 * The whole restyle lives in the Client module: it stacks a `--dsw-*` alias-token
 * override layer through `ctx.theme.overrideTokens`, which is the supported
 * third-party theme extension point. Nothing is model-facing, so the Host half
 * registers no services and no tools.
 */
export function apply() {}
