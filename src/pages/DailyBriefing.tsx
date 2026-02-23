import { useState, useEffect } from 'react';
import { 
  Sun, 
  Target, 
  Dumbbell, 
  TrendingUp, 
  Utensils, 
  Clock, 
  AlertTriangle,
  Quote,
  CheckCircle2,
  Circle,
  ChevronRight,
  Flame,
  Zap,
  Brain,
  Plus,
  Minus
} from 'lucide-react';
import { motion } from 'framer-motion';

// Workout cycle definition
const WORKOUT_CYCLE = [
  { day: 1, name: 'Chest, Shoulders, Triceps', icon: '💪', color: 'red' },
  { day: 2, name: 'Back, Biceps', icon: '🔥', color: 'blue' },
  { day: 3, name: 'Legs, Shoulders', icon: '🦵', color: 'green' },
  { day: 4, name: 'Chest, Back, Arms', icon: '⚡', color: 'purple' },
];

// Nutrition schedule
const NUTRITION_SCHEDULE = [
  { time: 'Morning (within 60 min)', items: ['2 bananas', 'Eggs + English muffin', 'Water'], completed: false },
  { time: 'Mid-Morning', items: ['30g collagen protein shake'], completed: false },
  { time: 'Lunch', items: ['Chicken, rice, vegetables'], completed: false },
  { time: 'Afternoon', items: ['Chicken + rice'], completed: false },
  { time: 'Evening', items: ['Protein shake'], completed: false },
];

// Supplements
const SUPPLEMENTS = [
  { name: 'Creatine', timing: 'With meal/shake (training days)', completed: false },
  { name: 'Magnesium Glycinate', timing: 'Evening, before bed', completed: false },
];

// Health drinks
const HEALTH_DRINKS = [
  { name: 'Beet + Ginger + Apple + Lemon', completed: false },
  { name: 'Watermelon (hydration)', completed: false },
];

// Deep thoughts collection
const DEEP_THOUGHTS = [
  "Discipline equals freedom.",
  "The only way to do great work is to love what you do.",
  "Success is the sum of small efforts, repeated day in and day out.",
  "Your future is created by what you do today, not tomorrow.",
  "Action is the foundational key to all success.",
  "What you do today can improve all your tomorrows.",
];

// Distractions to avoid
const DISTRACTIONS = [
  "Social media before noon",
  "Checking email more than 3x/day",
  "Working on low-leverage tasks during peak hours",
  "Skipping gym for 'urgent' work",
  "Over-optimizing instead of shipping",
];

export default function DailyBriefing() {
  const [currentDay, setCurrentDay] = useState(1);
  const [priorities, setPriorities] = useState(['', '', '']);
  const [stockPlay, setStockPlay] = useState('');
  const [workflowBlocks, setWorkflowBlocks] = useState({
    morning: '',
    afternoon: '',
    evening: '',
  });
  const [nutrition, setNutrition] = useState(NUTRITION_SCHEDULE);
  const [supplements, setSupplements] = useState(SUPPLEMENTS);
  const [healthDrinks, setHealthDrinks] = useState(HEALTH_DRINKS);
  const [distractionToAvoid, setDistractionToAvoid] = useState('');
  const [deepThought, setDeepThought] = useState('');
  const [hydrationCount, setHydrationCount] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Load saved data on mount
  useEffect(() => {
    const saved = localStorage.getItem('dailyBriefing');
    if (saved) {
      const data = JSON.parse(saved);
      setPriorities(data.priorities || ['', '', '']);
      setStockPlay(data.stockPlay || '');
      setWorkflowBlocks(data.workflowBlocks || { morning: '', afternoon: '', evening: '' });
      setNutrition(data.nutrition || NUTRITION_SCHEDULE);
      setSupplements(data.supplements || SUPPLEMENTS);
      setHealthDrinks(data.healthDrinks || HEALTH_DRINKS);
      setDistractionToAvoid(data.distractionToAvoid || '');
      setHydrationCount(data.hydrationCount || 0);
      setCurrentDay(data.currentDay || 1);
    } else {
      // Initialize with random values
      setDistractionToAvoid(DISTRACTIONS[Math.floor(Math.random() * DISTRACTIONS.length)]);
      setDeepThought(DEEP_THOUGHTS[Math.floor(Math.random() * DEEP_THOUGHTS.length)]);
    }

    // Update time
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Save data when changed
  useEffect(() => {
    localStorage.setItem('dailyBriefing', JSON.stringify({
      priorities,
      stockPlay,
      workflowBlocks,
      nutrition,
      supplements,
      healthDrinks,
      distractionToAvoid,
      hydrationCount,
      currentDay,
      lastUpdated: new Date().toISOString(),
    }));
  }, [priorities, stockPlay, workflowBlocks, nutrition, supplements, healthDrinks, distractionToAvoid, hydrationCount, currentDay]);

  const toggleNutritionItem = (index: number) => {
    setNutrition(prev => prev.map((item, i) => 
      i === index ? { ...item, completed: !item.completed } : item
    ));
  };

  const toggleSupplement = (index: number) => {
    setSupplements(prev => prev.map((item, i) => 
      i === index ? { ...item, completed: !item.completed } : item
    ));
  };

  const toggleHealthDrink = (index: number) => {
    setHealthDrinks(prev => prev.map((item, i) => 
      i === index ? { ...item, completed: !item.completed } : item
    ));
  };

  const advanceWorkoutDay = () => {
    setCurrentDay(prev => prev >= 4 ? 1 : prev + 1);
  };

  const completedNutrition = nutrition.filter(n => n.completed).length;
  const todayWorkout = WORKOUT_CYCLE[currentDay - 1];

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Header - Mobile Optimized */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 lg:w-12 lg:h-12 bg-brand-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <Sun className="w-6 h-6 lg:w-7 lg:h-7 text-white" />
          </div>
          <div>
            <h1 className="responsive-h1">Daily Briefing</h1>
            <p className="text-gray-400 text-sm">
              {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-xl lg:text-2xl font-mono font-bold text-brand-400">
              {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </p>
            <p className="text-xs text-gray-400">
              {currentTime.getHours() < 12 ? 'Morning Block' : 
               currentTime.getHours() < 16 ? 'Afternoon Block' : 'Evening Block'}
            </p>
          </div>
        </div>
      </div>

      {/* Responsive Grid - Single column on mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Left Column - Priorities & Stock */}
        <div className="space-y-4 lg:space-y-6">
          {/* Top 3 Priorities */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card border-t-4 border-t-red-500"
          >
            <div className="flex items-center gap-2 lg:gap-3 mb-4">
              <Target className="w-5 h-5 lg:w-6 lg:h-6 text-red-400" />
              <h2 className="text-lg lg:text-xl font-bold">Top 3 Priorities</h2>
            </div>
            <div className="space-y-3">
              {priorities.map((priority, index) => (
                <div key={index} className="flex items-center gap-2 lg:gap-3">
                  <span className="w-6 h-6 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center text-sm font-bold flex-shrink-0">
                    {index + 1}
                  </span>
                  <input
                    type="text"
                    value={priority}
                    onChange={(e) => setPriorities(prev => prev.map((p, i) => i === index ? e.target.value : p))}
                    placeholder={`Priority ${index + 1}...`}
                    className="flex-1 input text-sm"
                  />
                </div>
              ))}
            </div>
          </motion.div>

          {/* Stock Option Play */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card border-t-4 border-t-green-500"
          >
            <div className="flex items-center gap-2 lg:gap-3 mb-4">
              <TrendingUp className="w-5 h-5 lg:w-6 lg:h-6 text-green-400" />
              <h2 className="text-lg lg:text-xl font-bold">Stock Option Play</h2>
            </div>
            <textarea
              value={stockPlay}
              onChange={(e) => setStockPlay(e.target.value)}
              placeholder="Today's option play strategy..."
              className="w-full input h-20 lg:h-24 resize-none text-sm"
            />
            <div className="mt-3 flex items-center gap-2 text-xs lg:text-sm text-gray-400">
              <Clock className="w-4 h-4" />
              <span>Pre-market: 6:30 AM</span>
            </div>
          </motion.div>

          {/* Deep Thought */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card bg-gradient-to-br from-purple-900/30 to-dark-800"
          >
            <div className="flex items-center gap-2 lg:gap-3 mb-3">
              <Quote className="w-4 h-4 lg:w-5 lg:h-5 text-purple-400" />
              <h3 className="font-bold text-purple-400 text-sm lg:text-base">Deep Thought</h3>
            </div>
            <p className="text-base lg:text-lg italic text-gray-300">"{deepThought}"</p>
            <button 
              onClick={() => setDeepThought(DEEP_THOUGHTS[Math.floor(Math.random() * DEEP_THOUGHTS.length)])}
              className="mt-4 text-xs lg:text-sm text-purple-400 hover:text-purple-300 flex items-center gap-1 touch-target"
            >
              <Zap className="w-4 h-4" />
              New Quote
            </button>
          </motion.div>
        </div>

        {/* Middle Column - Health & Nutrition */}
        <div className="space-y-4 lg:space-y-6">
          {/* Gym Status */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card border-t-4 border-t-blue-500"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 lg:gap-3">
                <Dumbbell className="w-5 h-5 lg:w-6 lg:h-6 text-blue-400" />
                <h2 className="text-lg lg:text-xl font-bold">Gym Status</h2>
              </div>
              <button 
                onClick={advanceWorkoutDay}
                className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 touch-target"
              >
                Mark Complete
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            
            <div className="bg-blue-500/10 rounded-lg p-3 lg:p-4 border border-blue-500/30">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl lg:text-3xl">{todayWorkout.icon}</span>
                <div>
                  <p className="text-xs lg:text-sm text-gray-400">Day {currentDay} of 4</p>
                  <p className="font-bold text-base lg:text-lg">{todayWorkout.name}</p>
                </div>
              </div>
            </div>

            <div className="mt-4 flex gap-1">
              {WORKOUT_CYCLE.map((day, index) => (
                <div 
                  key={day.day}
                  className={`flex-1 h-2 rounded-full ${
                    index + 1 === currentDay ? 'bg-blue-500' : 'bg-dark-700'
                  }`}
                />
              ))}
            </div>

            <div className="mt-4 flex items-center gap-2 text-xs lg:text-sm">
              <Flame className="w-4 h-4 text-orange-400" />
              <span className="text-gray-400">Preferred: Early morning or pre-lunch</span>
            </div>
          </motion.div>

          {/* Nutrition Checklist */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card border-t-4 border-t-orange-500"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 lg:gap-3">
                <Utensils className="w-5 h-5 lg:w-6 lg:h-6 text-orange-400" />
                <h2 className="text-lg lg:text-xl font-bold">Nutrition</h2>
              </div>
              <span className="badge bg-orange-500/20 text-orange-400 text-xs">
                {completedNutrition}/{nutrition.length}
              </span>
            </div>

            <div className="space-y-2">
              {nutrition.map((meal, index) => (
                <button
                  key={index}
                  onClick={() => toggleNutritionItem(index)}
                  className={`w-full text-left p-2 lg:p-3 rounded-lg border transition-all ${
                    meal.completed 
                      ? 'bg-green-500/10 border-green-500/30' 
                      : 'bg-dark-700/50 border-dark-600 hover:border-orange-500/30'
                  }`}
                >
                  <div className="flex items-start gap-2 lg:gap-3">
                    {meal.completed ? (
                      <CheckCircle2 className="w-4 h-4 lg:w-5 lg:h-5 text-green-400 mt-0.5 flex-shrink-0" />
                    ) : (
                      <Circle className="w-4 h-4 lg:w-5 lg:h-5 text-gray-500 mt-0.5 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium text-sm ${meal.completed ? 'text-green-400' : ''}`}>
                        {meal.time}
                      </p>
                      <p className="text-xs text-gray-400">
                        {meal.items.join(', ')}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>

          {/* Supplements */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="card"
          >
            <h3 className="font-bold mb-3 flex items-center gap-2 text-sm lg:text-base">
              <Zap className="w-4 h-4 lg:w-5 lg:h-5 text-yellow-400" />
              Supplements
            </h3>
            <div className="space-y-2">
              {supplements.map((supp, index) => (
                <button
                  key={index}
                  onClick={() => toggleSupplement(index)}
                  className={`w-full flex items-center gap-2 lg:gap-3 p-2 rounded-lg transition-all ${
                    supp.completed ? 'bg-green-500/10' : 'hover:bg-dark-700'
                  }`}
                >
                  {supp.completed ? (
                    <CheckCircle2 className="w-4 h-4 lg:w-5 lg:h-5 text-green-400 flex-shrink-0" />
                  ) : (
                    <Circle className="w-4 h-4 lg:w-5 lg:h-5 text-gray-500 flex-shrink-0" />
                  )}
                  <div className="flex-1 text-left min-w-0">
                    <p className={`font-medium text-sm ${supp.completed ? 'text-green-400' : ''}`}>
                      {supp.name}
                    </p>
                    <p className="text-xs text-gray-400">{supp.timing}</p>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Right Column - Workflow & Focus */}
        <div className="space-y-4 lg:space-y-6">
          {/* Workflow Blocks */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card border-t-4 border-t-purple-500"
          >
            <div className="flex items-center gap-2 lg:gap-3 mb-4">
              <Clock className="w-5 h-5 lg:w-6 lg:h-6 text-purple-400" />
              <h2 className="text-lg lg:text-xl font-bold">Workflow Blocks</h2>
            </div>
            
            <div className="space-y-3 lg:space-y-4">
              <div>
                <label className="text-xs lg:text-sm text-gray-400 mb-1 block">Morning Block (8am-12pm)</label>
                <input
                  type="text"
                  value={workflowBlocks.morning}
                  onChange={(e) => setWorkflowBlocks(prev => ({ ...prev, morning: e.target.value }))}
                  placeholder="Primary focus..."
                  className="w-full input text-sm"
                />
              </div>
              <div>
                <label className="text-xs lg:text-sm text-gray-400 mb-1 block">Afternoon Block (12pm-4pm)</label>
                <input
                  type="text"
                  value={workflowBlocks.afternoon}
                  onChange={(e) => setWorkflowBlocks(prev => ({ ...prev, afternoon: e.target.value }))}
                  placeholder="Primary focus..."
                  className="w-full input text-sm"
                />
              </div>
              <div>
                <label className="text-xs lg:text-sm text-gray-400 mb-1 block">Evening Block (4pm-8pm)</label>
                <input
                  type="text"
                  value={workflowBlocks.evening}
                  onChange={(e) => setWorkflowBlocks(prev => ({ ...prev, evening: e.target.value }))}
                  placeholder="Primary focus..."
                  className="w-full input text-sm"
                />
              </div>
            </div>
          </motion.div>

          {/* Distraction to Avoid */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="card border-t-4 border-t-red-500"
          >
            <div className="flex items-center gap-2 lg:gap-3 mb-4">
              <AlertTriangle className="w-5 h-5 lg:w-6 lg:h-6 text-red-400" />
              <h2 className="text-lg lg:text-xl font-bold">Avoid Today</h2>
            </div>
            <select
              value={distractionToAvoid}
              onChange={(e) => setDistractionToAvoid(e.target.value)}
              className="w-full input text-sm"
            >
              <option value="">Select distraction to avoid...</option>
              {DISTRACTIONS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            {distractionToAvoid && (
              <div className="mt-4 p-3 lg:p-4 bg-red-500/10 rounded-lg border border-red-500/30">
                <p className="text-red-400 font-medium text-center text-sm">{distractionToAvoid}</p>
              </div>
            )}
          </motion.div>

          {/* Hydration */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="card"
          >
            <h3 className="font-bold mb-3 flex items-center gap-2 text-sm lg:text-base">
              <span className="text-lg lg:text-xl">💧</span>
              Hydration Log
            </h3>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs lg:text-sm text-gray-400">Check 2-3x daily</span>
              <span className="badge bg-blue-500/20 text-blue-400 text-xs">{hydrationCount} checks</span>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setHydrationCount(prev => Math.max(0, prev - 1))}
                className="btn-secondary flex-1 touch-target"
              >
                <Minus className="w-4 h-4 mx-auto" />
              </button>
              <button 
                onClick={() => setHydrationCount(prev => prev + 1)}
                className="btn-primary flex-1 touch-target"
              >
                Log Check
              </button>
            </div>
          </motion.div>

          {/* Health Drinks */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="card"
          >
            <h3 className="font-bold mb-3 flex items-center gap-2 text-sm lg:text-base">
              <Brain className="w-4 h-4 lg:w-5 lg:h-5 text-pink-400" />
              Health Drinks
            </h3>
            <div className="space-y-2">
              {healthDrinks.map((drink, index) => (
                <button
                  key={index}
                  onClick={() => toggleHealthDrink(index)}
                  className={`w-full flex items-center gap-2 lg:gap-3 p-2 rounded-lg transition-all ${
                    drink.completed ? 'bg-green-500/10' : 'hover:bg-dark-700'
                  }`}
                >
                  {drink.completed ? (
                    <CheckCircle2 className="w-4 h-4 lg:w-5 lg:h-5 text-green-400 flex-shrink-0" />
                  ) : (
                    <Circle className="w-4 h-4 lg:w-5 lg:h-5 text-gray-500 flex-shrink-0" />
                  )}
                  <span className={`flex-1 text-left text-sm ${drink.completed ? 'text-green-400' : ''}`}>
                    {drink.name}
                  </span>
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
