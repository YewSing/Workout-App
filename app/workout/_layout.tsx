import { Stack } from 'expo-router';

export default function WorkoutLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false, // Completely hide the default header
      }}
    />
  );
}
