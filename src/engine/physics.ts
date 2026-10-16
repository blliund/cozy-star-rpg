// 횡스크롤 플랫폼 물리 엔진: AABB, 원웨이 플랫폼(하향 점프), 중력, 넉백

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Platform extends Box {
  isOneWay: boolean; // 얇은 발판 (아래에서 위로 점프 가능, 하향 점프 가능)
}

export class PhysicsEngine {
  public gravity: number = 980; // 중력 가속도
  public terminalVelocity: number = 650; // 최대 낙하 속도

  // 두 AABB 박스가 겹치는지 검사
  public static checkOverlap(a: Box, b: Box): boolean {
    return (
      a.x < b.x + b.w &&
      a.x + a.w > b.x &&
      a.y < b.y + b.h &&
      a.y + a.h > b.y
    );
  }

  // 발판 충돌 해결 (원웨이 플랫폼 포함)
  public resolvePlatformCollision(
    entity: Box,
    vy: number,
    platforms: Platform[],
    isDroppingDown: boolean = false
  ): { landed: boolean; y: number; vy: number; groundPlatform: Platform | null } {
    let landed = false;
    let newY = entity.y;
    let newVy = vy;
    let groundPlatform: Platform | null = null;

    for (const plat of platforms) {
      if (plat.isOneWay) {
        if (isDroppingDown) continue; // 하향 점프 중이면 얇은 발판 무시

        // 오직 낙하 중일 때만, 발판 윗면을 위에서 밟을 때 착지
        const prevBottom = entity.y + entity.h - (vy * 0.03); // 이전 프레임 추정
        const currBottom = entity.y + entity.h;

        const isHorizontalOverlapping =
          entity.x + entity.w * 0.8 > plat.x &&
          entity.x + entity.w * 0.2 < plat.x + plat.w;

        if (isHorizontalOverlapping && vy >= 0) {
          if (prevBottom <= plat.y + 6 && currBottom >= plat.y) {
            newY = plat.y - entity.h;
            newVy = 0;
            landed = true;
            groundPlatform = plat;
            break;
          }
        }
      } else {
        // 단단한 고체 블록 (Solid ground)
        if (PhysicsEngine.checkOverlap(entity, plat)) {
          // 낙하 중 착지
          if (vy > 0 && entity.y + entity.h - plat.y < 16) {
            newY = plat.y - entity.h;
            newVy = 0;
            landed = true;
            groundPlatform = plat;
            break;
          }
        }
      }
    }

    return { landed, y: newY, vy: newVy, groundPlatform };
  }
}
