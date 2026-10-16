// Web Audio API 기반 레트로 칩튠 사운드 & 사운드 이펙트 엔진
// 외부 사운드 파일 없이도 즉시 재생되는 100% 자립형 오디오 시스템

class SoundEngine {
  private ctx: AudioContext | null = null;
  private bgmGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private masterGain: GainNode | null = null;
  private isMuted: boolean = false;
  private currentBgmTrack: string | null = null;
  private bgmInterval: number | null = null;
  private bgmStep: number = 0;

  constructor() {
    // AudioContext는 사용자 인터랙션 후 초기화됨
  }

  public init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.bgmGain = this.ctx.createGain();
      this.sfxGain = this.ctx.createGain();

      this.masterGain.gain.setValueAtTime(0.5, this.ctx.currentTime);
      this.bgmGain.gain.setValueAtTime(0.35, this.ctx.currentTime);
      this.sfxGain.gain.setValueAtTime(0.5, this.ctx.currentTime);

      this.bgmGain.connect(this.masterGain);
      this.sfxGain.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);
    } catch (e) {
      console.warn("AudioContext init error:", e);
    }
  }

  public resume() {
    if (!this.ctx) {
      this.init();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.5, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  // 효과음 1: 점프 (퐁!)
  public playJump() {
    if (!this.ctx || this.isMuted || !this.sfxGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(260, now);
    osc.frequency.exponentialRampToValueAtTime(540, now + 0.12);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.12);
  }

  // 효과음 2: 공격 휘두르기 (슉!)
  public playAttackSwing() {
    if (!this.ctx || this.isMuted || !this.sfxGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.exponentialRampToValueAtTime(150, now + 0.08);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.08);
  }

  // 효과음 3: 타격 (퍽! 크리티컬)
  public playHit(isCrit: boolean = false) {
    if (!this.ctx || this.isMuted || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    // 노이즈 버퍼 타격음
    const bufferSize = this.ctx.sampleRate * 0.06;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(isCrit ? 1800 : 900, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(isCrit ? 0.6 : 0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.06);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(now);

    // 크리티컬 시 높은 톤 추가
    if (isCrit) {
      const osc = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(1320, now + 0.1);
      oscGain.gain.setValueAtTime(0.25, now);
      oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      osc.connect(oscGain);
      oscGain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.1);
    }
  }

  // 효과음 4: 스킬 발동 (샤라랑~ 별가루)
  public playSkill() {
    if (!this.ctx || this.isMuted || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const freqs = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    freqs.forEach((f, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const startTime = now + i * 0.04;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, startTime);

      gain.gain.setValueAtTime(0.25, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.15);

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(startTime);
      osc.stop(startTime + 0.15);
    });
  }

  // 효과음 5: 코인 / 아이템 획득 (챠링!)
  public playPickup() {
    if (!this.ctx || this.isMuted || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(987.77, now); // B5
    osc.frequency.setValueAtTime(1318.51, now + 0.06); // E6

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.18);
  }

  // 효과음 6: 레벨업 팡파레! (띠라라라랑~!)
  public playLevelUp() {
    if (!this.ctx || this.isMuted || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const notes = [
      { f: 523.25, t: 0.0 },
      { f: 659.25, t: 0.08 },
      { f: 783.99, t: 0.16 },
      { f: 1046.5, t: 0.24 },
      { f: 1318.51, t: 0.36 }
    ];
    notes.forEach((n) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(n.f, now + n.t);

      gain.gain.setValueAtTime(0.4, now + n.t);
      gain.gain.exponentialRampToValueAtTime(0.01, now + n.t + 0.25);

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(now + n.t);
      osc.stop(now + n.t + 0.25);
    });
  }

  // 효과음 7: UI 클릭 / 상호작용
  public playClick() {
    if (!this.ctx || this.isMuted || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.04);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.04);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.04);
  }

  // 효과음 8: 포탈 이동
  public playPortal() {
    if (!this.ctx || this.isMuted || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(350, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.25);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.25);
  }

  // 효과음 9: 퀘스트 완료 팡파레
  public playQuestComplete() {
    if (!this.ctx || this.isMuted || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const notes = [
      { f: 587.33, t: 0.0 }, // D5
      { f: 739.99, t: 0.1 }, // F#5
      { f: 880.00, t: 0.2 }, // A5
      { f: 1174.66, t: 0.35 } // D6
    ];
    notes.forEach((n) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(n.f, now + n.t);

      gain.gain.setValueAtTime(0.35, now + n.t);
      gain.gain.exponentialRampToValueAtTime(0.01, now + n.t + 0.3);

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(now + n.t);
      osc.stop(now + n.t + 0.3);
    });
  }

  // 테마별 감성적 8비트/16비트 BGM 시퀀서 (포근마을, 솜구름초원, 반짝숲, 달빛동굴, 별가루신전)
  public playBGM(trackName: string) {
    if (this.currentBgmTrack === trackName) return;
    this.stopBGM();
    this.currentBgmTrack = trackName;
    this.bgmStep = 0;

    // 음계 주파수 테이블 (C4 ~ C6)
    const N = {
      C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.00, A4: 440.00, B4: 493.88,
      C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.00, B5: 987.77,
      C6: 1046.50, REST: 0
    };

    // 맵별 멜로디 시퀀스
    let melody: number[] = [];
    let bass: number[] = [];
    let tempoMs = 220;

    if (trackName === 'korea') {
      // 한국풍 (달빛 기와마을): 정갈하고 포근한 국악 5음계 (C, D, E, G, A) 선율
      tempoMs = 240;
      melody = [
        N.E5, N.G5, N.A5, N.C6, N.A5, N.G5, N.E5, N.D5,
        N.E5, N.G5, N.E5, N.D5, N.C5, N.REST, N.D5, N.E5,
        N.G5, N.A5, N.C6, N.D5, N.E5, N.G5, N.A5, N.G5,
        N.E5, N.D5, N.C5, N.D5, N.C5, N.REST, N.C5, N.REST
      ];
      bass = [
        N.C4, N.REST, N.G4, N.REST, N.A4, N.REST, N.G4, N.REST,
        N.C4, N.REST, N.G4, N.REST, N.C4, N.REST, N.G4, N.REST,
        N.C4, N.REST, N.A4, N.REST, N.C4, N.REST, N.G4, N.REST,
        N.F4, N.REST, N.G4, N.REST, N.C4, N.REST, N.C4, N.REST
      ];
    } else {
      // 일본풍 (벚꽃 신사숲): 몽환적인 요자쿠라/미야코부시 벚꽃 선율
      tempoMs = 210;
      melody = [
        N.A4, N.C5, N.E5, N.F5, N.E5, N.C5, N.B4, N.A4,
        N.C5, N.E5, N.F5, N.A5, N.F5, N.E5, N.D5, N.E5,
        N.F5, N.E5, N.C5, N.B4, N.A4, N.B4, N.C5, N.E5,
        N.B4, N.C5, N.B4, N.G4, N.A4, N.REST, N.A4, N.REST
      ];
      bass = [
        N.A4, N.REST, N.E4, N.REST, N.F4, N.REST, N.E4, N.REST,
        N.A4, N.REST, N.F4, N.REST, N.D4, N.REST, N.E4, N.REST,
        N.F4, N.REST, N.C4, N.REST, N.A4, N.REST, N.E4, N.REST,
        N.G4, N.REST, N.E4, N.REST, N.A4, N.REST, N.A4, N.REST
      ];
    }

    const totalSteps = melody.length;

    this.bgmInterval = window.setInterval(() => {
      if (!this.ctx || this.isMuted || !this.bgmGain) return;
      const now = this.ctx.currentTime;
      const melFreq = melody[this.bgmStep];
      const bassFreq = bass[this.bgmStep];

      // 멜로디 (플루트/오르골 느낌의 사인파 + 약한 삼각파)
      if (melFreq > 0) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = trackName === 'temple' ? 'sawtooth' : 'sine';
        osc.frequency.setValueAtTime(melFreq, now);

        const dur = (tempoMs / 1000) * 0.9;
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + dur);

        osc.connect(gain);
        gain.connect(this.bgmGain);
        osc.start(now);
        osc.stop(now + dur);
      }

      // 베이스 (부드러운 펄스 삼각파)
      if (bassFreq > 0) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(bassFreq / 2, now);

        const dur = (tempoMs / 1000) * 0.8;
        gain.gain.setValueAtTime(0.22, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + dur);

        osc.connect(gain);
        gain.connect(this.bgmGain);
        osc.start(now);
        osc.stop(now + dur);
      }

      this.bgmStep = (this.bgmStep + 1) % totalSteps;
    }, tempoMs);
  }

  public stopBGM() {
    if (this.bgmInterval) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
    this.currentBgmTrack = null;
  }
}

export const sound = new SoundEngine();
