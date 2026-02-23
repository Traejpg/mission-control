import { useState } from 'react';
import { ChevronLeft, ChevronRight, Clock, Repeat, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { workflows } from '../data/store';
import { useFileWatcher } from '../hooks/useFileWatcher';
import type { CalendarEvent } from '../types';

const eventTypeColors = {
  task: 'bg-brand-500/20 text-brand-400 border-brand-500/30',
  reminder: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  deadline: 'bg-red-500/20 text-red-400 border-red-500/30',
  meeting: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  cron: 'bg-green-500/20 text-green-400 border-green-500/30',
};

// Convert tasks to calendar events
function tasksToEvents(tasks: any[]): CalendarEvent[] {
  return tasks.map(task => ({
    id: task.id,
    title: task.title,
    description: task.description || '',
    startTime: task.createdAt || Date.now(),
    endTime: (task.createdAt || Date.now()) + 3600000, // 1 hour duration
    type: task.status === 'done' ? 'task' : task.priority === 'critical' ? 'deadline' : 'task',
    workflow: task.workflow || 'personal',
    recurring: undefined,
  }));
}

export default function Calendar() {
  const { tasks, isConnected, refresh } = useFileWatcher();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

  const calendarEvents = tasksToEvents(tasks);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getEventsForDate = (date: Date): CalendarEvent[] => {
    return calendarEvents.filter(event =>
      isSameDay(new Date(event.startTime), date)
    );
  };

  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : [];

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Header - Mobile Optimized */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="responsive-h1">Calendar</h1>
            <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
              isConnected
                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                : 'bg-red-500/20 text-red-400 border border-red-500/30'
            }`}>
              {isConnected ? (
                <><Wifi className="w-3 h-3" /> <span className="hidden sm:inline">LIVE</span></>
              ) : (
                <><WifiOff className="w-3 h-3" /> <span className="hidden sm:inline">OFFLINE</span></>
              )}
            </span>
          </div>
          <p className="text-gray-400 mt-1 text-sm">
            {calendarEvents.length} events from memory files
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={refresh}
            disabled={!isConnected}
            className="p-2.5 hover:bg-dark-700 rounded-lg transition-colors disabled:opacity-50 touch-target"
            aria-label="Refresh calendar"
          >
            <RefreshCw className={`w-5 h-5 text-gray-400 ${!isConnected ? '' : 'hover:text-brand-400'}`} />
          </button>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentDate(subMonths(currentDate, 1))}
              className="p-2.5 hover:bg-dark-700 rounded-lg transition-colors touch-target"
              aria-label="Previous month"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-bold min-w-[140px] text-center sm:min-w-[200px]">
              {format(currentDate, 'MMMM yyyy')}
            </h2>
            <button
              onClick={() => setCurrentDate(addMonths(currentDate, 1))}
              className="p-2.5 hover:bg-dark-700 rounded-lg transition-colors touch-target"
              aria-label="Next month"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Grid - Responsive */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Calendar Grid */}
        <div className="lg:col-span-2 card p-3 lg:p-4">
          {/* Days Header - Smaller on mobile */}
          <div className="grid grid-cols-7 gap-1 mb-2 lg:mb-4">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
              <div key={i} className="text-center text-xs lg:text-sm font-medium text-gray-400 py-1 lg:py-2">
                <span className="hidden sm:inline">{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][i]}</span>
                <span className="sm:hidden">{day}</span>
              </div>
            ))}
          </div>

          {/* Calendar Days - Smaller touch targets on mobile */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((day) => {
              const dayEvents = getEventsForDate(day);
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              const isToday = isSameDay(day, new Date());

              return (
                <button
                  key={day.toISOString()}
                  onClick={() => setSelectedDate(day)}
                  className={`
                    min-h-[60px] sm:min-h-[80px] lg:min-h-[100px] p-1 sm:p-2 rounded-lg border text-left transition-all touch-target
                    ${isSelected ? 'border-brand-500 bg-brand-500/10' : 'border-dark-600 hover:border-dark-500'}
                    ${!isSameMonth(day, currentDate) && 'opacity-30'}
                  `}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs sm:text-sm font-medium ${isToday ? 'text-brand-400' : ''}`}>
                      {format(day, 'd')}
                    </span>
                    {dayEvents.length > 0 && (
                      <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-brand-500 rounded-full"></span>
                    )}
                  </div>
                  <div className="space-y-0.5">
                    {dayEvents.slice(0, 1).map((event, idx) => (
                      <div 
                        key={idx}
                        className={`text-[10px] sm:text-xs px-1 py-0.5 rounded truncate ${eventTypeColors[event.type]}`}
                      >
                        {event.title.substring(0, 12)}{event.title.length > 12 ? '...' : ''}
                      </div>
                    ))}
                    {dayEvents.length > 1 && (
                      <div className="text-[10px] sm:text-xs text-gray-400 px-1">
                        +{dayEvents.length - 1}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Day Detail Panel - Full width on mobile */}
        <div className="space-y-4">
          <div className="card">
            <h3 className="font-bold text-base lg:text-lg mb-4">
              {selectedDate ? format(selectedDate, 'EEEE, MMMM do') : 'Select a date'}
            </h3>
            
            {selectedDateEvents.length > 0 ? (
              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                {selectedDateEvents.map((event) => (
                  <div 
                    key={event.id}
                    className={`p-3 rounded-lg border ${eventTypeColors[event.type]}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm">{event.title}</h4>
                        {event.description && (
                          <p className="text-xs opacity-80 mt-1 line-clamp-2">{event.description}</p>
                        )}
                      </div>
                      {event.recurring && (
                        <Repeat className="w-4 h-4 opacity-60 flex-shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-2 text-xs opacity-80 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {format(new Date(event.startTime), 'h:mm a')}
                      </span>
                      <span className="flex items-center gap-1 truncate">
                        {workflows.find(w => w.id === event.workflow)?.icon === 'music' && '🎵'}
                        {workflows.find(w => w.id === event.workflow)?.icon === 'home' && '🏠'}
                        {workflows.find(w => w.id === event.workflow)?.icon === 'bot' && '🤖'}
                        {workflows.find(w => w.id === event.workflow)?.icon === 'trending-up' && '📈'}
                        {workflows.find(w => w.id === event.workflow)?.icon === 'user' && '👤'}
                        <span className="hidden sm:inline">{workflows.find(w => w.id === event.workflow)?.name}</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-center py-8">
                No events scheduled
              </p>
            )}
          </div>

          {/* Upcoming Events - Mobile scrollable */}
          <div className="card">
            <h3 className="font-bold text-base lg:text-lg mb-4">Upcoming</h3>
            <div className="space-y-3 max-h-[200px] overflow-y-auto">
              {calendarEvents
                .filter(e => new Date(e.startTime) > new Date())
                .slice(0, 5)
                .map(event => (
                  <div key={event.id} className="flex items-center gap-3 p-2 hover:bg-dark-700 rounded-lg">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${eventTypeColors[event.type].split(' ')[0].replace('bg-', 'bg-').replace('/20', '')}`}></div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{event.title}</p>
                      <p className="text-xs text-gray-400">
                        {format(new Date(event.startTime), 'MMM d, h:mm a')}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
