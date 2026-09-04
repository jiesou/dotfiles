import { createRequire } from "node:module";
import fs from "node:fs";
import util from "node:util";
//#region node_modules/.pnpm/koffi@3.1.6/node_modules/koffi/src/koffi/src/static.js
const require = createRequire(import.meta.url);
function loadStatic(pkg) {
	let native = null;
	if (pkg == "linux-arm64") try {
		native = require("@koromix/koffi-linux-arm64");
	} catch (err) {}
	if (pkg == "linux-ia32") try {
		native = require("@koromix/koffi-linux-ia32");
	} catch (err) {}
	if (pkg == "linux-x64") try {
		native = require("@koromix/koffi-linux-x64");
	} catch (err) {}
	if (pkg == "linux-riscv64") try {
		native = require("@koromix/koffi-linux-riscv64");
	} catch (err) {}
	if (pkg == "freebsd-ia32") try {
		native = require("@koromix/koffi-freebsd-ia32");
	} catch (err) {}
	if (pkg == "freebsd-x64") try {
		native = require("@koromix/koffi-freebsd-x64");
	} catch (err) {}
	if (pkg == "freebsd-arm64") try {
		native = require("@koromix/koffi-freebsd-arm64");
	} catch (err) {}
	if (pkg == "openbsd-ia32") try {
		native = require("@koromix/koffi-openbsd-ia32");
	} catch (err) {}
	if (pkg == "openbsd-x64") try {
		native = require("@koromix/koffi-openbsd-x64");
	} catch (err) {}
	if (pkg == "win32-ia32") try {
		native = require("@koromix/koffi-win32-ia32");
	} catch (err) {}
	if (pkg == "win32-x64") try {
		native = require("@koromix/koffi-win32-x64");
	} catch (err) {}
	if (pkg == "win32-arm64") try {
		native = require("@koromix/koffi-win32-arm64");
	} catch (err) {}
	if (pkg == "darwin-x64") try {
		native = require("@koromix/koffi-darwin-x64");
	} catch (err) {}
	if (pkg == "darwin-arm64") try {
		native = require("@koromix/koffi-darwin-arm64");
	} catch (err) {}
	if (pkg == "linux-loong64") try {
		native = require("@koromix/koffi-linux-loong64");
	} catch (err) {}
	return native;
}
//#endregion
//#region node_modules/.pnpm/koffi@3.1.6/node_modules/koffi/src/koffi/index.js
var __knownSymbol = (name, symbol) => (symbol = Symbol[name]) ? symbol : /* @__PURE__ */ Symbol.for("Symbol." + name);
var __typeError = (msg) => {
	throw TypeError(msg);
};
var __using = (stack, value, async) => {
	if (value != null) {
		if (typeof value !== "object" && typeof value !== "function") __typeError("Object expected");
		var dispose, inner;
		if (async) dispose = value[__knownSymbol("asyncDispose")];
		if (dispose === void 0) {
			dispose = value[__knownSymbol("dispose")];
			if (async) inner = dispose;
		}
		if (typeof dispose !== "function") __typeError("Object not disposable");
		if (inner) dispose = function() {
			try {
				inner.call(this);
			} catch (e) {
				return Promise.reject(e);
			}
		};
		stack.push([
			async,
			dispose,
			value
		]);
	} else if (async) stack.push([async]);
	return value;
};
var __callDispose = (stack, error, hasError) => {
	var E = typeof SuppressedError === "function" ? SuppressedError : function(e, s, m, _) {
		return _ = Error(m), _.name = "SuppressedError", _.error = e, _.suppressed = s, _;
	};
	var fail = (e) => error = hasError ? new E(e, error, "An error was suppressed during disposal") : (hasError = true, e);
	var next = (it) => {
		while (it = stack.pop()) try {
			var result = it[1] && it[1].call(it[2]);
			if (it[0]) return Promise.resolve(result).then(next, (e) => (fail(e), next()));
		} catch (e) {
			fail(e);
		}
		if (hasError) throw error;
	};
	return next();
};
function determineAbi() {
	let abi = process.arch.toString();
	if (abi == "riscv32" || abi == "riscv64") {
		var _stack = [];
		try {
			switch (readElfHeader(__using(_stack, openFile(process.execPath, "r"))).e_flags & 6) {
				case 0: break;
				case 2:
					abi += "f";
					break;
				case 4:
					abi += "d";
					break;
				case 6: abi += "q";
			}
		} catch (_) {
			var _error = _, _hasError = true;
		} finally {
			__callDispose(_stack, _error, _hasError);
		}
	} else if (abi == "arm") {
		var _stack2 = [];
		try {
			let header = readElfHeader(__using(_stack2, openFile(process.execPath, "r")));
			if (header.e_flags & 1024) abi += "hf";
			else if (header.e_flags & 512) abi += "sf";
			else throw new Error("Unknown ARM floating-point ABI");
		} catch (_2) {
			var _error2 = _2, _hasError2 = true;
		} finally {
			__callDispose(_stack2, _error2, _hasError2);
		}
	}
	return abi;
}
function readElfHeader(file, offset = 0) {
	let buf = file.read(offset, 512);
	if (buf.length < 16) throw new Error("Truncated header");
	if (buf[0] != 127 || buf[1] != 69 || buf[2] != 76 || buf[3] != 70) throw new Error("Invalid magic number");
	if (buf[6] != 1) throw new Error("Invalid ELF version");
	if (buf[5] != 1) throw new Error("Big-endian architectures are not supported");
	switch (buf[4]) {
		case 1:
			if (buf.length < 68) throw new Error("Truncated ELF header");
			return {
				ei_class: 32,
				e_machine: buf.readUInt16LE(18),
				e_flags: buf.readUInt32LE(36),
				e_phoff: buf.readUInt32LE(28),
				e_phentsize: buf.readUInt16LE(42),
				e_phnum: buf.readUInt16LE(44)
			};
		case 2:
			if (buf.length < 120) throw new Error("Truncated ELF header");
			return {
				ei_class: 64,
				e_machine: buf.readUInt16LE(18),
				e_flags: buf.readUInt32LE(48),
				e_phoff: buf.readBigUInt64LE(32),
				e_phentsize: buf.readUInt16LE(54),
				e_phnum: buf.readUInt16LE(56)
			};
		default: throw new Error("Invalid ELF class");
	}
}
function openFile(filename, flags) {
	return new FileHandle(fs.openSync(filename, flags));
}
var FileHandle = class {
	constructor(fd) {
		this.fd = fd;
	}
	close() {
		fs.closeSync(this.fd);
	}
	[Symbol.dispose]() {
		fs.closeSync(this.fd);
	}
	read(offset, len) {
		let buf = Buffer.allocUnsafe(len);
		let read = fs.readSync(this.fd, buf, 0, len, offset);
		return buf.subarray(0, read);
	}
};
var package_default = {
	name: "koffi",
	version: "3.1.6",
	cnoke: {
		api: "../../vendor/node-api-headers",
		output: "../../bin/Koffi/{{ toolchain }}",
		node: 16,
		napi: 8
	}
};
var require2 = createRequire(import.meta.url);
function detectPlatform() {
	if (process.versions.napi == null || process.versions.napi < package_default.cnoke.napi) {
		let major = parseInt(process.versions.node, 10);
		throw new Error(`This engine is based on Node ${process.versions.node}, but ${package_default.name} does not support the Node ${major}.x branch (Node-API < ${package_default.cnoke.napi})`);
	}
	let abi = determineAbi();
	let pkg2 = `${process.platform}-${process.arch}`;
	let triplets2 = [`${process.platform}_${abi}`];
	if (process.platform == "linux") triplets2.push(`musl_${abi}`);
	return [
		package_default.version,
		pkg2,
		triplets2
	];
}
function loadDynamic(dirname, pkg2, triplets2) {
	let roots = [dirname + "/../../build/koffi"];
	let native2 = null;
	let err = null;
	if (process["resourcesPath"] != null) for (let suffix2 of [
		"/koffi",
		"/koffi/build",
		"/node_modules/koffi/build"
	]) roots.push(process["resourcesPath"] + suffix2);
	let names = [`${import.meta.dirname}/../../../@koromix/koffi-${pkg2}`, ...triplets2.flatMap((triplet) => roots.map((dir) => `${dir}/${triplet}/koffi.node`))];
	for (let name of names) {
		if (!fs.existsSync(name)) continue;
		try {
			native2 = require2(name);
			break;
		} catch (e) {
			err ??= e;
		}
	}
	if (native2 == null && err != null) throw err;
	return native2;
}
function wrapNative(native2, version2) {
	if (native2 == null) throw new Error("Cannot find the native Koffi module; did you bundle it correctly?");
	if (native2.version != version2) throw new Error("Mismatched native Koffi modules");
	let load = native2.load;
	let register = native2.register;
	let introspect = native2.introspect ?? native2.type;
	native2.sizeof = (spec) => introspect(spec).size;
	native2.alignof = (spec) => introspect(spec).alignment;
	native2.offsetof = (spec, name) => {
		let info = introspect(spec);
		if (info.primitive != "Record") throw new TypeError("The offsetof() function can only be used with record types");
		let member = info.members[name];
		if (member == null) throw new Error(`Record type ${info.name} does not have member '${name}'`);
		return member.offset;
	};
	native2.register = (...args) => {
		if (args.length >= 3 && typeof args[1] == "function") {
			process.emitWarning("Using koffi.register() with a custom this value was deprecated in Koffi 2.17, use function.bind() instead", "DeprecationWarning", "KOFFI009");
			args[1] = args[1].bind(args[0]);
			args = args.slice(1);
		}
		return register(...args);
	};
	native2.load = (...args) => {
		let lib = load(...args);
		lib.cdecl = util.deprecate((...args2) => lib.func("__cdecl", ...args2), "The koffi.cdecl() function was deprecated in Koffi 2.7, use koffi.func(...) instead", "KOFFI003");
		lib.stdcall = util.deprecate((...args2) => lib.func("__stdcall", ...args2), "The koffi.stdcall() function was deprecated in Koffi 2.7, use koffi.func(\"__stdcall\", ...) instead", "KOFFI004");
		lib.fastcall = util.deprecate((...args2) => lib.func("__fastcall", ...args2), "The koffi.fastcall() function was deprecated in Koffi 2.7, use koffi.func(\"__fastcall\", ...) instead", "KOFFI005");
		lib.thiscall = util.deprecate((...args2) => lib.func("__thiscall", ...args2), "The koffi.thiscall() function was deprecated in Koffi 2.7, use koffi.func(\"__thiscall\", ...) instead", "KOFFI006");
		return lib;
	};
	if (native2.introspect == null) {
		native2.resolve = util.deprecate(native2.type, "The koffi.resolve() function was deprecated in Koffi 3.0, use koffi.type() instead", "KOFFI007");
		native2.introspect = util.deprecate(native2.type, "The koffi.introspect() function was deprecated in Koffi 3.0, use koffi.type() instead", "KOFFI008");
	} else native2.resolve = native2.type;
}
var [version, pkg, triplets] = detectPlatform();
var native = loadStatic(pkg) ?? loadDynamic(import.meta.dirname, pkg, triplets);
wrapNative(native, version);
native.LibraryHandle;
native.TypeObject;
native.Union;
native.address;
native.alias;
native.alignof;
native.alloc;
native.array;
native.as;
native.call;
native.config;
native.decode;
native.disposable;
native.encode;
native.enumeration;
native.errno;
native.extension;
native.free;
native.in;
native.inout;
native.introspect;
native.load;
native.node;
native.offsetof;
native.opaque;
native.os;
native.out;
native.pack;
native.pointer;
native.proto;
native.register;
native.reset;
native.resolve;
native.sizeof;
native.stats;
native.struct;
native.type;
native.types;
native.union;
native.unregister;
native.version;
native.view;
var index_default = native;
//#endregion
export { index_default as default };
