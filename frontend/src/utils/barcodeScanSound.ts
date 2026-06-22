let audioContext: AudioContext | null = null

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new AudioContext()
  }

  return audioContext
}

async function ensureRunningContext(): Promise<AudioContext | null> {
  try {
    const ctx = getAudioContext()

    if (ctx.state === 'suspended') {
      await ctx.resume()
    }

    return ctx.state === 'running' ? ctx : null
  } catch {
    return null
  }
}

type ToneSpec = {
  frequency: number
  start: number
  duration: number
  volume?: number
  type?: OscillatorType
}

function playTones(ctx: AudioContext, tones: ToneSpec[]): void {
  const now = ctx.currentTime

  for (const tone of tones) {
    const oscillator = ctx.createOscillator()
    const gain = ctx.createGain()
    const start = now + tone.start
    const duration = tone.duration
    const volume = tone.volume ?? 0.2

    oscillator.type = tone.type ?? 'sine'
    oscillator.frequency.setValueAtTime(tone.frequency, start)

    gain.gain.setValueAtTime(0, start)
    gain.gain.linearRampToValueAtTime(volume, start + 0.015)
    gain.gain.exponentialRampToValueAtTime(0.001, start + duration)

    oscillator.connect(gain)
    gain.connect(ctx.destination)

    oscillator.start(start)
    oscillator.stop(start + duration + 0.02)
  }
}

export async function unlockBarcodeScanSound(): Promise<void> {
  await ensureRunningContext()
}

/** Başarılı okutma — yükselen bildirim melodisi */
export async function playBarcodeScanSuccess(): Promise<boolean> {
  const ctx = await ensureRunningContext()
  if (!ctx) return false

  playTones(ctx, [
    { frequency: 659.25, start: 0, duration: 0.12, volume: 0.18 },
    { frequency: 830.61, start: 0.1, duration: 0.14, volume: 0.2 },
    { frequency: 987.77, start: 0.22, duration: 0.22, volume: 0.22 },
  ])

  return true
}

/** Daha önce okundu — çift uyarı tonu */
export async function playBarcodeScanWarning(): Promise<boolean> {
  const ctx = await ensureRunningContext()
  if (!ctx) return false

  playTones(ctx, [
    { frequency: 740, start: 0, duration: 0.14, volume: 0.2, type: 'triangle' },
    { frequency: 587.33, start: 0.2, duration: 0.18, volume: 0.2, type: 'triangle' },
  ])

  return true
}

/** Stokta yok — alçalan hata tonu */
export async function playBarcodeScanError(): Promise<boolean> {
  const ctx = await ensureRunningContext()
  if (!ctx) return false

  playTones(ctx, [
    { frequency: 330, start: 0, duration: 0.16, volume: 0.22, type: 'square' },
    { frequency: 220, start: 0.14, duration: 0.24, volume: 0.2, type: 'square' },
    { frequency: 165, start: 0.32, duration: 0.28, volume: 0.18, type: 'square' },
  ])

  return true
}

export async function playBarcodeScanFeedback(tone: 'success' | 'warning' | 'error'): Promise<boolean> {
  if (tone === 'warning') return playBarcodeScanWarning()
  if (tone === 'error') return playBarcodeScanError()
  return playBarcodeScanSuccess()
}
