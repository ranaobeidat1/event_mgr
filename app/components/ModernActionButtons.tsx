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
  edit: '#1A4782',      // Your brand blue
  delete: '#DC2626',    // Clean red
  add: '#F89A1E',       // Your brand yellow/orange
};

const getSizeStyles = (size: 'small' | 'medium' | 'large') => {
  switch (size) {
    case 'small':
      return {
        paddingHorizontal: 12,
        paddingVertical: 6,
        fontSize: 12,
        iconSize: 16,
      };
    case 'large':
      return {
        paddingHorizontal: 20,
        paddingVertical: 12,
        fontSize: 16,
        iconSize: 20,
      };
    default: // medium
      return {
        paddingHorizontal: 16,
        paddingVertical: 8,
        fontSize: 14,
        iconSize: 18,
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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      style={({ pressed }) => [
        {
          flexDirection: 'row-reverse', // RTL for Hebrew
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: APP_COLORS.edit, // Your brand blue
          paddingHorizontal: sizeStyles.paddingHorizontal,
          paddingVertical: sizeStyles.paddingVertical,
          borderRadius: 12,
          shadowColor: APP_COLORS.edit,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.25, // Slightly reduced for subtlety
          shadowRadius: 8,
          elevation: 8,
          transform: [{ scale: pressed ? 0.95 : 1 }],
          opacity: disabled ? 0.5 : 1,
        },
      ]}
    >
      <Text style={{
        color: APP_COLORS.edit,
        fontWeight: '600',
        marginRight: 6, // Changed to marginRight for RTL
        fontSize: sizeStyles.fontSize,
        fontFamily: 'Heebo-SemiBold', // Your app's font
        textAlign: 'right',
      }}>
        עריכה
      </Text>
      <Ionicons name="create-outline" size={sizeStyles.iconSize} color="#1A4782" />
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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      style={({ pressed }) => [
        {
          flexDirection: 'row-reverse', // RTL for Hebrew
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: APP_COLORS.delete, // Clean red
          paddingHorizontal: sizeStyles.paddingHorizontal,
          paddingVertical: sizeStyles.paddingVertical,
          borderRadius: 12,
          shadowColor: APP_COLORS.delete,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.25,
          shadowRadius: 8,
          elevation: 8,
          transform: [{ scale: pressed ? 0.95 : 1 }],
          opacity: disabled ? 0.5 : 1,
        },
      ]}
    >
      <Text style={{
        color: '#DC2626',
        fontWeight: '600',
        marginRight: 6, // Changed to marginRight for RTL
        fontSize: sizeStyles.fontSize,
        fontFamily: 'Heebo-SemiBold', // Your app's font
        textAlign: 'right',
      }}>
        מחק
      </Text>
      <Ionicons name="trash-outline" size={sizeStyles.iconSize} color="#DC2626" />
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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      style={({ pressed }) => [
        {
          flexDirection: 'row-reverse', // RTL for Hebrew
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: APP_COLORS.add, // Your brand yellow
          paddingHorizontal: sizeStyles.paddingHorizontal,
          paddingVertical: sizeStyles.paddingVertical,
          borderRadius: 12,
          shadowColor: APP_COLORS.add,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.25,
          shadowRadius: 8,
          elevation: 8,
          transform: [{ scale: pressed ? 0.95 : 1 }],
          opacity: disabled ? 0.5 : 1,
        },
      ]}
    >
      <Text style={{
        color: '#F89A1E',
        fontWeight: '600',
        marginRight: 6, // Changed to marginRight for RTL
        fontSize: sizeStyles.fontSize,
        fontFamily: 'Heebo-SemiBold', // Your app's font
        textAlign: 'right',
      }}>
        הוסף
      </Text>
      <Ionicons name="add" size={sizeStyles.iconSize} color="#F89A1E" />
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
      gap: 12, 
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