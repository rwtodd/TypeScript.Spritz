/// <reference path="./util.ts" />
/// <reference path="./spritz.ts" />

namespace Spritz {

	export function hashString(tgt: Uint8Array, src: string) {
		var cipher = new Spritz.Cipher()
		cipher.soak(Util.encodeUTF8(src))
		cipher.absorbStop()
		cipher.absorbNumber(tgt.length)
		cipher.squeeze(tgt)
	}

}