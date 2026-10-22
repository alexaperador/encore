import { HStack, Image, Text, VStack } from '@expo/ui/swift-ui';
import { font, foregroundStyle, padding } from '@expo/ui/swift-ui/modifiers';
import { createLiveActivity, type LiveActivityEnvironment } from 'expo-widgets';
import { Platform } from 'react-native';

type Props = {
  title: string;
  artist: string;
  venue: string;
  date: string;
  time: string;
  status: string;
};

const EncoreConcertActivity = (props: Props, environment: LiveActivityEnvironment) => {
  'widget';

  const accentColor = environment.isLuminanceReduced ? '#F3E1CE' : '#FFCD9F';
  const secondaryColor = environment.isLuminanceReduced ? '#C9A27E' : '#E8CFB8';

  return {
    banner: (
      <HStack modifiers={[padding({ all: 16 })]}>
        <Image systemName="music.note" color={accentColor} />
        <VStack modifiers={[padding({ leading: 10 })]}>
          <Text modifiers={[font({ weight: 'bold', size: 18 }), foregroundStyle(accentColor)]}>
            {props.title}
          </Text>
          <Text modifiers={[font({ weight: 'medium', size: 14 }), foregroundStyle(secondaryColor)]}>
            {props.artist}
          </Text>
          <Text modifiers={[font({ size: 13 }), foregroundStyle(secondaryColor)]}>
            {props.status} · {props.date} · {props.time}
          </Text>
        </VStack>
      </HStack>
    ),
    bannerSmall: (
      <HStack modifiers={[padding({ all: 12 })]}>
        <Image systemName="music.note" color={accentColor} />
        <Text modifiers={[font({ weight: 'bold', size: 16 }), foregroundStyle(accentColor)]}>
          {props.title}
        </Text>
      </HStack>
    ),
    compactLeading: <Image systemName="music.note" color={accentColor} />,
    compactTrailing: <Text modifiers={[foregroundStyle(accentColor)]}>{props.time}</Text>,
    minimal: <Image systemName="music.note" color={accentColor} />,
    expandedLeading: (
      <VStack modifiers={[padding({ all: 12 })]}>
        <Text modifiers={[font({ weight: 'bold', size: 17 }), foregroundStyle(accentColor)]}>
          {props.title}
        </Text>
        <Text modifiers={[font({ size: 13 }), foregroundStyle(secondaryColor)]}>
          {props.artist}
        </Text>
      </VStack>
    ),
    expandedTrailing: (
      <VStack modifiers={[padding({ all: 12 })]}>
        <Text modifiers={[font({ weight: 'bold', size: 18 }), foregroundStyle(accentColor)]}>
          {props.time}
        </Text>
        <Text modifiers={[font({ size: 12 }), foregroundStyle(secondaryColor)]}>
          {props.date}
        </Text>
      </VStack>
    ),
    expandedBottom: (
      <HStack modifiers={[padding({ all: 12 })]}>
        <Image systemName="mappin.and.ellipse" color={secondaryColor} />
        <Text modifiers={[font({ size: 14 }), foregroundStyle(secondaryColor)]}>
          {props.venue} · {props.status}
        </Text>
      </HStack>
    ),
  };
};

const activityFactory = createLiveActivity(
  'EncoreConcertActivity',
  EncoreConcertActivity,
);

function start(props: Props, url?: string) {
  if (Platform.OS !== 'ios') {
    return null;
  }

  try {
    return activityFactory.start(props, url);
  } catch (error) {
    console.warn('Encore Live Activities require an iOS development build.', error);
    return null;
  }
}

export default { start };