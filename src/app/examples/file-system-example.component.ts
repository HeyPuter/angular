import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import puter from '@heyputer/puter.js';
import { getDemoPath, getErrorMessage } from './helpers';

@Component({
  selector: 'app-file-system-example',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="card stack">
      <div class="stack">
        <h2>Puter File System</h2>
        <p>
          Creates and reads a sample file at <code>{{ demoPath() }}</code>. Uses your app data folder when
          available.
        </p>
      </div>

      <div class="actions">
        <button (click)="writeSampleFile()">Write file</button>
        <button (click)="readSampleFile()">Read file</button>
      </div>

      <p class="status">Status: {{ status() }}</p>

      <div class="callout" *ngIf="fileContents()">
        <strong>File contents</strong>
        <pre>{{ fileContents() }}</pre>
      </div>
    </section>
  `
})
export class FileSystemExampleComponent {
  readonly demoPath = computed(getDemoPath);
  readonly status = signal<string>('Idle');
  readonly fileContents = signal<string>('');

  async writeSampleFile() {
    this.status.set('Writing sample file...');
    try {
      await puter.fs.write(this.demoPath(), `Hello from Puter.js at ${new Date().toISOString()}`);
      this.status.set(`Wrote sample text to ${this.demoPath()}`);
    } catch (error) {
      this.status.set(`Write failed: ${getErrorMessage(error)}`);
    }
  }

  async readSampleFile() {
    this.status.set('Reading file...');
    try {
      const blob = await puter.fs.read(this.demoPath());
      const text = await blob.text();
      this.fileContents.set(text);
      this.status.set('Read succeeded');
    } catch (error) {
      this.status.set(`Read failed: ${getErrorMessage(error)}`);
    }
  }
}
