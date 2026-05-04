import React, { useState, useRef } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Animated,
  StyleSheet,
  Platform,
} from 'react-native';
import { Search, X } from 'lucide-react-native';

const EXPANDED_WIDTH = 200; // Fixed expanded width — won't push buttons away

const AnimatedSearch = ({
  placeholder = "Search...",
  value,
  onChangeText,
  colors,
  containerStyle,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const animation = useRef(new Animated.Value(0)).current;
  const inputRef = useRef(null);

  const toggleSearch = () => {
    if (isOpen) {
      Animated.timing(animation, {
        toValue: 0,
        duration: 350,
        useNativeDriver: false,
      }).start(() => {
        setIsOpen(false);
        onChangeText('');
      });
    } else {
      setIsOpen(true);
      Animated.timing(animation, {
        toValue: 1,
        duration: 450,
        useNativeDriver: false,
      }).start(() => {
        inputRef.current?.focus();
      });
    }
  };

  const searchWidth = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [40, EXPANDED_WIDTH],
  });

  const borderRadius = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [20, 10],
  });

  const inputOpacity = animation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0, 1],
  });

  return (
    <View style={[styles.container, containerStyle]}>
      <Animated.View
        style={[
          styles.searchContainer,
          {
            width: searchWidth,
            borderRadius: borderRadius,
            backgroundColor: isOpen ? colors.cardBg : (colors.iconBg || colors.cardBg),
            borderColor: isOpen ? colors.accent + '80' : colors.border,
            borderWidth: 1,
          },
        ]}
      >
        <TouchableOpacity
          onPress={toggleSearch}
          style={styles.iconButton}
          activeOpacity={0.7}
        >
          {isOpen ? (
            <X size={16} color={colors.accent} />
          ) : (
            <Search size={16} color={colors.textSecondary} />
          )}
        </TouchableOpacity>

        {isOpen && (
          <Animated.View style={[styles.inputWrapper, { opacity: inputOpacity }]}>
            <TextInput
              ref={inputRef}
              style={[styles.input, { color: colors.textPrimary }]}
              placeholder={placeholder}
              placeholderTextColor={colors.textSecondary}
              value={value}
              onChangeText={onChangeText}
              autoFocus={false}
            />
          </Animated.View>
        )}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 40,
    justifyContent: 'center',
    // No flex: 1 — stays compact, doesn't grow
  },
  searchContainer: {
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  iconButton: {
    width: 38,
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  inputWrapper: {
    flex: 1,
    height: '100%',
    paddingRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 13,
    height: '100%',
  },
});

export default AnimatedSearch;
