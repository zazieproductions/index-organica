// AGON // SIGNAL ENGINE — the acoustic organ of the archive.
// A Web Audio synthesis core: three drifting oscillators, a noise bed,
// a screaming resonant filter, an LFO, a waveshaper and a limiter.
// Nothing sounds until the operator touches the machine (autoplay law).

export type WaveKind = "sine" | "triangle" | "sawtooth" | "square";

export interface EngineParams {
  wave: WaveKind;
  root: number; // base frequency, Hz
  spread: number; // detune spread, cents
  cutoff: number; // filter cutoff, Hz
  res: number; // filter resonance (Q)
  lfoRate: number; // Hz
  lfoDepth: number; // 0..1 of cutoff
  drive: number; // 0..1 waveshaper amount
  noise: number; // 0..1 noise bed level
  volume: number; // 0..1 master
}

export const DEFAULT_PARAMS: EngineParams = {
  wave: "sawtooth",
  root: 55,
  spread: 9,
  cutoff: 900,
  res: 8,
  lfoRate: 0.35,
  lfoDepth: 0.55,
  drive: 0.35,
  noise: 0.12,
  volume: 0.35,
};

// Pentatonic-ish ladder the number keys climb.
const SCALE = [1, 9 / 8, 6 / 5, 3 / 2, 8 / 5, 9 / 5, 2, 12 / 5];

function makeDriveCurve(amount: number): Float32Array<ArrayBuffer> {
  const k = amount * 40 + 1;
  const n = 1024;
  const curve = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const x = (i / (n - 1)) * 2 - 1;
    curve[i] = ((1 + k) * x) / (1 + k * Math.abs(x));
  }
  return curve as Float32Array<ArrayBuffer>;
}

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private oscs: OscillatorNode[] = [];
  private oscGain: GainNode | null = null;
  private noiseSrc: AudioBufferSourceNode | null = null;
  private noiseGain: GainNode | null = null;
  private shaper: WaveShaperNode | null = null;
  private filter: BiquadFilterNode | null = null;
  private lfo: OscillatorNode | null = null;
  private lfoGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private limiter: DynamicsCompressorNode | null = null;
  private master: GainNode | null = null;
  private blipBus: GainNode | null = null;

  params: EngineParams = { ...DEFAULT_PARAMS };
  running = false;

  /** Must be called from a user gesture. Idempotent. */
  async start(): Promise<void> {
    if (this.running && this.ctx) {
      if (this.ctx.state === "suspended") await this.ctx.resume();
      return;
    }
    const ctx = new AudioContext();
    this.ctx = ctx;
    if (ctx.state === "suspended") await ctx.resume();

    const p = this.params;

    this.master = ctx.createGain();
    this.master.gain.value = 0;

    this.limiter = ctx.createDynamicsCompressor();
    this.limiter.threshold.value = -18;
    this.limiter.knee.value = 12;
    this.limiter.ratio.value = 16;
    this.limiter.attack.value = 0.002;
    this.limiter.release.value = 0.24;

    this.analyser = ctx.createAnalyser();
    this.analyser.fftSize = 2048;
    this.analyser.smoothingTimeConstant = 0.78;

    this.filter = ctx.createBiquadFilter();
    this.filter.type = "lowpass";
    this.filter.frequency.value = p.cutoff;
    this.filter.Q.value = p.res;

    this.shaper = ctx.createWaveShaper();
    this.shaper.curve = makeDriveCurve(p.drive);
    this.shaper.oversample = "2x";

    this.oscGain = ctx.createGain();
    this.oscGain.gain.value = 0.28;

    // three detuned voices
    this.oscs = [-1, 0, 1].map((d) => {
      const o = ctx.createOscillator();
      o.type = p.wave;
      o.frequency.value = p.root * (d === 1 ? 2 : 1); // one voice an octave up
      o.detune.value = d * p.spread;
      o.connect(this.oscGain!);
      o.start();
      return o;
    });

    // noise bed
    const len = ctx.sampleRate * 2;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      // pinkish noise via leaky integrator
      last = last * 0.96 + (Math.random() * 2 - 1) * 0.04;
      data[i] = last * 8;
    }
    this.noiseSrc = ctx.createBufferSource();
    this.noiseSrc.buffer = buf;
    this.noiseSrc.loop = true;
    this.noiseGain = ctx.createGain();
    this.noiseGain.gain.value = p.noise * 0.4;
    this.noiseSrc.connect(this.noiseGain);
    this.noiseSrc.start();

    // LFO -> filter cutoff
    this.lfo = ctx.createOscillator();
    this.lfo.type = "sine";
    this.lfo.frequency.value = p.lfoRate;
    this.lfoGain = ctx.createGain();
    this.lfoGain.gain.value = p.lfoDepth * p.cutoff * 0.8;
    this.lfo.connect(this.lfoGain);
    this.lfoGain.connect(this.filter.frequency);
    this.lfo.start();

    // blip bus joins after the shaper, before the filter
    this.blipBus = ctx.createGain();
    this.blipBus.gain.value = 1;

    this.oscGain.connect(this.shaper);
    this.noiseGain.connect(this.shaper);
    this.shaper.connect(this.filter);
    this.blipBus.connect(this.filter);
    this.filter.connect(this.analyser);
    this.analyser.connect(this.limiter);
    this.limiter.connect(this.master);
    this.master.connect(ctx.destination);

    // fade in gently — the machine wakes up, it does not detonate
    this.master.gain.setValueAtTime(0, ctx.currentTime);
    this.master.gain.linearRampToValueAtTime(p.volume * 0.5, ctx.currentTime + 1.4);

    this.running = true;
  }

  async stop(): Promise<void> {
    if (!this.ctx) return;
    const ctx = this.ctx;
    this.master?.gain.cancelScheduledValues(ctx.currentTime);
    this.master?.gain.setTargetAtTime(0, ctx.currentTime, 0.12);
    this.running = false;
    await new Promise((r) => setTimeout(r, 450));
    try {
      await ctx.close();
    } catch {
      /* already closed */
    }
    this.ctx = null;
    this.oscs = [];
  }

  set<K extends keyof EngineParams>(key: K, value: EngineParams[K]): void {
    this.params[key] = value;
    const ctx = this.ctx;
    if (!ctx || !this.running) return;
    const t = ctx.currentTime;
    const p = this.params;
    switch (key) {
      case "wave":
        this.oscs.forEach((o) => (o.type = p.wave));
        break;
      case "root":
        this.oscs.forEach((o, i) => o.frequency.setTargetAtTime(p.root * (i === 2 ? 2 : 1), t, 0.08));
        break;
      case "spread":
        this.oscs.forEach((o, i) => o.detune.setTargetAtTime((i - 1) * p.spread, t, 0.05));
        break;
      case "cutoff":
        this.filter?.frequency.setTargetAtTime(p.cutoff, t, 0.05);
        if (this.lfoGain) this.lfoGain.gain.setTargetAtTime(p.lfoDepth * p.cutoff * 0.8, t, 0.1);
        break;
      case "res":
        this.filter?.Q.setTargetAtTime(p.res, t, 0.05);
        break;
      case "lfoRate":
        this.lfo?.frequency.setTargetAtTime(p.lfoRate, t, 0.05);
        break;
      case "lfoDepth":
        this.lfoGain?.gain.setTargetAtTime(p.lfoDepth * p.cutoff * 0.8, t, 0.1);
        break;
      case "drive":
        if (this.shaper) this.shaper.curve = makeDriveCurve(p.drive);
        break;
      case "noise":
        this.noiseGain?.gain.setTargetAtTime(p.noise * 0.4, t, 0.1);
        break;
      case "volume":
        this.master?.gain.setTargetAtTime(p.volume * 0.5, t, 0.06);
        break;
    }
  }

  /** Short percussive transmission — used by MUTATE / REGEN / number keys. */
  blip(degree = 0, accent = false): void {
    const ctx = this.ctx;
    if (!ctx || !this.running || !this.blipBus) return;
    const t = ctx.currentTime;
    const f = this.params.root * 4 * SCALE[((degree % SCALE.length) + SCALE.length) % SCALE.length];
    const o = ctx.createOscillator();
    o.type = accent ? "square" : "triangle";
    o.frequency.setValueAtTime(f * (accent ? 2 : 1), t);
    o.frequency.exponentialRampToValueAtTime(Math.max(30, f * 0.5), t + 0.28);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(accent ? 0.5 : 0.3, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + (accent ? 0.5 : 0.3));
    o.connect(g);
    g.connect(this.blipBus);
    o.start(t);
    o.stop(t + 0.6);
    o.onended = () => {
      o.disconnect();
      g.disconnect();
    };
  }

  /** Slow theme-shift glide — the drone re-tunes itself when the archive mutates. */
  retune(themeIndex: number): void {
    const roots = [55, 49, 61.74, 41.2, 65.41, 46.25, 58.27, 51.91];
    const root = roots[themeIndex % roots.length];
    this.set("root", root);
  }

  getWave(buf: Float32Array<ArrayBuffer>): boolean {
    if (!this.analyser || !this.running) return false;
    this.analyser.getFloatTimeDomainData(buf);
    return true;
  }

  getSpectrum(buf: Uint8Array<ArrayBuffer>): boolean {
    if (!this.analyser || !this.running) return false;
    this.analyser.getByteFrequencyData(buf);
    return true;
  }
}

// One engine per document. It is a singleton because the machine is singular.
export const engine = new AudioEngine();
