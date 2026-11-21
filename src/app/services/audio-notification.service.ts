import { Injectable } from '@angular/core';
import { Haptics, NotificationType } from '@capacitor/haptics';

@Injectable({
  providedIn: 'root'
})
export class AudioNotificationService {
  private audioCtx: AudioContext | null = null;

  constructor() {}

  private getAudioContext(): AudioContext | null {
    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtxClass) return null;
      if (!this.audioCtx || this.audioCtx.state === 'closed') {
        this.audioCtx = new AudioCtxClass();
      }
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      return this.audioCtx;
    } catch {
      return null;
    }
  }

  /**
   * Mainkan nada lonceng / chime notifikasi yang jernih dan ramah di telinga.
   * Menggunakan Web Audio API synthesizer murni (100% offline & tanpa dependensi file eksternal).
   */
  async playNotificationChime(): Promise<void> {
    try {
      // 1. Getar haptic notification di Android
      try {
        await Haptics.notification({ type: NotificationType.Success });
      } catch {}

      // 2. Putar nada melodi 3-tone (C5 -> E5 -> G5) dengan amplop lembut
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const notes = [
        { freq: 523.25, time: 0.0, duration: 0.15 }, // C5
        { freq: 659.25, time: 0.12, duration: 0.15 }, // E5
        { freq: 783.99, time: 0.24, duration: 0.35 }, // G5
      ];

      const startAt = ctx.currentTime + 0.05;

      for (const n of notes) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(n.freq, startAt + n.time);

        gain.gain.setValueAtTime(0.001, startAt + n.time);
        gain.gain.exponentialRampToValueAtTime(0.35, startAt + n.time + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, startAt + n.time + n.duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startAt + n.time);
        osc.stop(startAt + n.time + n.duration);
      }
    } catch (err) {
      console.warn('Audio notification warning:', err);
    }
  }
}
