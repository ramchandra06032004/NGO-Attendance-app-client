import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
} from 'react-native';
import { Filter, ChevronDown, ChevronUp } from 'lucide-react-native';

const CollapsibleFilter = ({
  children,
  colors,
  title = "Filters",
  containerStyle,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const animation = useRef(new Animated.Value(0)).current;

  const toggleFilter = () => {
    if (isExpanded) {
      Animated.timing(animation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }).start(() => setIsExpanded(false));
    } else {
      setIsExpanded(true);
      Animated.timing(animation, {
        toValue: 1,
        duration: 400,
        useNativeDriver: false,
      }).start();
    }
  };

  const maxHeight = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 250],
  });

  const opacity = animation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0, 1],
  });

  return (
    <View style={[styles.container, containerStyle]}>
      {/* Compact inline toggle button — auto width, not full width */}
      <TouchableOpacity
        onPress={toggleFilter}
        style={[
          styles.toggleButton,
          {
            backgroundColor: isExpanded ? colors.accent + '20' : (colors.iconBg || colors.cardBg),
            borderColor: isExpanded ? colors.accent : colors.border,
          },
        ]}
        activeOpacity={0.7}
      >
        <Filter
          size={14}
          color={isExpanded ? colors.accent : colors.textSecondary}
          style={{ marginRight: 5 }}
        />
        <Text style={[styles.toggleText, { color: isExpanded ? colors.accent : colors.textSecondary }]}>
          {title}
        </Text>
        {isExpanded ? (
          <ChevronUp size={13} color={colors.accent} style={{ marginLeft: 4 }} />
        ) : (
          <ChevronDown size={13} color={colors.textSecondary} style={{ marginLeft: 4 }} />
        )}
      </TouchableOpacity>

      <Animated.View style={{ maxHeight, opacity, overflow: 'hidden' }}>
        <View style={styles.content}>
          {children}
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start', // ← KEY: does NOT stretch to full width
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 4,
  },
  toggleText: {
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    paddingTop: 8,
    paddingBottom: 12,
  },
});

export default CollapsibleFilter;
