/** Short sine blips pitched by value, the classic sorting-sound effect. */
let ctx: AudioContext | null = null
let lastAt = 0

export function blip(t: number, duration = 0.07) {
  try {
    ctx ??= new AudioContext()
    if (ctx.state === 'suspended') void ctx.resume()
    const now = ctx.currentTime
    if (now - lastAt < 0.012) return
    lastAt = now
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'triangle'
    osc.frequency.value = 180 + t * 1000
    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.exponentialRampToValueAtTime(0.08, now + 0.008)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration)
    osc.connect(gain).connect(ctx.destination)
    osc.start(now)
    osc.stop(now + duration + 0.02)
  } catch {
    /* audio unavailable */
  }
}
