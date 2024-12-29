import { Text, TouchableOpacity } from 'react-native';
import SafeAreaScrollableView from '@/components/safe-area-scrollable-view';
import { useAuth } from '@/context/auth-context';

const Settings = () => {
  const { onLogout } = useAuth();

  return (
    <SafeAreaScrollableView>
      <TouchableOpacity onPress={onLogout}>
        <Text>Logout</Text>
      </TouchableOpacity>
    </SafeAreaScrollableView>
  );
};

export default Settings;
