function isBlockedTmpWrite(filePath){const path=require("path");const resolved=path.resolve(filePath);if(!resolved.startsWith("/tmp/"))return false;if(resolved==="/tmp/opencode")return false;if(resolved.startsWith("/tmp/opencode/"))return false;if(resolved==="/tmp/agent.socket")return false;const rest=resolved.slice("/tmp/".length);return !rest.includes("/");}
function isBlockedTmpBash(command){if(!command.includes("/tmp"))return false;if(command.includes("/tmp/agent.socket"))return false;if(command.includes("/tmp/opencode"))return false;for(const token of command.matchAll(/\/tmp\/[^\/\s"'`()]*/g)){const rest=token[0].slice("/tmp/".length);if(!rest.includes("/"))return true;}return false;}
const w=[["/tmp/file.txt",true],["/tmp/agent.socket",false],["/tmp/opencode",false],["/tmp/opencode/x",false],["/var/home/chen/a/b/c",false],["/tmp/a",true],["/home/foo",false]];
let ok=true;
for(const [p,exp] of w){const r=isBlockedTmpWrite(p);if(r!==exp){ok=false;console.log("FAIL w",p,"=>",r,"exp",exp);}else console.log("OK w",p,"=>",r);}
const b=[["ls /tmp/foo",true],["cat /tmp/agent.socket",false],["echo /tmp/opencode/x",false],["cat /tmp/a/b/c",false],["ls /var/home/tmp-redirect",false],["rm /tmp/file",true]];
for(const [c,exp] of b){const r=isBlockedTmpBash(c);if(r!==exp){ok=false;console.log("FAIL b",c,"=>",r,"exp",exp);}else console.log("OK b",c,"=>",r);}
console.log(ok?"ALL PASS":"HAS FAIL");
