// 키보드 + 모바일/아이패드 온스크린 가상 컨트롤러 통합 입력 관리 시스템

export interface InputState {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  jump: boolean;
  attack: boolean;
  skill1: boolean;
  skill2: boolean;
  interact: boolean;
  inventory: boolean;
  quest: boolean;
  stats: boolean;
  quick1: boolean;
  quick2: boolean;
  escape: boolean;
}

export class InputManager {
  private keys: { [key: string]: boolean } = {};
  private prevKeys: { [key: string]: boolean } = {};
  private justPressedKeys: { [key: string]: boolean } = {};

  // 가상 온스크린 터치/버튼 상태
  private virtualKeys: { [key: string]: boolean } = {};
  private virtualJustPressed: { [key: string]: boolean } = {};

  constructor() {
    window.addEventListener('keydown', (e) => {
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyJ', 'KeyK', 'KeyL', 'KeyE', 'KeyI', 'KeyQ', 'KeyC'].includes(e.code)) {
        const target = e.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          e.preventDefault();
        }
      }
      this.keys[e.code] = true;
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

    window.addEventListener('blur', () => {
      this.keys = {};
      this.prevKeys = {};
      this.justPressedKeys = {};
      this.virtualKeys = {};
      this.virtualJustPressed = {};
    });
  }

  // 온스크린 버튼 누름 이벤트 등록 (모바일/터치/마우스)
  public setVirtualKey(keyName: string, isDown: boolean) {
    if (isDown && !this.virtualKeys[keyName]) {
      this.virtualJustPressed[keyName] = true;
    }
    this.virtualKeys[keyName] = isDown;
  }

  public update() {
    this.justPressedKeys = {};
    for (const code in this.keys) {
      if (this.keys[code] && !this.prevKeys[code]) {
        this.justPressedKeys[code] = true;
      }
    }
    this.prevKeys = { ...this.keys };
  }

  public isDown(code: string): boolean {
    return !!this.keys[code];
  }

  public isJustPressed(code: string): boolean {
    return !!this.justPressedKeys[code];
  }

  public getState(): InputState {
    const v = this.virtualKeys;
    const vjp = this.virtualJustPressed;

    const left = this.isDown('ArrowLeft') || this.isDown('KeyA') || !!v['left'];
    const right = this.isDown('ArrowRight') || this.isDown('KeyD') || !!v['right'];
    const up = this.isDown('ArrowUp') || this.isDown('KeyW') || !!v['up'];
    const down = this.isDown('ArrowDown') || this.isDown('KeyS') || !!v['down'];

    const jump = this.isJustPressed('Space') || !!vjp['jump'];
    const attack = this.isJustPressed('KeyJ') || !!vjp['attack'];
    const skill1 = this.isJustPressed('KeyK') || !!vjp['skill1'];
    const skill2 = this.isJustPressed('KeyL') || !!vjp['skill2'];
    const interact = this.isJustPressed('KeyE') || this.isJustPressed('ArrowUp') || this.isJustPressed('KeyW') || !!vjp['interact'];

    const inventory = this.isJustPressed('KeyI') || !!vjp['inventory'];
    const quest = this.isJustPressed('KeyQ') || !!vjp['quest'];
    const stats = this.isJustPressed('KeyC') || !!vjp['stats'];
    const quick1 = this.isJustPressed('Digit1') || !!vjp['quick1'];
    const quick2 = this.isJustPressed('Digit2') || !!vjp['quick2'];
    const escape = this.isJustPressed('Escape') || !!vjp['escape'];

    // 한 프레임 사용 후 가상 트리거 초기화
    this.virtualJustPressed = {};

    return {
      left,
      right,
      up,
      down,
      jump,
      attack,
      skill1,
      skill2,
      interact,
      inventory,
      quest,
      stats,
      quick1,
      quick2,
      escape
    };
  }
}

export const input = new InputManager();
