import { ScreenState } from '../game/GameState';

export class ScreenManager {
  private screens: { [key in ScreenState]?: HTMLElement } = {};
  private overlayPause: HTMLElement;
  private overlayComplete: HTMLElement;
  private dialogSettings: HTMLDialogElement;
  private lastActiveElement: HTMLElement | null = null;

  constructor() {
    this.screens.start = document.getElementById('screen-start')!;
    this.screens.playing = document.getElementById('screen-game')!;

    this.overlayPause = document.getElementById('overlay-pause')!;
    this.overlayComplete = document.getElementById('overlay-complete')!;
    this.dialogSettings = document.getElementById('dialog-settings') as HTMLDialogElement;

    // Handle closing settings dialog with ESC key correctly
    this.dialogSettings.addEventListener('close', () => {
      this.returnFocus();
    });
  }

  /**
   * Switches the active main screen and overlays.
   */
  showScreen(state: ScreenState) {
    // Hide overlays by default
    this.overlayPause.classList.add('hidden');
    this.overlayComplete.classList.add('hidden');

    // Toggle main screens
    if (state === 'start') {
      this.screens.start?.classList.remove('hidden');
      this.screens.playing?.classList.add('hidden');

      // Auto focus play button
      const playBtn = document.getElementById('btn-play');
      playBtn?.focus();
    } else if (state === 'playing') {
      this.screens.start?.classList.add('hidden');
      this.screens.playing?.classList.remove('hidden');

      // Focus canvas container or game board for screen reader focus trapping
      const container = document.getElementById('canvas-container');
      container?.focus();
    } else if (state === 'paused') {
      this.screens.start?.classList.add('hidden');
      this.screens.playing?.classList.remove('hidden');
      this.overlayPause.classList.remove('hidden');

      // Trap focus in pause menu
      const resumeBtn = document.getElementById('btn-resume');
      resumeBtn?.focus();
    } else if (state === 'completed') {
      this.screens.start?.classList.add('hidden');
      this.screens.playing?.classList.remove('hidden');
      this.overlayComplete.classList.remove('hidden');

      // Auto focus Next Level button
      const nextBtn = document.getElementById('btn-next');
      nextBtn?.focus();
    }
  }

  /**
   * Opens the settings dialog modal.
   */
  openSettings(triggerButtonId: string) {
    this.lastActiveElement = document.getElementById(triggerButtonId);

    // Open native dialog modal
    this.dialogSettings.showModal();

    // Trap focus inside dialog - focus first toggle
    const firstInput = this.dialogSettings.querySelector('input');
    firstInput?.focus();
  }

  /**
   * Closes the settings dialog modal.
   */
  closeSettings() {
    this.dialogSettings.close();
    this.returnFocus();
  }

  /**
   * Returns focus to the button that opened the settings.
   */
  private returnFocus() {
    if (this.lastActiveElement) {
      this.lastActiveElement.focus();
      this.lastActiveElement = null;
    }
  }
}
