/**
 * Lightweight Web Audio beep — no asset download, generated at runtime.
 * Used to signal end-of-rest in the workout session overlay.
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

/**
 * Play a short two-tone "bip-bip" (~440ms total) signaling end of rest.
 * No-op when AudioContext is unavailable or fails.
 */
export function playRestEndBeep() {
  const ctx = getCtx()
  if (!ctx) return
  try {
    const now = ctx.currentTime
    playTone(ctx, 880, now, 0.18)
    playTone(ctx, 1175, now + 0.22, 0.22)
  } catch {
    // ignore audio failures (autoplay policy, locked context, etc.)
  }
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

function playTone(ctx: AudioContext, frequency: number, startAt: number, durationSec: number) {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.value = frequency
  // Quick attack/release envelope to avoid clicks.
  gain.gain.setValueAtTime(0, startAt)
  gain.gain.linearRampToValueAtTime(0.25, startAt + 0.01)
  gain.gain.linearRampToValueAtTime(0, startAt + durationSec)
  osc.connect(gain).connect(ctx.destination)
  osc.start(startAt)
  osc.stop(startAt + durationSec + 0.02)
}
