import { CalendarEvent } from './types';
import { loadEvents, saveEvent, deleteEvent, formatDate, isSameDay, getEventsForDate } from './calendar';

export class CalendarUI {
  private currentDate: Date = new Date();
  private events: CalendarEvent[] = [];
  private selectedDate: Date | null = null;
  private onDateSelectCallback?: (date: Date) => void;

  constructor(private container: HTMLElement) {}

  async init(): Promise<void> {
    this.events = await loadEvents();
    this.render();
  }

  onDateSelect(callback: (date: Date) => void): void {
    this.onDateSelectCallback = callback;
  }

  private async render(): Promise<void> {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - startDate.getDay());

    let html = `
      <div class="calendar-view">
        <div class="calendar-header">
          <button class="calendar-nav-btn" id="prevMonth">‹</button>
          <h3 class="calendar-month">${year}年${month + 1}月</h3>
          <button class="calendar-nav-btn" id="nextMonth">›</button>
        </div>
        <div class="calendar-weekdays">
          <div class="calendar-weekday">日</div>
          <div class="calendar-weekday">月</div>
          <div class="calendar-weekday">火</div>
          <div class="calendar-weekday">水</div>
          <div class="calendar-weekday">木</div>
          <div class="calendar-weekday">金</div>
          <div class="calendar-weekday">土</div>
        </div>
        <div class="calendar-days" id="calendarDays">
    `;

    const current = new Date(startDate);
    for (let i = 0; i < 42; i++) {
      const dateStr = formatDate(current);
      const isCurrentMonth = current.getMonth() === month;
      const isToday = isSameDay(current, new Date());
      const dayEvents = getEventsForDate(this.events, current);
      const hasEvent = dayEvents.length > 0;
      const isSelected = this.selectedDate && isSameDay(current, this.selectedDate);

      html += `
        <div class="calendar-day ${!isCurrentMonth ? 'other-month' : ''} ${isToday ? 'today' : ''} ${hasEvent ? 'has-event' : ''} ${isSelected ? 'selected' : ''}" 
             data-date="${dateStr}">
          <div class="day-number">${current.getDate()}</div>
          ${hasEvent ? `<div class="event-dots">
            ${dayEvents.map(e => `<span class="event-dot ${e.status}" title="${e.title}"></span>`).join('')}
          </div>` : ''}
        </div>
      `;

      current.setDate(current.getDate() + 1);
    }

    html += `
        </div>
        <div class="calendar-legend">
          <div class="legend-item"><span class="event-dot draft"></span> 下書き</div>
          <div class="legend-item"><span class="event-dot confirmed"></span> 確定</div>
        </div>
      </div>
      <div class="calendar-details" id="calendarDetails"></div>
    `;

    this.container.innerHTML = html;
    this.attachEventListeners();
  }

  private attachEventListeners(): void {
    const prevBtn = document.getElementById('prevMonth');
    const nextBtn = document.getElementById('nextMonth');
    const daysContainer = document.getElementById('calendarDays');

    prevBtn?.addEventListener('click', () => {
      this.currentDate.setMonth(this.currentDate.getMonth() - 1);
      this.render();
    });

    nextBtn?.addEventListener('click', () => {
      this.currentDate.setMonth(this.currentDate.getMonth() + 1);
      this.render();
    });

    daysContainer?.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const dayElement = target.closest('.calendar-day') as HTMLElement;
      if (dayElement && dayElement.dataset.date) {
        const dateStr = dayElement.dataset.date;
        this.selectedDate = new Date(dateStr + 'T00:00:00');
        this.render();
        this.onDateSelectCallback?.(this.selectedDate);
        this.showDayDetails(this.selectedDate);
      }
    });

    // ダブルクリックでイベント作成
    daysContainer?.addEventListener('dblclick', async (e) => {
      const target = e.target as HTMLElement;
      const dayElement = target.closest('.calendar-day') as HTMLElement;
      if (dayElement && dayElement.dataset.date) {
        const dateStr = dayElement.dataset.date;
        const date = new Date(dateStr + 'T00:00:00');
        await this.createEvent(date);
      }
    });
  }

  private showDayDetails(date: Date): void {
    const detailsContainer = document.getElementById('calendarDetails');
    if (!detailsContainer) return;

    const dateStr = formatDate(date);
    const dayEvents = getEventsForDate(this.events, date);

    let html = `
      <div class="day-details">
        <h4>${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日</h4>
        <div class="events-list">
    `;

    if (dayEvents.length === 0) {
      html += '<p class="no-events">予定はありません</p>';
    } else {
      dayEvents.forEach(event => {
        html += `
          <div class="event-item ${event.status}">
            <div class="event-header">
              <strong>${event.title}</strong>
              <button class="delete-event-btn" data-id="${event.id}">削除</button>
            </div>
            ${event.description ? `<p>${event.description}</p>` : ''}
            <span class="event-status">${event.status === 'draft' ? '下書き' : '確定'}</span>
          </div>
        `;
      });
    }

    html += `
        </div>
        <button class="btn-primary" id="addEventBtn" data-date="${dateStr}">予定を追加</button>
      </div>
    `;

    detailsContainer.innerHTML = html;

    // イベント追加ボタン
    document.getElementById('addEventBtn')?.addEventListener('click', () => {
      this.createEvent(date);
    });

    // 削除ボタン
    detailsContainer.querySelectorAll('.delete-event-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = (e.target as HTMLElement).dataset.id;
        if (id) {
          await deleteEvent(id);
          this.events = await loadEvents();
          this.render();
          this.showDayDetails(date);
        }
      });
    });
  }

  private async createEvent(date: Date): Promise<void> {
    const titleInput = prompt('予定のタイトルを入力してください:');
    if (!titleInput) return;
    
    // 入力値の検証とサニタイズ
    const title = titleInput.trim().substring(0, 100); // 最大100文字

    const descInput = prompt('説明（任意）:') || '';
    const description = descInput.trim().substring(0, 500); // 最大500文字

    const event: CalendarEvent = {
      id: Date.now().toString(),
      date: formatDate(date),
      title,
      description,
      status: 'draft',
      createdAt: new Date().toISOString()
    };

    await saveEvent(event);
    this.events = await loadEvents();
    this.render();
    this.showDayDetails(date);
  }

  async refresh(): Promise<void> {
    this.events = await loadEvents();
    this.render();
    if (this.selectedDate) {
      this.showDayDetails(this.selectedDate);
    }
  }
}