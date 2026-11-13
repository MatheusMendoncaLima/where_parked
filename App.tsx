import React from 'react';
import * as Notifications from 'expo-notifications';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { HomeScreen } from './src/screens/HomeScreen';
import { LocationService } from './src/services/location/LocationService';
import { NotificationService } from './src/services/notifications/NotificationService';
import { StorageService } from './src/services/storage/StorageService';

const parkingManagerDependencies = {
  locationService: new LocationService(),
  storageService: new StorageService(),
  notificationService: new NotificationService(),
};

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function App() {
  return (
    <SafeAreaProvider>
      <HomeScreen dependencies={parkingManagerDependencies} />
    </SafeAreaProvider>
  );
}
