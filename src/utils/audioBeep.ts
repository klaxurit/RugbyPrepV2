/**
 * Lightweight Web Audio cues — no asset download, generated at runtime.
 * Rest: countdown bip ×3 then whistle ; iso / EMOM use distinct patterns.
 */

type AudioContextCtor = typeof AudioContext

function getAudioContextCtor(): AudioContextCtor | null {
  if (typeof window === 'undefined') return null
  const w = window as unknown as { AudioContext?: AudioContextCtor; webkitAudioContext?: AudioContextCtor }
  return w.AudioContext ?? w.webkitAudioContext ?? null
}

let cachedCtx: AudioContext | null = null

function getCtx(): AudioContext | null {
  const Ctor = getAudioContextCtor()
  if (!Ctor) return null
  if (cachedCtx == null) {
    try {
      cachedCtx = new Ctor()
    } catch {
      return null
    }
  }
  if (cachedCtx.state === 'suspended') {
    cachedCtx.resume().catch(() => {})
  }
  return cachedCtx
}

/** Single short countdown bip (~120ms) — T−3 / T−2 / T−1 before rest end. */
export function playCountdownBeep() {
  const ctx = getCtx()
  if (!ctx) return
  try {
    playTone(ctx, 980, ctx.currentTime, 0.12, 0.28)
  } catch {
    // ignore
  }
}

/**
 * Synthetic whistle (~450ms) — end of rest / « go ».
 * Noise burst + high sweep, louder than the old two-tone beep.
 */
export function playRestEndWhistle() {
  const ctx = getCtx()
  if (!ctx) return
  try {
    const now = ctx.currentTime
    const duration = 0.45

    // Band-limited noise for breathy whistle body.
    const sampleCount = Math.max(1, Math.floor(ctx.sampleRate * duration))
    const buffer = ctx.createBuffer(1, sampleCount, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < sampleCount; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.55
    }
    const noise = ctx.createBufferSource()
    noise.buffer = buffer
    const noiseFilter = ctx.createBiquadFilter()
    noiseFilter.type = 'bandpass'
    noiseFilter.frequency.setValueAtTime(2400, now)
    noiseFilter.frequency.linearRampToValueAtTime(3200, now + duration)
    noiseFilter.Q.value = 8
    const noiseGain = ctx.createGain()
    noiseGain.gain.setValueAtTime(0, now)
    noiseGain.gain.linearRampToValueAtTime(0.35, now + 0.02)
    noiseGain.gain.linearRampToValueAtTime(0, now + duration)
    noise.connect(noiseFilter).connect(noiseGain).connect(ctx.destination)
    noise.start(now)
    noise.stop(now + duration + 0.02)

    // Piercing tone on top.
    const osc = ctx.createOscillator()
    const oscGain = ctx.createGain()
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(2200, now)
    osc.frequency.linearRampToValueAtTime(2800, now + duration)
    oscGain.gain.setValueAtTime(0, now)
    oscGain.gain.linearRampToValueAtTime(0.22, now + 0.015)
    oscGain.gain.linearRampToValueAtTime(0, now + duration)
    osc.connect(oscGain).connect(ctx.destination)
    osc.start(now)
    osc.stop(now + duration + 0.02)
  } catch {
    // ignore audio failures (autoplay policy, locked context, etc.)
  }
}

/**
 * End-of-rest / EMOM boundary cue — whistle (replaces the old soft bip-bip).
 */
export function playRestEndBeep() {
  playRestEndWhistle()
}

/**
 * Single short low tone (~150ms) — halfway signal during a per-side iso
 * countdown ("switch sides"). Distinct from the end-of-rest pattern so
 * the user can tell them apart without looking at the screen.
 */
export function playSideSwitchBeep() {
  const ctx = getCtx()
  if (!ctx) return
  try {
    playTone(ctx, 660, ctx.currentTime, 0.15)
  } catch {
    // ignore
  }
}

/**
 * Triple ascending beep (~480ms) — signals end of an iso set ("done"),
 * distinct from end-of-rest so the user knows the set itself is over.
 */
export function playSetEndBeep() {
  const ctx = getCtx()
  if (!ctx) return
  try {
    const now = ctx.currentTime
    playTone(ctx, 660, now, 0.12)
    playTone(ctx, 880, now + 0.16, 0.12)
    playTone(ctx, 1175, now + 0.32, 0.18)
  } catch {
    // ignore
  }
}

function playTone(
  ctx: AudioContext,
  frequency: number,
  startAt: number,
  durationSec: number,
  peakGain = 0.25,
) {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.value = frequency
  // Quick attack/release envelope to avoid clicks.
  gain.gain.setValueAtTime(0, startAt)
  gain.gain.linearRampToValueAtTime(peakGain, startAt + 0.01)
  gain.gain.linearRampToValueAtTime(0, startAt + durationSec)
  osc.connect(gain).connect(ctx.destination)
  osc.start(startAt)
  osc.stop(startAt + durationSec + 0.02)
}
