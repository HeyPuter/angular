import { CommonModule } from '@angular/common';
import { Component, computed, signal, type Type } from '@angular/core';
import { AIExampleComponent } from './examples/ai-example.component';
import { FileSystemExampleComponent } from './examples/file-system-example.component';
import { KvExampleComponent } from './examples/kv-example.component';
import { OsExampleComponent } from './examples/os-example.component';
import { UiExampleComponent } from './examples/ui-example.component';

type TabId = 'kv' | 'fs' | 'os' | 'ui' | 'ai';

type Tab = {
  id: TabId;
  label: string;
  description: string;
  component: Type<unknown>;
};

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  readonly tabs: Tab[] = [
    { id: 'kv', label: 'KV store', description: 'Get/set and increment counters', component: KvExampleComponent },
    { id: 'fs', label: 'File system', description: 'Read and write a demo file', component: FileSystemExampleComponent },
    { id: 'os', label: 'OS', description: 'User profile + version info', component: OsExampleComponent },
    { id: 'ai', label: 'AI chat', description: 'Prompt Puter AI and see replies', component: AIExampleComponent },
    { id: 'ui', label: 'UI helpers', description: 'File picker example', component: UiExampleComponent }
  ];

  readonly activeTabId = signal<TabId>('kv');
  readonly activeTab = computed(() => this.tabs.find(tab => tab.id === this.activeTabId()) ?? this.tabs[0]);

  setActiveTab(tabId: TabId) {
    this.activeTabId.set(tabId);
  }
}
