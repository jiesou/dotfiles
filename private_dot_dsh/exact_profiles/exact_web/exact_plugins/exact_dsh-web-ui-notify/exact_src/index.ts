import { createPushHost } from './push-host.ts'

export const name = 'dsh-web-ui-notify'
export const inject = ['agents', 'connection', 'webServer']

export function apply(ctx: any): void {
  createPushHost(ctx)
}
