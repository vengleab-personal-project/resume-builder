/**
 * Audio plumbing for the live interview: capture the microphone as 16 kHz PCM
 * and turn the model's 24 kHz PCM back into something a browser can play.
 *
 * Gemini Live speaks raw little-endian 16-bit PCM in both directions, with no
 * container. Anything else a browser can record or play has to be converted at
 * this boundary.
 */

/**
 * Runs inside an AudioWorklet, off the main thread. Takes whatever rate the
 * device captures at (usually 44.1 or 48 kHz), resamples to the target rate by
 * linear interpolation, and posts 100 ms Int16 blocks.
 *
 * A string rather than a file so there is no static asset to keep in step with
 * the hook, and so it loads from a Blob URL with no extra route.
 */
export const CAPTURE_WORKLET_SOURCE = `
class PcmCapture extends AudioWorkletProcessor {
  constructor(options) {
    super();
    const target = options.processorOptions.targetRate;
    this.ratio = sampleRate / target;
    this.blockSize = Math.round(target / 10);
    this.t = 0;
    this.tail = 0;
    this.out = new Int16Array(this.blockSize);
    this.n = 0;
  }
  process(inputs) {
    const channel = inputs[0] && inputs[0][0];
    if (!channel || channel.length === 0) return true;

    const x = new Float32Array(channel.length + 1);
    x[0] = this.tail;
    x.set(channel, 1);

    while (this.t + 1 < x.length) {
      const i0 = Math.floor(this.t);
      const f = this.t - i0;
      const v = Math.max(-1, Math.min(1, x[i0] * (1 - f) + x[i0 + 1] * f));
      this.out[this.n++] = v < 0 ? v * 0x8000 : v * 0x7fff;
      if (this.n === this.blockSize) {
        this.port.postMessage(this.out.buffer, [this.out.buffer]);
        this.out = new Int16Array(this.blockSize);
        this.n = 0;
      }
      this.t += this.ratio;
    }
    this.t -= x.length - 1;
    this.tail = x[x.length - 1];
    return true;
  }
}
registerProcessor('pcm-capture', PcmCapture);
`;

/** Int16 PCM bytes to base64, in slices so a large block cannot blow the call stack. */
export function pcmToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}

/** Base64 Int16 PCM to the Float32 samples Web Audio plays. */
export function base64ToFloat32(base64: string): Float32Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);

  const samples = new Int16Array(bytes.buffer, 0, Math.floor(bytes.byteLength / 2));
  const out = new Float32Array(samples.length);
  for (let i = 0; i < samples.length; i += 1) out[i] = samples[i] / 0x8000;
  return out;
}
