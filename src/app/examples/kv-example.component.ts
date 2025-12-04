import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import puter from '@heyputer/puter.js';

@Component({
  selector: 'app-kv-example',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="card stack">
      <div class="stack">
        <h2>Puter KV Store</h2>
        <a href="https://docs.puter.com/KV/" target="_blank" rel="noreferrer">KV documentation</a>
      </div>
      <div class="counter-row">
        <button [disabled]="localCount() === undefined" (click)="decrementCount()">-</button>
        <span class="counter-value">
          {{ localCount() !== undefined ? localCount() : 'loading...' }}
        </span>
        <button [disabled]="localCount() === undefined" (click)="incrementCount()">+</button>
      </div>
      <p class="status">
        This counter is stored in Puter KV as <code>testCounter</code>.
      </p>
    </section>
  `
})
export class KvExampleComponent implements OnInit {
  readonly localCount = signal<number | undefined>(undefined);

  async ngOnInit() {
    const counter = await puter.kv.get<number>('testCounter');
    this.localCount.set(counter || 0);
  }

  async incrementCount() {
    this.localCount.update(count => (count || 0) + 1);
    await puter.kv.incr('testCounter', 1);
  }

  async decrementCount() {
    this.localCount.update(count => (count || 0) - 1);
    await puter.kv.decr('testCounter', 1);
  }
}
