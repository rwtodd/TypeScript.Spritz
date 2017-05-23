namespace Spritz {
	export class Cipher {
		private mem: Uint8Array
		private i: number
		private j: number
		private k: number
		private z: number
		private a: number
		private w: number

		constructor() {
			this.reset()
		}

		// put the spritz obj in a ready state
		reset() {
			this.i = 0
			this.j = 0
			this.k = 0
			this.z = 0
			this.a = 0
			this.w = 1
			this.mem = new Uint8Array(256)
			for (var idx: number = 0; idx < 256; idx++) {
				this.mem[idx] = idx
			}
		}

		// swap two values.
		private memSwap(idx1: number, idx2: number) {
			var tmp = this.mem[idx1]
			this.mem[idx1] = this.mem[idx2]
			this.mem[idx2] = tmp
		}

		private crush() {
			for (var v: number = 0; v < 128; v++) {
				if (this.mem[v] > this.mem[255 - v]) {
					this.memSwap(v, 255 - v);
				}
			}
		}

		private update(times: number) {
			var mi: number = this.i
			var mj: number = this.j
			var mk: number = this.k
			var mw: number = this.w

			while (times-- > 0) {
				mi = (mi + mw) & 0xFF
				mj = (mk + this.mem[(mj + this.mem[mi]) & 0xFF]) & 0xFF
				mk = (mi + mk + this.mem[mj]) & 0xFF
				this.memSwap(mi, mj)
			}

			// store the final values back into our state
			this.i = mi
			this.j = mj
			this.k = mk
		}

		private whip(amt: number) {
			this.update(amt)
			this.w = (this.w + 2) & 0xFF
		}


		private shuffle() {
			this.whip(512); this.crush();
			this.whip(512); this.crush();
			this.whip(512);
			this.a = 0
		}

		private absorbNibble(n: number) {
			if (this.a == 128) { this.shuffle() }
			this.memSwap(this.a, 128 + n);
			++this.a;
		}

		absorb(b: number) {
			this.absorbNibble(b & 0x0f);
			this.absorbNibble((b >> 4) & 0x0f);
		}

		absorbStop() {
			if (this.a == 128) { this.shuffle(); }
			++this.a;
		}

		absorbNumber(n: number) {
			if (n > 255) { this.absorbNumber(n >> 8); }
			this.absorb(n & 0xFF);
		}

		soak(src: Iterable<number>) : void;
		soak(src: Uint8Array) : void {
			for (var b of src) {
				this.absorb(b)
			}
		}

		private drip(): number {
			// NOTE! if a isn't zero the caller must call Shuffle first!
			this.update(1);
			this.z = this.mem[(this.j + this.mem[(this.i + this.mem[(this.z + this.k) & 0xFF]) & 0xFF]) & 0xFF];
			return this.z;
		}

		skip(amt: number) {
			if (this.a > 0) { this.shuffle(); }
			for (var v: number = 0; v < amt; ++v) {
				this.drip();
			}
		}

		squeeze(tgt: Uint8Array) {
			if (this.a > 0) { this.shuffle(); }
			for (var v: number = 0; v < tgt.length; ++v) {
				tgt[v] = this.drip();
			}
		}

		squeezeXOR(tgt: Uint8Array) {
			if (this.a > 0) { this.shuffle(); }
			for (var v: number = 0; v < tgt.length; ++v) {
				tgt[v] ^= this.drip();
			}
		}

	}
}