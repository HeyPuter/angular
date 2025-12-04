import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import puter from '@heyputer/puter.js';
import { formatJSON, getErrorMessage } from './helpers';

@Component({
  selector: 'app-os-example',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="card stack">
      <div class="stack">
        <h2>Puter OS</h2>
        <p>Fetches the current user and OS version metadata from Puter.</p>
      </div>

      <div class="actions">
        <button (click)="fetchUser()">Get current user</button>
        <button (click)="fetchVersion()">Get OS version</button>
      </div>

      <p class="status">Status: {{ status() }}</p>

      <div class="callout" *ngIf="userInfo()">
        <strong>User info</strong>
        <pre>{{ formattedUser() }}</pre>
      </div>

      <div class="callout" *ngIf="versionInfo()">
        <strong>Version info</strong>
        <pre>{{ formattedVersion() }}</pre>
      </div>
    </section>
  `
})
export class OsExampleComponent {
  readonly status = signal<string>('Idle');
  readonly userInfo = signal<Record<string, unknown> | null>(null);
  readonly versionInfo = signal<Record<string, unknown> | null>(null);

  formattedUser = () => (this.userInfo() ? formatJSON(this.userInfo() as Record<string, unknown>) : '');
  formattedVersion = () => (this.versionInfo() ? formatJSON(this.versionInfo() as Record<string, unknown>) : '');

  async fetchUser() {
    this.status.set('Fetching user...');
    try {
      const user = await puter.os.user();
      this.userInfo.set(user);
      this.status.set('User info loaded');
    } catch (error) {
      this.status.set(`User lookup failed: ${getErrorMessage(error)}`);
    }
  }

  async fetchVersion() {
    this.status.set('Fetching version...');
    try {
      const version = await puter.os.version();
      this.versionInfo.set(version);
      this.status.set('Version loaded');
    } catch (error) {
      this.status.set(`Version lookup failed: ${getErrorMessage(error)}`);
    }
  }
}
