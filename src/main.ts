// 메인 진입점: 모니터/아이패드/모바일 전체화면 반응형 리사이즈 및 루프
import './style.css';
import { GameManager } from './game/game';
import { UIManager } from './ui/hud';
import { sound } from './engine/audio';

window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
  if (!canvas) return;

  const game = new GameManager(canvas);
  const ui = new UIManager(game);

  // 모니터/디바이스 화면에 가득 차도록 캔버스 크기 동적 동기화
  const handleResize = () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    game.resize(w, h);
  };

  window.addEventListener('resize', handleResize);
  handleResize();

  // 사용자 첫 인터랙션 시 사운드 초기화
  let audioStarted = false;
  const startAudioOnFirstInput = () => {
    if (!audioStarted) {
      audioStarted = true;
      sound.init();
      sound.resume();
      sound.playBGM(game.currentMap.bgm);
      window.removeEventListener('keydown', startAudioOnFirstInput);
      window.removeEventListener('click', startAudioOnFirstInput);
      window.removeEventListener('touchstart', startAudioOnFirstInput);
    }
  };

  window.addEventListener('keydown', startAudioOnFirstInput);
  window.addEventListener('click', startAudioOnFirstInput);
  window.addEventListener('touchstart', startAudioOnFirstInput, { passive: true });

  let lastTime = performance.now();

  function gameLoop(currentTime: number) {
    const dt = Math.min((currentTime - lastTime) / 1000, 0.1);
    lastTime = currentTime;

    game.update(dt);
    game.render();
    ui.updateHUD();

    requestAnimationFrame(gameLoop);
  }

  requestAnimationFrame(gameLoop);
});
