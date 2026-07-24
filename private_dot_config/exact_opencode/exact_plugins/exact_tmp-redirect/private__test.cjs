function isBlockedTmpWrite(filePath){const path=require("path");return path.resolve(filePath)==="/tmp";}
function isBlockedTmpBash(command){const idx=command.indexOf("/tmp");if(idx===-1)return false;if(idx>0&&/[a-zA-Z0-9]/.test(command[idx-1]))return false;const after=command.slice(idx+4);if(after===""||after==="/")return true;if(after.startsWith("/")){if(command.includes("git clone"))return!after.startsWith("/opencode");return false;}return true;}
const w=[["/tmp",true],["/tmp/",true],["/tmp/foo",false],["/tmp/agent.sock",false],["/tmp/opencode",false],["/tmp/opencode/x",false],["/var/home/chen/a/b/c",false],["/tmp/a",false],["/tmp/a/b/c",false],["/home/foo",false]];
let ok=true;
for(const[p,exp]of w){const r=isBlockedTmpWrite(p);if(r!==exp){ok=false;console.log("FAIL w",p,"=>",r,"exp",exp);}else console.log("OK w",p,"=>",r);}
const b=[["cd /tmp",true],["cd /tmp/",true],["ls /tmp",true],["rm -rf /tmp",true],["git clone xxx /tmp",true],["git clone xxx /tmp/foo",true],["git clone xxx /tmp/foo/",true],["git clone xxx /tmp/opencode/foo",false],["/tmp/opencode",false],["/tmp/opencode/...",false],["/tmp/agent.sock",false],["/tmp",true],["/tmp/",true],["/tmp/foo",false],["cd /tmp/foo",false],["cat /tmp/foo/bar",false],["echo '/tmp'",true],["ls /tmpdir",true],["ls /var/home/tmp-redirect",false]];
for(const[c,exp]of b){const r=isBlockedTmpBash(c);if(r!==exp){ok=false;console.log("FAIL b",c,"=>",r,"exp",exp);}else console.log("OK b",c,"=>",r);}
console.log(ok?"ALL PASS":"HAS FAIL");
