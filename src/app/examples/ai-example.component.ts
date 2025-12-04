import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import puter from '@heyputer/puter.js';
import { extractText, getErrorMessage } from './helpers';

type ChatTurn = {
  user: string;
  ai: string;
};

@Component({
  selector: 'app-ai-example',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="card stack">
      <div class="stack">
        <h2>Puter AI Chat</h2>
        <p>
          Send a short prompt to <code>puter.ai.chat</code> and see the reply.
        </p>
      </div>

      <div class="chat-box">
        <textarea
          [(ngModel)]="input"
          rows="3"
          placeholder="Ask Puter AI anything..."
        ></textarea>
        <div class="actions">
          <button [disabled]="isLoading() || !input.trim()" (click)="sendChat()">
            {{ isLoading() ? 'Sending...' : 'Send message' }}
          </button>
          <span class="status">Status: {{ status() }}</span>
        </div>
      </div>

      <div class="callout" *ngIf="history().length > 0">
        <strong>Conversation</strong>
        <div class="chat-history">
          <div class="chat-turn" *ngFor="let turn of history(); let idx = index">
            <div class="chat-label">You</div>
            <div class="chat-bubble">{{ turn.user }}</div>
            <div class="chat-label">Puter AI</div>
            <div class="chat-bubble alt">{{ turn.ai }}</div>
          </div>
        </div>
      </div>
    </section>
  `
})
export class AIExampleComponent {
  input = 'What can you do?';
  readonly status = signal<string>('Idle');
  readonly history = signal<ChatTurn[]>([]);
  readonly isLoading = signal<boolean>(false);

  async sendChat() {
    if (!this.input.trim()) return;
    this.isLoading.set(true);
    this.status.set('Sending to Puter AI...');
    try {
      const response = await puter.ai.chat(this.input);
      const text = extractText(response);
      this.history.update(history => [...history, { user: this.input.trim(), ai: text }]);
      this.input = '';
      this.status.set('Reply received');
    } catch (error) {
      this.status.set(`Error: ${getErrorMessage(error)}`);
    } finally {
      this.isLoading.set(false);
    }
  }
}
