---
name: easyeda-api
description: >-
  USE when working with EasyEDA Pro / 嘉立创EDA专业版 (PCB, schematic, footprint, symbol, library,
  project, or extension development). 嘉立创EDA's English name is EasyEDA — same product.
  Local API reference (131 classes) + the official `lceda-pro` CLI that drives the running client.
disable-model-invocation: true
---

# EasyEDA Pro API Skill

Drive EasyEDA Pro (嘉立创EDA专业版) from the official `lceda-pro` command-line client. This skill provides:

1. **Complete API reference** — 131 classes, 62 enums, 70 interfaces, 19 type aliases
2. **The CLI form** — `doctor` / `session` / `invoke` / `doc`, plus `--mcp` for agents that speak MCP
3. **Code patterns** — Common operations for PCB, schematic, library, and project management
4. **Document source format reference** — File format specifications for project, schematic, and PCB sources when users need to analyze or modify EasyEDA document source directly instead of using the API

This skill supports not only live debugging in EasyEDA, but also EasyEDA extension development.
During EasyEDA extension development, AI agents can use the extension-related documentation, API references, type information, and usage examples provided by this skill to look up APIs, write code, and validate behavior during integration and debugging.

## Architecture

The CLI is built into the client executable (v4.1.60+); nothing else needs installing, and
the browser / online edition is not supported.

```
lceda-pro doctor                                  probe the endpoint
lceda-pro session list                            one editor window = one session
lceda-pro invoke --session S --ext-uuid eda ...   run JS inside that window
lceda-pro doc api ...                             progressive API lookup
lceda-pro --mcp stdio                             the same tree as MCP tools
```

Each command is a short-lived process that talks to the running editor over a local
endpoint; every one returns the same JSON envelope.

Full references for this form:

- [guide/cli.md](guide/cli.md) — the complete CLI reference shipped with this skill (every command and option, project formats, workflows A and B)
- <https://prodocs.lceda.cn/storage/texts/api/guide/cli-for-ai.md> — the official agent-oriented CLI document: hard constraints and verification checkpoints to follow when acting on the user's behalf

## Quick Start

### 1. Command Triggers

When user says **"嘉立创EDA，启动！"**, **"立创EDA，启动！"**, or **"EDA，启动！"**:

**IMPORTANT: Session initialization** — Reply immediately with this exact text to set the correct session title:

```
📋 EasyEDA Session
```

Then proceed with the setup steps below.

### 2. Probe the endpoint

```bash
lceda-pro doctor
```

`"connected": false` means no editor is running — ask the user to launch EasyEDA Pro,
then retry. Every CLI command prints this envelope; only the top-level `ok` needs checking.

### 3. Pick a session

Every editor window already has a session, whether the user opened it in the GUI or the CLI
opened it:

```bash
lceda-pro session list
```

```json
{"sessionId": "fe063ab0-...", "origin": "user", "path": null, "title": "嘉立创EDA(专业版) - V4.1.71"}
```

`origin: user` windows belong to the user — read and drive them freely, but never
`session close` them. To open a project yourself:

```bash
lceda-pro open --path /path/to/Board.eprj3     # -> value.sessionId ; add --headless true to hide the window
```

### 4. Execute code on EDA

Always pass `--ext-uuid eda`: it runs the code under the built-in extension identity, which
grants file-system and system access. Without it many APIs fail.

```bash
cat > probe.js <<'EOF'
const out = {};
out.version = eda.sys_Environment.getEditorCurrentVersion();
out.user = (await eda.sys_Environment.getUserInfo()).username;
return out;
EOF

lceda-pro invoke --session "$S" --ext-uuid eda --code-file - < probe.js
```

```json
{"ok": true, "value": {"version": "4.1.71", "user": "jiesou"}, "logs": [], "durationMs": 3}
```

`--code-file -` reads the source from stdin. Prefer it over `--code`: a real file keeps
multi-line code and quotes intact, and sidesteps shell escaping entirely. `--code-file <path>`
also works, but the path is resolved *inside the client's sandbox* (a Flatpak install only
sees the home directory), so stdin is the reliable form.

For long operations raise the budget with `--timeout <ms>` (default 60000, max 1800000).

### 5. Look up the API

The API is discovered progressively — never guess a signature:

```bash
lceda-pro doc api                                                        # every class
lceda-pro doc api --class-name PCB_Document                              # its methods
lceda-pro doc api --class-name PCB_Document --method-name autoRouting     # full signature + runnable example
```

`callPath` is the property name on `eda`, so class `DMT_Project` is called as
`eda.dmt_Project.createProject(...)`. Every method ships with a runnable example.

### 6. Close what you opened

```bash
lceda-pro session close --session "$S" --destroy
```

Windows the user opened are rejected with `SESSION_NOT_OWNED` — leave them alone.
`session abort` force-kills any window including the user's; it is a last resort.

## API Documentation

The full API reference is in the [references/](references/) directory:

- [references/_index.md](references/_index.md) — Master index of all classes, enums, interfaces, and types
- [references/_quick-reference.md](references/_quick-reference.md) — All method signatures for rapid lookup
- `references/classes/` — 120 class docs (DMT_*, PCB_*, SCH_*, LIB_*, SYS_*, IPCB_*, ISCH_*)
- `references/enums/` — 62 enum docs
- `references/interfaces/` — 70 interface docs
- `references/types/` — 19 type alias docs

### How to look up API

1. **Ask the running client** — `lceda-pro doc api --class-name <C> [--method-name <m>]`; it is the authoritative, version-matched reference and includes a runnable example per method
2. **Start with `_index.md`** to find the right class/module for the task
3. **Read the class doc** (e.g., `references/classes/DMT_Board.md`) for all methods and signatures
4. **Use `_quick-reference.md`** for fast method signature lookup across all classes
5. **Check enums/interfaces** for parameter types and return types

### Document Source Format Documentation

If the user needs to analyze or modify EasyEDA document source directly instead of using the API, use the documents in the [format/](format/) directory.

- [format/index.md](format/index.md) — Overview of the EasyEDA document source format references and version notes
- `format/project/` — Project source structure, metadata, blobs, variants, and grouping data
- `format/schematic/` — Schematic source format, including structure, wires, shapes, pins, components, and tables
- `format/pcb/` — PCB source format, including primitives, pads and vias, shapes, text, attributes, rules, and panel data

Use these files when the task is about understanding source layout, generating compatible document source, or editing source data that will later be imported back into EasyEDA.

### API Module Overview

| Prefix | Domain | Key Classes |
|--------|--------|-------------|
| `DMT_` | Document management | Board, EditorControl, Folder, Panel, Pcb, Project, Schematic, SelectControl, Team, Workspace |
| `PCB_` | PCB & Footprint | Document, Drc, Event, Layer, Net, Primitive, PrimitiveComponent, PrimitiveLine, PrimitivePad, PrimitivePour, PrimitiveVia, SelectControl |
| `SCH_` | Schematic | Document, Event, Primitive, PrimitiveComponent, PrimitiveWire, SelectControl |
| `LIB_` | Library | 3DModel, Cbb, Classification, Device, Footprint, LibrariesList, PanelLibrary, SelectControl, Symbol |
| `SYS_` | System | Dialog, Environment, FileManager, FileSystem, FontManager, HeaderMenu, I18n, IFrame, LoadingAndProgressBar, Log, Message, MessageBox, MessageBus, PanelControl, Setting, ShortcutKey, Storage, Timer, ToastMessage, WebSocket, Window |
| `IPCB_` | PCB interfaces (图元) | PrimitiveArc, PrimitiveComponent, PrimitivePad, PrimitiveFill, PrimitivePour, PrimitiveRegion, PrimitiveVia, ... |
| `ISCH_` | Schematic interfaces (图元) | PrimitiveArc, PrimitiveComponent, PrimitiveWire, PrimitiveText, PrimitiveRectangle, ... |
| `EPCB_` / `ESCH_` | Enums | PrimitiveType, Layer, PadType, ... |

## Code Execution Context

All code runs inside EasyEDA Pro's browser runtime as the body of an async function:

```javascript
// Your code here — `eda` is the global EDA API object
// You MUST use `return` to send results back
```

**Critical rules:**
- The `eda` object provides access to all API modules (e.g., `eda.dmt_Board`, `eda.pcb_Primitive`).
- Always refer to the API documentation for correct usage.
- Always use `return` to get results — `console.log` output is NOT captured (`logs` in the envelope only carries runtime warnings).
- All API methods returning promises must be `await`ed.
- Code runs in browser context — no Node.js APIs (fs, path, etc.) available.
- Use `eda.sys_Message.showToastMessage(msg)` for user-visible notifications.
- When reviewing API documentation and encountering enumerations, do not guess the enumeration values. You must use the enumeration members, for example: `EPCB_LayerId.TOP` instead of `1` for the layer parameter in PCB primitive creation.

### Extension Runtime Constraints

When writing EasyEDA extensions, standard browser APIs are **forbidden** in the main process. Use EDA-provided alternatives:

| Purpose | ❌ Forbidden | ✅ Use Instead |
|---------|-------------|----------------|
| Get user input | — | `eda.sys_Dialog.showInputDialog()` |
| User selection | — | `eda.sys_Dialog.showSelectDialog()` |
| Show message | `alert()` | `eda.sys_Dialog.showInformationMessage()` |
| Confirm action | `confirm()` | `eda.sys_Dialog.showConfirmationMessage()` |
| Toast notification | DOM manipulation | `eda.sys_Message.showToastMessage()` |
| Store data | `localStorage` (main process) | `eda.sys_Storage.setExtensionUserConfig(key, value)` |
| Custom UI | Manipulate host DOM | `eda.sys_IFrame.openIFrame()` |
| Show HTML | `showInformationMessage(html)` | Must use iframe |
| Open link | `window.open()` | `eda.sys_Window.open()` |
| Browser hardware API | Use in main process | Available in iframe (`navigator.serial`, etc.) |

**Note:** `localStorage`, `window`, `document` etc. are available **inside `sys_IFrame`** but NOT in the main extension process.

### Extension ↔ IFrame Data Passing

The main extension process and `sys_IFrame` iframe are **isolated contexts**. To pass data between them:

**Option A (Recommended):** Use `eda.sys_Storage` as a bridge
```javascript
// In main extension process:
await eda.sys_Storage.setExtensionUserConfig('myKey', JSON.stringify(data));

// In iframe:
const data = JSON.parse(await eda.sys_Storage.getExtensionUserConfig('myKey'));
```

**Option B:** Both contexts can access `eda` directly — call the same API from either side
```javascript
// In iframe HTML (NOT window.parent.eda):
const info = await eda.dmt_Project.getCurrentProjectInfo();
```

## Response Envelope and MCP

Every command returns the same shape; only the outermost `ok` matters:

```json
{"ok": true,  "value": {}, "logs": [], "durationMs": 12}
{"ok": false, "error": {"code": "EXECUTION_ERROR", "message": "..."}}
```

The code handed to `invoke` is an async function **body**: use `return`, `await` directly,
and read `--args '<json>'` through `__CLI__.args`.

### MCP

```bash
lceda-pro --mcp stdio                        # local agent
lceda-pro --mcp http --port 3030 --token T   # remote / browser agent
```

MCP exposes the same command tree through three generic tools — `lceda-pro.help`,
`lceda-pro.discover`, `lceda-pro.call`. There are no per-API tools: discovery is
`discover("...")`, execution is `call({path: "invoke", input: {...}})`. `prompts` and
`resources` are not implemented.

### Legacy: the WebSocket bridge

Earlier versions of this skill drove a separate Node.js bridge server
(`scripts/bridge-server.mjs`, ports 49620-49629) plus the `run-api-gateway` extension, and
executed code over `curl -X POST .../execute`. It predates the built-in CLI, needs an
extension install and a background process, and is superseded by everything above. The
script is kept only for clients older than v4.1.60 that have no CLI.

## Common Patterns

### Project & Board Operations

```javascript
// Get current project info
return await eda.dmt_Project.getCurrentProjectInfo();

// List all boards in project
return await eda.dmt_Board.getAllBoardsInfo();

// Create a new board (optionally link to schematic/PCB)
return await eda.dmt_Board.createBoard();

// Switch to a document tab
await eda.dmt_EditorControl.activateDocument(tabId);
```

### Example: Open a project by name and open its first schematic page

```javascript
const targetProjectName = 'NE555 Circuit';

// 1. Enumerate projects by team/folder and find the target by name
const teams = await eda.dmt_Team.getAllTeamsInfo();
const seenProjectUuid = new Set();
let targetProjectUuid = null;

for (const team of teams || []) {
  const teamProjects = await eda.dmt_Project.getAllProjectsUuid(team.uuid);
  for (const projectUuid of teamProjects || []) {
    if (seenProjectUuid.has(projectUuid)) continue;
    seenProjectUuid.add(projectUuid);

    const info = await eda.dmt_Project.getProjectInfo(projectUuid);
    const name = info?.friendlyName || info?.name || '';
    if (name === targetProjectName) {
      targetProjectUuid = projectUuid;
      break;
    }
  }
  if (targetProjectUuid) break;

  const folderUuids = await eda.dmt_Folder.getAllFoldersUuid(team.uuid);
  for (const folderUuid of folderUuids || []) {
    const folderProjects = await eda.dmt_Project.getAllProjectsUuid(team.uuid, folderUuid);
    for (const projectUuid of folderProjects || []) {
      if (seenProjectUuid.has(projectUuid)) continue;
      seenProjectUuid.add(projectUuid);

      const info = await eda.dmt_Project.getProjectInfo(projectUuid);
      const name = info?.friendlyName || info?.name || '';
      if (name === targetProjectName) {
        targetProjectUuid = projectUuid;
        break;
      }
    }
    if (targetProjectUuid) break;
  }
  if (targetProjectUuid) break;
}

if (!targetProjectUuid) {
  throw new Error(`Project not found: ${targetProjectName}`);
}

// 2. Open the project
const opened = await eda.dmt_Project.openProject(targetProjectUuid);
if (!opened) {
  throw new Error(`Failed to open project: ${targetProjectName}`);
}

// 3. Get the first schematic page and open it
const schematics = await eda.dmt_Schematic.getAllSchematicsInfo();
if (!Array.isArray(schematics) || schematics.length === 0) {
  throw new Error(`No schematics found in project: ${targetProjectName}`);
}

const firstSchematic = schematics[0];
const pages = await eda.dmt_Schematic.getAllSchematicPagesInfo();
const firstPage = (pages || []).find((page) => page.parentSchematicUuid === firstSchematic.uuid)
  || firstSchematic.page?.[0];

if (!firstPage) {
  throw new Error(`No schematic page found in: ${firstSchematic.name}`);
}

const tabId = await eda.dmt_EditorControl.openDocument(firstPage.uuid);

return {
  projectUuid: targetProjectUuid,
  schematicUuid: firstSchematic.uuid,
  pageUuid: firstPage.uuid,
  tabId,
};
```

**Notes:**
- `dmt_Project.getAllProjectsUuid()` is **not** a global no-arg enumerator in practice. To reliably find a project by name, iterate teams first, then folders.
- `openProject(projectUuid)` may discard unsaved changes in the currently opened project. Be careful before calling it.

### PCB Primitive Operations

```javascript
// Get selected primitives
const selected = eda.pcb_SelectControl.getAllSelectedPrimitives_PrimitiveId();

// Create a line on copper layer
// Layer parameter uses EPCB_LayerId enum — see references/enums/EPCB_LayerId.md
await eda.pcb_PrimitiveLine.create(
  "GND",                       // net (string)
  EPCB_LayerId.TOP,            // layer — use enum, NOT raw number
  0,                           // startX (unit: 1mil)
  0,                           // startY (unit: 1mil)
  1000,                        // endX (unit: 1mil)
  0,                           // endY (unit: 1mil)
  10,                          // lineWidth
  false                        // primitiveLock
);

// Modify an existing primitive (async pattern)
const prim = await eda.pcb_PrimitiveComponent.get([id]);
const asyncPrim = prim.toAsync();
asyncPrim.setState_X(newX);
asyncPrim.setState_Y(newY);
asyncPrim.done();
```

### PCB Async Primitive Pattern (IMPORTANT)

For **modifying** PCB/SCH primitives, you must use the async pattern:

```javascript
// 1. Get the primitive
const prim = await eda.pcb_PrimitiveVia.get([viaId]);
// 2. Convert to async mode
const asyncPrim = prim.toAsync();
// 3. Set new values
asyncPrim.setState_X(newX);
asyncPrim.setState_Y(newY);
asyncPrim.setState_Diameter(diameter);
// 4. Apply changes
asyncPrim.done();
```

### Schematic Operations

```javascript
// Get all pages
return await eda.dmt_Schematic.getAllSchematicDocumentsInfo();

// Create a schematic component
// component parameter requires {libraryUuid, uuid} object — NOT a plain string
await eda.sch_PrimitiveComponent.create(
  { libraryUuid: "...", uuid: "device-uuid-from-library" },  // component object
  5000,                        // x (unit: 0.01inch = 10mil)
  5000,                        // y (unit: 0.01inch = 10mil)
  "",                          // subPartName
  0,                           // rotation (degrees, plain number)
  false,                       // mirror
  true,                        // addIntoBom
  true                         // addIntoPcb
);

// Get selected schematic primitives
const ids = eda.sch_SelectControl.getAllSelectedPrimitives_PrimitiveId();
```

### Library Operations

```javascript
// List all libraries in workspace
return await eda.lib_LibrariesList.getAllLibrariesList();

// Search devices
return await eda.lib_Device.search("STM32");

// Get symbol info
return await eda.lib_Symbol.get(symbolUuid);
```

### System Functions

```javascript
// Show toast message
eda.sys_Message.showToastMessage("Operation complete!");

// Show confirm dialog
const confirmed = await eda.sys_Dialog.showConfirmationMessage("Proceed?");

// File system (limited to extension sandbox)
const content = await eda.sys_FileSystem.readFileFromFileSystem(path);
await eda.sys_FileSystem.saveFileToFileSystem(path, content);
```

### DRC (Design Rule Check)

```javascript
// Run DRC check
const passed = await eda.pcb_Drc.check(true, true, false);
// passed is boolean: true if DRC passed, false if errors found
```

## Common Mistakes

### Read API Signatures Carefully (CRITICAL)

**Before calling ANY API method, you MUST read the full signature from `references/` — including parameter types, return type, and remarks.**

AI agents frequently make these errors due to skimming documentation:

**Error 1: Not `await`ing Promise-returning methods**

Almost all EDA API methods return `Promise<T>`. If you forget `await`, you get a Promise object instead of the actual result.

```javascript
// WRONG: Missing await — result is a Promise, not the project info
const project = eda.dmt_Project.getCurrentProjectInfo();
console.log(project); // Promise { <pending> }

// CORRECT: Always await async methods
const project = await eda.dmt_Project.getCurrentProjectInfo();
console.log(project); // { uuid: "...", name: "...", ... }
```

**How to know if a method needs `await`:** Check the return type in the signature. If it says `Promise<...>`, you MUST `await` it.

```typescript
// From references/classes/DMT_Project.md:
getCurrentProjectInfo(): Promise<IDMT_ProjectItem | null>
//                       ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
//                       This is a Promise — you MUST await it
```

**Error 2: Using raw numbers instead of enum values**

Many parameters expect specific enum values. Using wrong numbers silently produces incorrect behavior.

```javascript
// WRONG: What does layer "1" mean? Which copper layer? Signal? Mask?
await eda.pcb_PrimitiveLine.create("GND", 1, 0, 0, 1000, 0, 10, false);

// CORRECT: Use the enum — EPCB_LayerId.TOP is clear and type-safe
// Check references/enums/EPCB_LayerId.md for the correct value
await eda.pcb_PrimitiveLine.create("GND", EPCB_LayerId.TOP, 0, 0, 1000, 0, 10, false);
```

**Always look up enums in `references/enums/` before using numeric constants.**

**Error 3: Assuming parameter types without checking**

Different APIs use different units, different ID formats, and different optional parameter conventions. Never assume.

```javascript
// WRONG: Assuming create() parameters match modify() parameters
// create() and modify() often have DIFFERENT parameter orders/types

// CORRECT: Always read the exact signature for the method you're calling
// Check references/classes/<ClassName>.md for each method's specific signature
```

**Summary — Before every API call:**
1. **Read the signature** — parameter types, return type, all in `references/classes/`
2. **`await` if `Promise`** — check return type for `Promise<...>`
3. **Use enums** — look up in `references/enums/` instead of guessing numbers/strings
4. **Check remarks** — the "备注" section often has critical usage notes

### Coordinate Unit (CRITICAL)

**Different domains use different coordinate units:**

| Domain | Unit | Conversion |
|--------|------|------------|
| **PCB** | 1mil | 1mm ≈ 39.37 units |
| **Schematic** | 0.01inch (10mil) | 1mm ≈ 3.937 units |

**This is the #1 mistake AI agents make.** Mixing up the units will place components incorrectly.

- PCB: 1 unit = 1mil = 0.001 inch = 0.0254 mm
- Schematic: 1 unit = 0.01inch = 10mil = 0.254 mm

If you use the wrong unit, components will be placed **10x too far** from their intended position.

```javascript
// WRONG: thinking unit is 1mil (it's actually 0.01inch = 10mil)
// Placing at x=500 thinking it's 500mil = 0.5inch — but 500 units = 5000mil = 5inch!
await eda.sch_PrimitiveComponent.create({libraryUuid: "...", uuid: "dev-uuid"}, 500, 0, "", 0, false, true, true);

// CORRECT: 50 units = 500mil = 0.5inch (in 0.01inch units)
await eda.sch_PrimitiveComponent.create({libraryUuid: "...", uuid: "dev-uuid"}, 50, 0, "", 0, false, true, true);
```

### Document State (CRITICAL)

**After creating a project, you MUST open it before operating on documents within it.**

When operating on documents, always verify:
1. **Project is opened** — Use `eda.dmt_Project.getCurrentProjectInfo()` to verify
2. **Correct document is active** — Use `eda.dmt_SelectControl.getCurrentDocumentInfo()` to check document type
3. **Document type matches API domain** — PCB APIs require active PCB document, SCH APIs require active Schematic document

```javascript
// WRONG: Assuming operation will work without checking document state
await eda.pcb_PrimitiveLine.create(...); // May fail if no PCB document is open

// CORRECT: Always verify document state first
const project = await eda.dmt_Project.getCurrentProjectInfo();
if (!project) {
  // If you just created a project, you MUST open it before any operations!
  return "Error: No project is currently opened. If you just created a project using dmt_Project.createProject(), you MUST call dmt_Project.openProject(projectPath) to open it first. You cannot operate on documents until a project is opened.";
}

const doc = await eda.dmt_SelectControl.getCurrentDocumentInfo();
if (doc?.documentType !== EDMT_EditorDocumentType.PCB) {
  return "Error: No PCB document is currently active. Please open a PCB document first.";
}

// Now safe to perform PCB operations
await eda.pcb_PrimitiveLine.create(...);
```

**Operating on the wrong document type will return errors or null results.** For example:
- Executing `PCB_*` APIs without an active PCB document (`documentType !== EDMT_EditorDocumentType.PCB`) → error/null
- Executing `SCH_*` APIs without an active Schematic document (`documentType !== EDMT_EditorDocumentType.SCHEMATIC_PAGE`) → error/null

### IFrame Context — Always Use `eda` Directly (CRITICAL)

When writing extension code that creates an iframe via `sys_IFrame.openIFrame()`, the JavaScript code inside the iframe's HTML can access the `eda` global **directly**. Do NOT use `window.parent.eda`.

**Why this matters:**
EasyEDA injects the `eda` object into the iframe's execution context automatically. Standard browser cross-frame patterns (`window.parent`, `parentWindow`, etc.) do NOT apply here and will fail.

```javascript
// WRONG: Using window.parent to reach parent frame's eda object
// This is a common mistake made by AI agents familiar with web iframe patterns
const project = await window.parent.eda.dmt_Project.getCurrentProjectInfo();

// CORRECT: eda is available directly in the iframe context
const project = await eda.dmt_Project.getCurrentProjectInfo();
```

**This applies to ALL code inside `sys_IFrame` iframes:**
- Extension UI panels loaded via `openIFrame()`
- Any HTML file inside the extension package displayed in an iframe

**Rule:** In EasyEDA extensions, whether code runs in the main context or inside an iframe created by `sys_IFrame`, always access the API through `eda.xxx` — never through `window.parent.eda` or any other parent frame accessor.

### Multi-Window Support

One editor window is one session: `lceda-pro session list` reports each window with its
origin (`user` / `cli`), project path and title. There is no global "active window" — the
`--session` you pass to `invoke` decides which window runs. Check the list on the first EDA
operation, and when a call reports the window is gone.

## Debugging Tips & Failure Strategies

### Troubleshooting

1. **Always run `lceda-pro doctor` first**: `connected: false` means no editor is running — ask the user to start EasyEDA Pro
2. **`INVALID_ARGS: cannot read <file>` on `--code-file`**: the path is resolved inside the client's sandbox, which sees only the home directory — pipe through stdin (`--code-file -`) instead
3. **Timeout errors**: Default 30s timeout. If timeout occurs:
   - Check if the correct project and document are opened (use `dmt_Project.getCurrentProjectInfo()`)
   - If no project is opened, use `dmt_Project.openProject(projectPath)` to open one
   - If no document is active, use `dmt_EditorControl.openDocument(docId)` to open the correct document type (PCB/Schematic)
   - If the document type is wrong (e.g., running PCB APIs on Schematic), switch to the correct document first
   - Complex operations may need code splitting
4. **Check return values**: Many methods return `null` on failure — always validate
5. **Layer numbers**: Use enums from `references/enums/` docs (e.g., `EPCB_LayerId`)
6. **Session gone**: If a call reports the window is gone, re-run `lceda-pro session list`; the user may have closed the window, or the editor restarted
7. **Permission errors**: All API interfaces are controlled by EDA's permission system. If a specific API consistently fails to execute (returns error or null) while other APIs work fine, and you've confirmed the call matches the documentation exactly, it may be **blocked by permissions** — not a code bug. The EDA client may restrict certain operations based on user license, project settings, or document state. Inform the user that the operation may require elevated permissions or a different EDA edition.
8. **Persistent errors?**: If you've verified the API call matches the documentation exactly, ruled out permission issues, and still encounter unexpected errors, consider reporting the issue through official EasyEDA support channels

### Failure Handling Rules

When developing extensions, follow these rules:

| Situation | Action |
|-----------|--------|
| API method does not exist in docs | **Stop immediately** — inform the user the API doesn't exist |
| Signature uncertain after reading docs | **Stop generation** — return to query step and re-read |
| Forbidden browser API detected | **Auto-replace** with `eda.sys_*` alternative |
| Menu ID conflict | Add prefix to differentiate (e.g., `my-plugin-home`, `my-plugin-sch`) |
| Permission blocked | Inform user — may require different EDA edition or license |

**Critical:** Never guess an API signature. If `references/classes/` doesn't document it, it doesn't exist for your use case.

## Workflow for AI Agent

When the user asks you to perform EDA operations:

1. **Probe** — `lceda-pro doctor`, then `lceda-pro session list` to pick the window
2. **Understand the task** — What domain? (PCB/SCH/LIB/Project)
3. **Confirm document type** — PCB operations need an active PCB, SCH operations an active Schematic; switch with `eda.dmt_EditorControl.openDocument(...)`
4. **Look up API** — `lceda-pro doc api --class-name <C> [--method-name <m>]`, or read `references/` for the same content offline
5. **Check types** — Read enum/interface docs for parameter types
6. **Write code to a file** — never inline a multi-line snippet in a shell argument
7. **Execute** — `lceda-pro invoke --session "$S" --ext-uuid eda --code-file - < step.js`, then check `ok`
8. **Verify on disk** — exports must exist as files before you report success
9. **Iterate** — If errors occur, read `error.code` / `error.message` and adjust

When unsure about an API:
- `lceda-pro doc api --class-name <C>` lists the methods; `--method-name <m>` prints the full signature and a runnable example
- Search `_quick-reference.md` for method names
- Check interface docs for complex parameter types

## Session Management

### Sessions you opened

Close every session you opened once its work is done, so windows do not pile up:

```bash
lceda-pro session close --session "$S" --destroy
```

Sessions the user opened are rejected with `SESSION_NOT_OWNED` — that is expected, not an error to work around. Never `session abort` a user window; it discards unsaved edits.

### The legacy bridge

If you find a `bridge-server.mjs` process still running, it belongs to the superseded
WebSocket path. Ask the user before stopping it:

```bash
lsof -ti :49620 && kill "$(lsof -ti :49620)"
```

Do NOT stop it automatically — another session may still be driving the editor through it.
