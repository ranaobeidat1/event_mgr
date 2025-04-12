import { StyleSheet, Text, SafeAreaView } from 'react-native';
import React from 'react';
import { useLocalSearchParams } from 'expo-router';

const ClassDetails = () => {
  const { id } = useLocalSearchParams();
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.text}>Details: {id}</Text>
    </SafeAreaView>
  );
};

export default ClassDetails;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  text: {
    fontSize: 20,
  },
});
