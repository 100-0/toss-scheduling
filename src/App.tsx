import MobileFrame from './components/MobileFrame';
import DemoControls from './components/DemoControls';
import HomeScreen from './screens/HomeScreen';
import AvoidTimeScreen from './screens/AvoidTimeScreen';
import YieldTimeScreen from './screens/YieldTimeScreen';
import SuggestTimeScreen from './screens/SuggestTimeScreen';
import ExploreTimesScreen from './screens/ExploreTimesScreen';
import CompleteScreen from './screens/CompleteScreen';
import GuestDoneScreen from './screens/GuestDoneScreen';
import CalendarSheet from './screens/CalendarSheet';
import QuickExcludeModal from './components/QuickExcludeModal';
import RequestYieldSheet from './screens/RequestYieldSheet';
import ConfirmTimeSheet from './screens/ConfirmTimeSheet';
import { useAppStore } from './store/useAppStore';

const SCREEN_MAP = {
  home: HomeScreen,
  avoidTime: AvoidTimeScreen,
  yieldTime: YieldTimeScreen,
  suggestTime: SuggestTimeScreen,
  exploreTimes: ExploreTimesScreen,
  complete: CompleteScreen,
  guestDone: GuestDoneScreen,
};

function App() {
  const screen = useAppStore((s) => s.screenByUser[s.currentUser]);
  const activeSheet = useAppStore((s) => s.activeSheet);

  const Screen = SCREEN_MAP[screen];

  return (
    <div className="min-h-svh w-full flex items-center justify-center bg-gray-05 min-[480px]:gap-10 min-[480px]:py-10 min-[480px]:px-6">
      <MobileFrame>
        <Screen />
        {activeSheet === 'calendar' && <CalendarSheet />}
        {activeSheet === 'quickExclude' && <QuickExcludeModal />}
        {activeSheet === 'requestYield' && <RequestYieldSheet />}
        {activeSheet === 'confirmTime' && <ConfirmTimeSheet />}
      </MobileFrame>
      <DemoControls />
    </div>
  );
}

export default App;
