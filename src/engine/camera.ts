// 부드러운 횡스크롤 추적 카메라 및 화면 흔들림(Screen Shake) 연출

export class Camera {
  public x: number = 0;
  public y: number = 0;
  public width: number = 800;
  public height: number = 480;
  public targetX: number = 0;
  public targetY: number = 0;
  public minX: number = 0;
  public maxX: number = 2400;
  public minY: number = 0;
  public maxY: number = 800;

  private shakeDuration: number = 0;
  private shakeIntensity: number = 0;
  private shakeOffsetX: number = 0;
  private shakeOffsetY: number = 0;

  constructor(width: number = 800, height: number = 480) {
    this.width = width;
    this.height = height;
  }

  public setBounds(minX: number, maxX: number, minY: number, maxY: number) {
    this.minX = minX;
    this.maxX = maxX;
    this.minY = minY;
    this.maxY = maxY;
  }

  public follow(targetX: number, targetY: number, immediate: boolean = false) {
    // 플레이어를 화면 가로/세로 중심보다 약간 아래쪽에 배치(메이플 감성)
    const desiredX = targetX - this.width / 2;
    const desiredY = targetY - this.height * 0.58;

    const clampedX = Math.max(this.minX, Math.min(this.maxX - this.width, desiredX));
    const clampedY = Math.max(this.minY, Math.min(this.maxY - this.height, desiredY));

    if (immediate) {
      this.x = clampedX;
      this.y = clampedY;
    } else {
      // Lerp 스무딩 (부드러운 추적)
      this.x += (clampedX - this.x) * 0.12;
      this.y += (clampedY - this.y) * 0.12;
    }
  }

  public shake(duration: number = 0.2, intensity: number = 6) {
    this.shakeDuration = duration;
    this.shakeIntensity = intensity;
  }

  public update(dt: number) {
    if (this.shakeDuration > 0) {
      this.shakeDuration -= dt;
      this.shakeOffsetX = (Math.random() * 2 - 1) * this.shakeIntensity;
      this.shakeOffsetY = (Math.random() * 2 - 1) * this.shakeIntensity;
      if (this.shakeDuration <= 0) {
        this.shakeOffsetX = 0;
        this.shakeOffsetY = 0;
      }
    }
  }

  public getDrawX(): number {
    return Math.floor(this.x + this.shakeOffsetX);
  }

  public getDrawY(): number {
    return Math.floor(this.y + this.shakeOffsetY);
  }
}
