import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface ModernActionButtonProps {
  onPress: () => void;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
}

interface ModernActionButtonsProps {
  onEdit?: () => void;
  onDelete?: () => void;
  onAdd?: () => void;
  showEdit?: boolean;
  showDelete?: boolean;
  showAdd?: boolean;
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
}

// Your app's color scheme
const APP_COLORS = {
  edit: {
    background: '#FFFFFF', // White background
    text: '#F89A1E',
    icon: '#F89A1E'
  },
  delete: {
    background: '#FFFFFF', // White background
    text: '#DC2626',
    icon: '#DC2626'
  },
  add: {
    background: '#FFFFFF', // White background
    text: '#F89A1E',
    icon: '#F89A1E'
  },
};

const getSizeStyles = (size: 'small' | 'medium' | 'large') => {
  switch (size) {
    case 'small':
      return {
        paddingHorizontal: 10,
        paddingVertical: 6,
        fontSize: 11,
        iconSize: 14,
        gap: 4,
      };
    case 'large':
      return {
        paddingHorizontal: 16,
        paddingVertical: 10,
        fontSize: 15,
        iconSize: 18,
        gap: 6,
      };
    default: // medium
      return {
        paddingHorizontal: 12,
        paddingVertical: 8,
        fontSize: 13,
        iconSize: 16,
        gap: 5,
      };
  }
};

const ModernEditButton: React.FC<ModernActionButtonProps> = ({ 
  onPress, 
  disabled = false, 
  size = 'medium' 
}) => {
  const sizeStyles = getSizeStyles(size);
  
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      style={({ pressed }) => [
        {
          width: 56,
          height: 56,
          backgroundColor: APP_COLORS.edit.background,
          borderRadius: 28, // Full circle
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1,
          borderColor: 'rgba(0, 0, 0, 0.08)',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.15,
          shadowRadius: 10,
          elevation: 10,
          transform: [{ scale: pressed ? 0.9 : 1 }],
          opacity: disabled ? 0.5 : 1,
        },
      ]}
    >
      <Ionicons name="create-outline" size={20} color={APP_COLORS.edit.icon} />
    </Pressable>
  );
};

const ModernDeleteButton: React.FC<ModernActionButtonProps> = ({ 
  onPress, 
  disabled = false, 
  size = 'medium' 
}) => {
  const sizeStyles = getSizeStyles(size);
  
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      style={({ pressed }) => [
        {
          width: 56,
          height: 56,
          backgroundColor: APP_COLORS.delete.background,
          borderRadius: 28, // Full circle
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1,
          borderColor: 'rgba(0, 0, 0, 0.08)',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.15,
          shadowRadius: 10,
          elevation: 10,
          transform: [{ scale: pressed ? 0.9 : 1 }],
          opacity: disabled ? 0.5 : 1,
        },
      ]}
    >
      <Ionicons name="trash-outline" size={20} color={APP_COLORS.delete.icon} />
    </Pressable>
  );
};

const ModernAddButton: React.FC<ModernActionButtonProps> = ({ 
  onPress, 
  disabled = false, 
  size = 'medium' 
}) => {
  const sizeStyles = getSizeStyles(size);
  
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      style={({ pressed }) => [
        {
          width: 56,
          height: 56,
          backgroundColor: 'white',
          borderRadius: 28, // Full circle
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1,
          borderColor: 'rgba(0, 0, 0, 0.08)',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.15,
          shadowRadius: 10,
          elevation: 10,
          transform: [{ scale: pressed ? 0.9 : 1 }],
          opacity: disabled ? 0.5 : 1,
        },
      ]}
    >
      <Ionicons name="add" size={20} color={APP_COLORS.add.icon} />
    </Pressable>
  );
};

const ModernActionButtons: React.FC<ModernActionButtonsProps> = ({
  onEdit,
  onDelete,
  onAdd,
  showEdit = false,
  showDelete = false,
  showAdd = false,
  size = 'medium',
  disabled = false,
}) => {
  return (
    <View style={{ 
      flexDirection: 'row-reverse', // RTL layout
      gap: 8, // Reduced gap for pill buttons
      alignItems: 'center',
      justifyContent: 'flex-end' // Align to right for Hebrew
    }}>
      {showAdd && onAdd && (
        <ModernAddButton onPress={onAdd} disabled={disabled} size={size} />
      )}
      {showEdit && onEdit && (
        <ModernEditButton onPress={onEdit} disabled={disabled} size={size} />
      )}
      {showDelete && onDelete && (
        <ModernDeleteButton onPress={onDelete} disabled={disabled} size={size} />
      )}
    </View>
  );
};

export { ModernActionButtons, ModernEditButton, ModernDeleteButton, ModernAddButton };