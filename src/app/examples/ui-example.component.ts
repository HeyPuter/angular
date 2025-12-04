import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import puter from '@heyputer/puter.js';
import { getErrorMessage } from './helpers';

@Component({
  selector: 'app-ui-example',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="card stack">
      <div class="stack">
        <h2>Puter UI</h2>
        <p>
          Single-file picker example using <code>puter.ui.showOpenFilePicker</code>.
        </p>
      </div>

      <div class="actions">
        <button (click)="openFile()">Open file picker</button>
      </div>

      <div class="callout">
        <strong>Last UI result</strong>
        <p>{{ lastResult() }}</p>
      </div>
    </section>
  `
})
export class UiExampleComponent {
  readonly lastResult = signal<string>('No UI actions yet');

  async openFile() {
    try {
      const result = await puter.ui.showOpenFilePicker({ multiple: false });
      const file = Array.isArray(result) ? result[0] : result;
      this.lastResult.set(file ? `Selected file: ${file.name || file.path || 'unknown'}` : 'No file selected');
    } catch (error) {
      this.lastResult.set(`File picker failed: ${getErrorMessage(error)}`);
    }
  }
}
