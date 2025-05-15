import { Redirect } from 'expo-router';

export default function Index() {
  // This redirects from the root / to /login when the app starts
  return <Redirect href="/login" />;
}
