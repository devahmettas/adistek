let audioContext: AudioContext | null = null
let audioUnlocked = false

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new AudioContext()
  }

  return audioContext
}

export async function unlockKitchenNotificationSound(): Promise<void> {
  const ctx = getAudioContext()

  if (ctx.state === 'suspended') {
    await ctx.resume()
  }

  audioUnlocked = true
}

export function isKitchenNotificationSoundUnlocked(): boolean {
  return audioUnlocked
}

export async function playKitchenNotificationSound(): Promise<boolean> {
  try {
    const ctx = getAudioContext()

    if (ctx.state === 'suspended') {
      await ctx.resume()
    }

    if (ctx.state !== 'running') {
      return false
    }

    const now = ctx.currentTime

    const playTone = (frequency: number, start: number, duration: number, volume = 0.18) => {
      const oscillator = ctx.createOscillator()
      const gain = ctx.createGain()

      oscillator.type = 'sine'
      oscillator.frequency.setValueAtTime(frequency, start)

      gain.gain.setValueAtTime(0, start)
      gain.gain.linearRampToValueAtTime(volume, start + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.001, start + duration)

      oscillator.connect(gain)
      gain.connect(ctx.destination)

      oscillator.start(start)
      oscillator.stop(start + duration)
    }

    playTone(880, now, 0.18)
    playTone(1174.66, now + 0.14, 0.22)
    playTone(880, now + 0.34, 0.18)

    audioUnlocked = true
    return true
  } catch {
    return false
  }
}
