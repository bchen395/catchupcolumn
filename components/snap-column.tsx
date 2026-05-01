import { useEffect, useRef } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/colors';
import { Typography } from '@/constants/typography';

export const ITEM_H = 48;
export const PICKER_H = ITEM_H * 5;

// Hours displayed as 1–12 (index 0 = "1", index 11 = "12")
export const HOURS_12 = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
export const MINUTE_ITEMS = ['00', '15', '30', '45'];
export const AMPM_ITEMS = ['AM', 'PM'];

/** Convert a 24-hour value + minute to picker indices */
export const to12hIndices = (hour24: number, minute: number) => ({
  hourIndex: hour24 % 12 === 0 ? 11 : (hour24 % 12) - 1,
  ampmIndex: hour24 < 12 ? 0 : 1,
  minuteIndex: Math.max(0, [0, 15, 30, 45].indexOf(minute)),
});

/** Convert picker indices back to a 24-hour value */
export const from12hTo24 = (hourIndex: number, ampmIndex: number): number => {
  const displayHour = hourIndex + 1; // 1–12
  if (ampmIndex === 0) return displayHour === 12 ? 0 : displayHour;
  return displayHour === 12 ? 12 : displayHour + 12;
};

type SnapColumnProps = {
  data: string[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  visible: boolean;
  width?: number;
};

export const SnapColumn = ({ data, selectedIndex, onSelect, visible, width = 72 }: SnapColumnProps) => {
  const listRef = useRef<FlatList<string>>(null);

  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(() => {
      listRef.current?.scrollToOffset({ offset: selectedIndex * ITEM_H, animated: false });
    }, 50);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const handleScrollEnd = (e: { nativeEvent: { contentOffset: { y: number } } }) => {
    const i = Math.round(e.nativeEvent.contentOffset.y / ITEM_H);
    onSelect(Math.max(0, Math.min(data.length - 1, i)));
  };

  return (
    <View style={{ width, height: PICKER_H }}>
      <FlatList
        ref={listRef}
        data={data}
        keyExtractor={(_, i) => String(i)}
        snapToInterval={ITEM_H}
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingVertical: ITEM_H * 2 }}
        getItemLayout={(_, index) => ({ length: ITEM_H, offset: ITEM_H * index, index })}
        onMomentumScrollEnd={handleScrollEnd}
        renderItem={({ item, index }) => (
          <Pressable
            onPress={() => {
              listRef.current?.scrollToOffset({ offset: index * ITEM_H, animated: true });
              onSelect(index);
            }}
            style={styles.item}
          >
            <ThemedText
              variant="body"
              style={selectedIndex === index ? styles.textActive : styles.text}
            >
              {item}
            </ThemedText>
          </Pressable>
        )}
      />
      <View pointerEvents="none" style={styles.highlight} />
    </View>
  );
};

const styles = StyleSheet.create({
  item: {
    height: ITEM_H,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: Colors.textMuted,
  },
  textActive: {
    color: Colors.accentNavy,
    fontFamily: Typography.families.sansSemiBold,
  },
  highlight: {
    position: 'absolute',
    top: ITEM_H * 2,
    left: 4,
    right: 4,
    height: ITEM_H,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.border,
  },
});
