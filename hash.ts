/// <reference path="./util.ts" />
/// <reference path="./spritz.ts" />

namespace Spritz {
	export class Hash {
		private static hashCipher(tgt: Uint8Array, ciph: Cipher): void {
			ciph.absorbStop()
			ciph.absorbNumber(tgt.length)
			ciph.squeeze(tgt)
		}
		static ofString(tgt: Uint8Array, src: string): void {
			var cipher = new Spritz.Cipher()
			cipher.soak(Util.encodeUTF8(src))
			this.hashCipher(tgt, cipher)
		}
		static ofArray(tgt: Uint8Array, src: Uint8Array): void {
			var cipher = new Spritz.Cipher()
			cipher.soak(src)
			this.hashCipher(tgt, cipher)
		}
	}
}