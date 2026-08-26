//#region src/index.ts
const SCRIPT = `<script>
(() => {
  if (typeof crypto === 'undefined' || typeof crypto.randomUUID === 'function') return
  Object.defineProperty(Crypto.prototype, 'randomUUID', {
    configurable: true,
    value: () => {
      const bytes = crypto.getRandomValues(new Uint8Array(16))
      bytes[6] = (bytes[6] & 0x0f) | 0x40
      bytes[8] = (bytes[8] & 0x3f) | 0x80
      const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
      return \`\${hex.slice(0, 8)}-\${hex.slice(8, 12)}-\${hex.slice(12, 16)}-\${hex.slice(16, 20)}-\${hex.slice(20)}\`
    },
  })
})()
<\/script>`;
const name = "lan-secure-context";
const inject = ["webServer"];
function apply(ctx) {
	ctx.effect(() => ctx.webServer.tapIndex((html) => {
		const head = html.indexOf("<head>");
		return head === -1 ? SCRIPT + html : html.slice(0, head + 6) + SCRIPT + html.slice(head + 6);
	}), "lan-secure-context: randomUUID polyfill index tap");
}
//#endregion
export { apply, inject, name };
