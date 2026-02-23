import { useState, useEffect } from 'react';
import { 
  Dumbbell, 
  Calendar, 
  TrendingUp,
  CheckCircle2,
  Circle,
  ChevronLeft,
  ChevronRight,
  Trophy,
  Flame,
  Droplets,
  Plus,
  Minus
} from 'lucide-react';
import { motion } from 'framer-motion';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';

// Workout cycle
const WORKOUT_CYCLE = [
  { 
    day: 1, 
    name: 'Chest, Shoulders, Triceps', 
    icon: '💪', 
    color: 'red',
    exercises: ['Bench Press', 'Overhead Press', 'Incline DB Press', 'Lateral Raises', 'Tricep Pushdowns', 'Dips']
  },
  { 
    day: 2, 
    name: 'Back, Biceps', 
    icon: '🔥', 
    color: 'blue',
    exercises: ['Deadlifts', 'Pull-ups', 'Barbell Rows', 'Face Pulls', 'Barbell Curls', 'Hammer Curls']
  },
  { 
    day: 3, 
    name: 'Legs, Shoulders', 
    icon: '🦵', 
    color: 'green',
    exercises: ['Squats', 'Romanian Deadlifts', 'Leg Press', 'Calf Raises', 'Arnold Press', 'Rear Delt Flyes']
  },
  { 
    day: 4, 
    name: 'Chest, Back, Arms', 
    icon: '⚡', 
    color: 'purple',
    exercises: ['Incline Bench', 'Cable Rows', 'Chest Flyes', 'Lat Pulldowns', 'Skullcrushers', 'Preacher Curls']
  },
];

// Weekly schedule template
const WEEK_TEMPLATE = [
  { day: 'Mon', workoutDay: 1, completed: false },
  { day: 'Tue', workoutDay: 2, completed: false },
  { day: 'Wed', workoutDay: 3, completed: false },
  { day: 'Thu', workoutDay: null, completed: false, isRest: true },
  { day: 'Fri', workoutDay: 4, completed: false },
  { day: 'Sat', workoutDay: null, completed: false, isRest: true },
  { day: 'Sun', workoutDay: null, completed: false, isRest: true },
];

// Nutrition tracking
const NUTRITION_TRACKER = {
  meals: [
    { name: 'Morning (within 60 min)', items: ['2 bananas', 'Eggs + English muffin', 'Water'], completed: false },
    { name: 'Mid-Morning Shake', items: ['30g collagen protein'], completed: false },
    { name: 'Lunch', items: ['Chicken', 'Rice', 'Vegetables'], completed: false },
    { name: 'Afternoon', items: ['Chicken', 'Rice'], completed: false },
    { name: 'Evening Shake', items: ['Protein shake'], completed: false },
  ],
  supplements: [
    { name: 'Creatine', timing: 'With meal/shake', daily: true, completed: false },
    { name: 'Magnesium Glycinate', timing: 'Evening, before bed', daily: true, completed: false },
  ],
  healthDrinks: [
    { name: 'Beet + Ginger + Apple + Lemon', completed: false },
    { name: 'Watermelon (hydration)', completed: false },
  ],
};

// Stats tracking
interface WorkoutStats {
  totalWorkouts: number;
  currentStreak: number;
  bestStreak: number;
  thisWeek: number;
  lastWorkout: Date | null;
}

export default function HealthTracker() {
  const [currentDay, setCurrentDay] = useState(1);
  const [weekSchedule, setWeekSchedule] = useState(WEEK_TEMPLATE);
  const [nutrition, setNutrition] = useState(NUTRITION_TRACKER);
  const [hydrationGlasses, setHydrationGlasses] = useState(0);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [stats, setStats] = useState<WorkoutStats>({
    totalWorkouts: 0,
    currentStreak: 0,
    bestStreak: 0,
    thisWeek: 0,
    lastWorkout: null,
  });

  // Load saved data
  useEffect(() => {
    const saved = localStorage.getItem('healthTracker');
    if (saved) {
      const data = JSON.parse(saved);
      setCurrentDay(data.currentDay || 1);
      setWeekSchedule(data.weekSchedule || WEEK_TEMPLATE);
      setNutrition(data.nutrition || NUTRITION_TRACKER);
      setHydrationGlasses(data.hydrationGlasses || 0);
      setStats(data.stats || { totalWorkouts: 0, currentStreak: 0, bestStreak: 0, thisWeek: 0, lastWorkout: null });
    }
  }, []);

  // Save data
  useEffect(() => {
    localStorage.setItem('healthTracker', JSON.stringify({
      currentDay,
      weekSchedule,
      nutrition,
      hydrationGlasses,
      stats,
      lastUpdated: new Date().toISOString(),
    }));
  }, [currentDay, weekSchedule, nutrition, hydrationGlasses, stats]);

  const toggleWorkoutComplete = (index: number) => {
    setWeekSchedule(prev => prev.map((day, i) => {
      if (i === index) {
        const newCompleted = !day.completed;
        // Update stats
        if (newCompleted && !day.isRest) {
          setStats(s => ({
            ...s,
            totalWorkouts: s.totalWorkouts + 1,
            thisWeek: s.thisWeek + 1,
            lastWorkout: new Date(),
          }));
        }
        return { ...day, completed: newCompleted };
      }
      return day;
    }));
  };

  const toggleMeal = (mealIndex: number) => {
    setNutrition(prev => ({
      ...prev,
      meals: prev.meals.map((meal, i) => 
        i === mealIndex ? { ...meal, completed: !meal.completed } : meal
      )
    }));
  };

  const toggleSupplement = (suppIndex: number) => {
    setNutrition(prev => ({
      ...prev,
      supplements: prev.supplements.map((supp, i) => 
        i === suppIndex ? { ...supp, completed: !supp.completed } : supp
      )
    }));
  };

  const toggleHealthDrink = (drinkIndex: number) => {
    setNutrition(prev => ({
      ...prev,
      healthDrinks: prev.healthDrinks.map((drink, i) => 
        i === drinkIndex ? { ...drink, completed: !drink.completed } : drink
      )
    }));
  };

  const advanceDay = () => {
    setCurrentDay(prev => prev >= 4 ? 1 : prev + 1);
  };

  const goBackDay = () => {
    setCurrentDay(prev => prev <= 1 ? 4 : prev - 1);
  };

  const todayWorkout = WORKOUT_CYCLE[currentDay - 1];
  const completedMeals = nutrition.meals.filter(m => m.completed).length;
  const completedSupplements = nutrition.supplements.filter(s => s.completed).length;
  const completedHealthDrinks = nutrition.healthDrinks.filter(d => d.completed).length;
  const completedWorkoutsThisWeek = weekSchedule.filter(d => d.completed && !d.isRest).length;

  // Get week dates
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center">
            <Dumbbell className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Health & Gym Tracker</h1>
            <p className="text-gray-400">4-day cycle • Consistency over intensity</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="card flex items-center gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold">{stats.totalWorkouts}</p>
              <p className="text-xs text-gray-400">Total</p>
            </div>
            <div className="w-px h-10 bg-dark-600" />
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-400">{stats.currentStreak}</p>
              <p className="text-xs text-gray-400">Streak</p>
            </div>
            <div className="w-px h-10 bg-dark-600" />
            <div className="text-center">
              <p className="text-2xl font-bold text-green-400">{completedWorkoutsThisWeek}/4</p>
              <p className="text-xs text-gray-400">This Week</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left Column - Current Workout */}
        <div className="space-y-6">
          {/* Current Day Workout */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card border-t-4 border-t-blue-500"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <span className="text-2xl">{todayWorkout.icon}</span>
                Today's Workout
              </h2>
              <div className="flex items-center gap-2">
                <button onClick={goBackDay} className="p-1 hover:bg-dark-700 rounded">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="badge bg-blue-500/20 text-blue-400">Day {currentDay}</span>
                <button onClick={advanceDay} className="p-1 hover:bg-dark-700 rounded">
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="bg-blue-500/10 rounded-lg p-4 border border-blue-500/30 mb-4">
              <h3 className="font-bold text-lg mb-1">{todayWorkout.name}</h3>
              <p className="text-sm text-gray-400">6 exercises • 60-75 minutes</p>
            </div>

            <div className="space-y-2">
              {todayWorkout.exercises.map((exercise, index) => (
                <div key={index} className="flex items-center gap-3 p-2 bg-dark-700/50 rounded-lg">
                  <span className="w-6 h-6 rounded-full bg-dark-600 flex items-center justify-center text-xs font-medium">
                    {index + 1}
                  </span>
                  <span>{exercise}</span>
                </div>
              ))}
            </div>

            <button className="w-full mt-4 btn-primary flex items-center justify-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              Log Workout Complete
            </button>
          </motion.div>

          {/* Hydration Tracker */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card border-t-4 border-t-cyan-500"
          >
            <div className="flex items-center gap-3 mb-4">
              <Droplets className="w-6 h-6 text-cyan-400" />
              <h2 className="text-xl font-bold">Hydration</h2>
            </div>

            <div className="flex items-center justify-center gap-4 mb-4">
              <button 
                onClick={() => setHydrationGlasses(Math.max(0, hydrationGlasses - 1))}
                className="p-3 bg-dark-700 hover:bg-dark-600 rounded-lg transition-colors"
              >
                <Minus className="w-5 h-5" />
              </button>
              <div className="text-center">
                <p className="text-4xl font-bold text-cyan-400">{hydrationGlasses}</p>
                <p className="text-sm text-gray-400">glasses</p>
              </div>
              <button 
                onClick={() => setHydrationGlasses(hydrationGlasses + 1)}
                className="p-3 bg-dark-700 hover:bg-dark-600 rounded-lg transition-colors"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            <div className="flex justify-center gap-1">
              {Array.from({ length: 8 }).map((_, i) => (
                <div 
                  key={i}
                  className={`w-8 h-12 rounded-md ${
                    i < hydrationGlasses ? 'bg-cyan-500' : 'bg-dark-700'
                  }`}
                />
              ))}
            </div>
            <p className="text-center text-sm text-gray-400 mt-3">Goal: 8 glasses</p>
          </motion.div>
        </div>

        {/* Middle Column - Weekly Schedule */}
        <div className="space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card"
          >
            <div className="flex items-center gap-3 mb-4">
              <Calendar className="w-6 h-6 text-purple-400" />
              <h2 className="text-xl font-bold">Weekly Schedule</h2>
            </div>

            <div className="space-y-3">
              {weekSchedule.map((day, index) => {
                const workout = day.workoutDay ? WORKOUT_CYCLE[day.workoutDay - 1] : null;
                const isToday = isSameDay(weekDates[index], new Date());
                
                return (
                  <div 
                    key={day.day}
                    onClick={() => !day.isRest && toggleWorkoutComplete(index)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      isToday ? 'border-brand-500 bg-brand-500/10' : 'border-dark-600'
                    } ${day.completed ? 'bg-green-500/10 border-green-500/30' : 'hover:border-dark-500'}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          day.completed ? 'bg-green-500/20' : 
                          day.isRest ? 'bg-gray-500/20' : 'bg-dark-700'
                        }`}>
                          {day.completed ? (
                            <CheckCircle2 className="w-5 h-5 text-green-400" />
                          ) : day.isRest ? (
                            <span className="text-lg">😴</span>
                          ) : (
                            <span className="text-lg">{workout?.icon}</span>
                          )}
                        </div>
                        <div>
                          <p className={`font-medium ${isToday ? 'text-brand-400' : ''}`}>
                            {day.day} {isToday && '(Today)'}
                          </p>
                          <p className="text-sm text-gray-400">
                            {day.isRest ? 'Rest Day' : workout?.name}
                          </p>
                        </div>
                      </div>
                      {!day.isRest && (
                        day.completed ? (
                          <span className="badge bg-green-500/20 text-green-400">Done</span>
                        ) : (
                          <Circle className="w-5 h-5 text-gray-500" />
                        )
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 4-Day Cycle Visualization */}
            <div className="mt-6 pt-6 border-t border-dark-600">
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-gray-400" />
                4-Day Cycle Progress
              </h3>
              <div className="flex gap-2">
                {WORKOUT_CYCLE.map((day) => (
                  <div 
                    key={day.day}
                    className={`flex-1 p-2 rounded-lg text-center ${
                      day.day === currentDay 
                        ? 'bg-blue-500/20 border border-blue-500/50' 
                        : 'bg-dark-700'
                    }`}
                  >
                    <p className="text-2xl mb-1">{day.icon}</p>
                    <p className="text-xs text-gray-400">Day {day.day}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Achievements */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card"
          >
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-400" />
              Achievements
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/30">
                <Flame className="w-8 h-8 text-orange-400" />
                <div className="flex-1">
                  <p className="font-medium">Week Warrior</p>
                  <p className="text-sm text-gray-400">Complete all 4 workouts in a week</p>
                </div>
                {completedWorkoutsThisWeek === 4 ? (
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                ) : (
                  <span className="text-sm text-gray-400">{completedWorkoutsThisWeek}/4</span>
                )}
              </div>
              <div className="flex items-center gap-3 p-3 bg-dark-700 rounded-lg">
                <Droplets className="w-8 h-8 text-cyan-400" />
                <div className="flex-1">
                  <p className="font-medium">Hydration Master</p>
                  <p className="text-sm text-gray-400">Drink 8 glasses for 7 days straight</p>
                </div>
                <span className="text-sm text-gray-400">0/7</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right Column - Nutrition & Supplements */}
        <div className="space-y-6">
          {/* Meal Tracker */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card border-t-4 border-t-orange-500"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Nutrition</h2>
              <span className="badge bg-orange-500/20 text-orange-400">
                {completedMeals}/{nutrition.meals.length}
              </span>
            </div>

            <div className="space-y-2">
              {nutrition.meals.map((meal, index) => (
                <button
                  key={index}
                  onClick={() => toggleMeal(index)}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                    meal.completed 
                      ? 'bg-green-500/10 border-green-500/30' 
                      : 'bg-dark-700/50 border-dark-600 hover:border-orange-500/30'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {meal.completed ? (
                      <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5" />
                    ) : (
                      <Circle className="w-5 h-5 text-gray-500 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p className={`font-medium ${meal.completed ? 'text-green-400' : ''}`}>
                        {meal.name}
                      </p>
                      <p className="text-sm text-gray-400">
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
            <h3 className="font-bold mb-3">Supplements</h3>
            <div className="space-y-2">
              {nutrition.supplements.map((supp, index) => (
                <button
                  key={index}
                  onClick={() => toggleSupplement(index)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all ${
                    supp.completed 
                      ? 'bg-green-500/10 border-green-500/30' 
                      : 'bg-dark-700/50 border-dark-600 hover:border-yellow-500/30'
                  }`}
                >
                  {supp.completed ? (
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                  ) : (
                    <Circle className="w-5 h-5 text-gray-500" />
                  )}
                  <div className="flex-1 text-left">
                    <p className={`font-medium ${supp.completed ? 'text-green-400' : ''}`}>
                      {supp.name}
                    </p>
                    <p className="text-xs text-gray-400">{supp.timing}</p>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>

          {/* Health Drinks */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="card"
          >
            <h3 className="font-bold mb-3">Health Drinks</h3>
            <div className="space-y-2">
              {nutrition.healthDrinks.map((drink, index) => (
                <button
                  key={index}
                  onClick={() => toggleHealthDrink(index)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all ${
                    drink.completed 
                      ? 'bg-green-500/10 border-green-500/30' 
                      : 'bg-dark-700/50 border-dark-600 hover:border-pink-500/30'
                  }`}
                >
                  {drink.completed ? (
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                  ) : (
                    <Circle className="w-5 h-5 text-gray-500" />
                  )}
                  <span className={`flex-1 text-left ${drink.completed ? 'text-green-400' : ''}`}>
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
