// 데미지 팝업, 레벨업 팡파레, 타격 스파크, 환경 파티클 시스템

export interface DamageNumber {
  x: number;
  y: number;
  value: number;
  isCrit: boolean;
  isPlayerHurt: boolean;
  life: number;
  maxLife: number;
  vy: number;
  vx: number;
  alpha: number;
  scale: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  shape: 'circle' | 'star' | 'petal' | 'spark';
  life: number;
  maxLife: number;
  alpha: number;
  rotation: number;
  vRot: number;
}

export interface LevelUpBanner {
  x: number;
  y: number;
  life: number;
  maxLife: number;
}

export class ParticleSystem {
  public damageNumbers: DamageNumber[] = [];
  public particles: Particle[] = [];
  public levelUpBanners: LevelUpBanner[] = [];

  // 데미지 텍스트 팝업 (메이플 스타일)
  public addDamage(x: number, y: number, value: number, isCrit: boolean = false, isPlayerHurt: boolean = false) {
    this.damageNumbers.push({
      x: x + (Math.random() * 20 - 10),
      y: y - 10,
      value: Math.floor(value),
      isCrit,
      isPlayerHurt,
      life: 0.8,
      maxLife: 0.8,
      vy: isCrit ? -120 : -90,
      vx: (Math.random() * 2 - 1) * 20,
      alpha: 1.0,
      scale: isCrit ? 1.5 : 1.1
    });

    // 타격 파편 파티클
    this.addHitSparks(x, y, isCrit ? 10 : 5, isCrit ? '#FFD700' : '#FFF275');
  }

  // 타격 스파크
  public addHitSparks(x: number, y: number, count: number = 6, color: string = '#FFE066') {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 60 + Math.random() * 120;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 30,
        size: 3 + Math.random() * 4,
        color,
        shape: Math.random() > 0.4 ? 'star' : 'spark',
        life: 0.35 + Math.random() * 0.2,
        maxLife: 0.5,
        alpha: 1.0,
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 10
      });
    }
  }

  // 레벨업 팡파레
  public addLevelUp(x: number, y: number) {
    this.levelUpBanners.push({
      x,
      y: y - 40,
      life: 2.2,
      maxLife: 2.2
    });

    // 사방으로 뿜어져 나오는 황금 별빛 파티클
    for (let i = 0; i < 40; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 80 + Math.random() * 160;
      const colors = ['#FFD700', '#FFF3B0', '#FF85A1', '#70D6FF', '#FF9F1C'];
      this.particles.push({
        x,
        y: y - 20,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 80,
        size: 4 + Math.random() * 5,
        color: colors[Math.floor(Math.random() * colors.length)],
        shape: 'star',
        life: 1.2 + Math.random() * 0.8,
        maxLife: 2.0,
        alpha: 1.0,
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 8
      });
    }
  }

  // 발자국 / 흙먼지 파티클
  public addDust(x: number, y: number) {
    for (let i = 0; i < 3; i++) {
      this.particles.push({
        x: x + (Math.random() * 10 - 5),
        y: y,
        vx: (Math.random() - 0.5) * 30,
        vy: -15 - Math.random() * 20,
        size: 2 + Math.random() * 3,
        color: '#E6D5B8',
        shape: 'circle',
        life: 0.25,
        maxLife: 0.25,
        alpha: 0.8,
        rotation: 0,
        vRot: 0
      });
    }
  }

  // 환경 파티클 (벚꽃잎, 반딧불 등)
  public addAmbientParticle(x: number, y: number, theme: string) {
    if (this.particles.length > 120) return; // 파티클 과부하 방지

    let color = '#FFB5D5';
    let shape: 'circle' | 'star' | 'petal' = 'petal';
    let vy = 20 + Math.random() * 25;
    let vx = (Math.random() - 0.3) * 35;

    if (theme === 'cave') {
      color = '#7BF1A8'; // 반딧불이
      shape = 'circle';
      vy = -10 - Math.random() * 15;
      vx = (Math.random() - 0.5) * 20;
    } else if (theme === 'temple') {
      color = '#FFEA79'; // 별빛 가루
      shape = 'star';
      vy = -15 - Math.random() * 20;
      vx = (Math.random() - 0.5) * 15;
    }

    this.particles.push({
      x,
      y,
      vx,
      vy,
      size: 3 + Math.random() * 3,
      color,
      shape,
      life: 4.0 + Math.random() * 2.0,
      maxLife: 6.0,
      alpha: 0.8,
      rotation: Math.random() * Math.PI * 2,
      vRot: (Math.random() - 0.5) * 3
    });
  }

  public update(dt: number) {
    // 1. 데미지 텍스트 업데이트
    for (let i = this.damageNumbers.length - 1; i >= 0; i--) {
      const d = this.damageNumbers[i];
      d.life -= dt;
      d.x += d.vx * dt;
      d.y += d.vy * dt;
      d.vy += 120 * dt; // 살짝 중력 감속
      d.alpha = Math.max(0, d.life / d.maxLife);

      if (d.life <= 0) {
        this.damageNumbers.splice(i, 1);
      }
    }

    // 2. 파티클 업데이트
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rotation += p.vRot * dt;
      p.alpha = Math.max(0, p.life / p.maxLife);

      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // 3. 레벨업 배너
    for (let i = this.levelUpBanners.length - 1; i >= 0; i--) {
      const b = this.levelUpBanners[i];
      b.life -= dt;
      b.y -= 15 * dt;
      if (b.life <= 0) {
        this.levelUpBanners.splice(i, 1);
      }
    }
  }

  public render(ctx: CanvasRenderingContext2D, camX: number, camY: number) {
    ctx.save();

    // 1. 파티클 렌더링
    for (const p of this.particles) {
      const screenX = Math.floor(p.x - camX);
      const screenY = Math.floor(p.y - camY);

      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.translate(screenX, screenY);
      ctx.rotate(p.rotation);
      ctx.fillStyle = p.color;

      if (p.shape === 'star') {
        this.drawStar(ctx, 0, 0, 4, p.size, p.size * 0.4);
      } else if (p.shape === 'petal') {
        ctx.beginPath();
        ctx.ellipse(0, 0, p.size, p.size * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }

    // 2. 데미지 넘버 렌더링 (메이플 스타일 화려한 외곽선 + 그라데이션 넘버)
    for (const d of this.damageNumbers) {
      const screenX = Math.floor(d.x - camX);
      const screenY = Math.floor(d.y - camY);

      ctx.save();
      ctx.globalAlpha = d.alpha;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const fontSize = d.isCrit ? 26 : (d.isPlayerHurt ? 20 : 20);
      ctx.font = `900 ${fontSize}px "Outfit", "Segoe UI", sans-serif`;

      // 그림자 및 두꺼운 외곽선 (메이플스토리 시그니처)
      ctx.lineJoin = 'miter';
      ctx.miterLimit = 2;
      ctx.lineWidth = d.isCrit ? 5 : 4;
      ctx.strokeStyle = '#222222';
      ctx.strokeText(d.value.toString(), screenX, screenY);

      if (d.isPlayerHurt) {
        ctx.fillStyle = '#FF4D6D'; // 플레이어 피격은 빨강/핑크
      } else if (d.isCrit) {
        ctx.fillStyle = '#FFE600'; // 크리티컬은 샛노랑
      } else {
        ctx.fillStyle = '#FFF8DC'; // 일반 타격은 밝은 크림색
      }
      ctx.fillText(d.value.toString(), screenX, screenY);

      // 크리티컬 뱃지 아이콘
      if (d.isCrit) {
        ctx.font = 'bold 12px sans-serif';
        ctx.fillStyle = '#FF9900';
        ctx.fillText('CRITICAL!', screenX, screenY - 18);
      }

      ctx.restore();
    }

    // 3. 레벨업 팡파레 배너 렌더링
    for (const b of this.levelUpBanners) {
      const screenX = Math.floor(b.x - camX);
      const screenY = Math.floor(b.y - camY);
      const alpha = Math.min(1.0, b.life * 1.5);

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.textAlign = 'center';

      // LEVEL UP 텍스트
      ctx.font = '900 28px "Outfit", sans-serif';
      ctx.lineWidth = 6;
      ctx.strokeStyle = '#4A154B';
      ctx.strokeText('✨ LEVEL UP! ✨', screenX, screenY);

      const grad = ctx.createLinearGradient(screenX - 80, screenY, screenX + 80, screenY);
      grad.addColorStop(0, '#FFE600');
      grad.addColorStop(0.5, '#FFF9A6');
      grad.addColorStop(1, '#FF70A6');
      ctx.fillStyle = grad;
      ctx.fillText('✨ LEVEL UP! ✨', screenX, screenY);

      ctx.font = 'bold 14px "Outfit", sans-serif';
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText('+ HP/MP 회복 & 스탯 상승!', screenX, screenY + 22);

      ctx.restore();
    }

    ctx.restore();
  }

  private drawStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, spikes: number, outerRadius: number, innerRadius: number) {
    let rot = (Math.PI / 2) * 3;
    let x = cx;
    let y = cy;
    const step = Math.PI / spikes;

    ctx.beginPath();
    ctx.moveTo(cx, cy - outerRadius);
    for (let i = 0; i < spikes; i++) {
      x = cx + Math.cos(rot) * outerRadius;
      y = cy + Math.sin(rot) * outerRadius;
      ctx.lineTo(x, y);
      rot += step;

      x = cx + Math.cos(rot) * innerRadius;
      y = cy + Math.sin(rot) * innerRadius;
      ctx.lineTo(x, y);
      rot += step;
    }
    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
    ctx.fill();
  }
}
