#!/usr/bin/env node
/**
 * nous-portal-free-provider login CLI.
 *
 * The harness authorization seam (`ctx.authorization`) has no surface in this
 * dsh build — nothing calls `begin()`, so a registered flow cannot be started
 * from the webui or the CLI. This wrapper runs the same device-code dance that
 * flow would and commits the grant straight into the credentials document the
 * host watches, so the provider route picks it up without a restart.
 *
 * @module nous-portal-free-provider/cli
 */
/**
 * Render the next document text with this plugin's grant record written,
 * preserving comments and formatting of everything else. Mirrors
 * credentials-local's own edit style: replace the whole record node.
 */
export declare function renderRecord(text: string | undefined, key: string, record: unknown): string;
