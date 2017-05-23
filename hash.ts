/// <reference path="./util.ts" />
/// <reference path="./spritz.ts" />

namespace Spritz {

	function hashCipher(tgt: Uint8Array, ciph: Cipher) : void {
		ciph.absorbStop()
		ciph.absorbNumber(tgt.length)
		ciph.squeeze(tgt)
	}
	export function hashString(tgt: Uint8Array, src: string) : void {
		var cipher = new Spritz.Cipher()
		cipher.soak(Util.encodeUTF8(src))
		hashCipher(tgt, cipher)
	}
	export function hashArray(tgt: Uint8Array, src: Uint8Array) : void {
		var cipher = new Spritz.Cipher()
		cipher.soak(src)
		hashCipher(tgt, cipher)
	}
}