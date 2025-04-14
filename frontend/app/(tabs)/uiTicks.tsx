import TicketDetailsScreen from '@/components/ticketDetails';
import SafeAreaScrollableView from '@/components/safe-area-scrollable-view';

const TicksUI = () => {
  return (
    <SafeAreaScrollableView>
      <TicketDetailsScreen />
    </SafeAreaScrollableView>
  );
};

export default TicksUI;