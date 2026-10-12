import { createPushHost } from "./push-host.js";
export const name = 'dsh-web-ui-notify';
export const inject = ['agents', 'connection', 'webServer'];
export function apply(ctx) {
    createPushHost(ctx);
}
