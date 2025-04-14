import Ticket from '@/components/tickets';
import SafeAreaScrollableView from '@/components/safe-area-scrollable-view';
import { useRouter, useLocalSearchParams } from 'expo-router';

const payment = () => {
  const router = useRouter();
  const params = useLocalSearchParams();

  // Get the data passed from the previous screen
  const { 
    busId,
    busNumber,
    from,
    to,
    departureTime,
    estimatedTime,
    price,
    index 
  } = params;

  // Helper functions (define these or import them if they exist elsewhere)
  const getDepartureTime = (index: string) => {
    // Your implementation here
    return departureTime as string; // fallback if no calculation needed
  };

  const getEstimatedTime = (index: string) => {
    // Your implementation here
    return estimatedTime as string; // fallback if no calculation needed
  };

  const getPrice = (index: string) => {
    // Your implementation here
    return price as string; // fallback if no calculation needed
  };

  // Prepare the bus data object
  const mockBus = {
    id: busId as string,
    numberPlate: busNumber as string,
    from: from as string,
    to: to as string,
    departureTime: getDepartureTime(index as string),
    estimatedTime: getEstimatedTime(index as string),
    price: getPrice(index as string),
  };

  const handleBack = () => {
    router.back();
  };

};

export default payment;