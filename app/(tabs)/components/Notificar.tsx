import { HStack, Image, Text, VStack } from '@expo/ui/swift-ui';
import { font, padding } from '@expo/ui/swift-ui/modifiers';
import { createLiveActivity, type LiveActivityEnvironment } from 'expo-widgets';

type Props = { local: string; visitante: string; hora: string; estado: string };

const PartidoActivity = (props: Props, _env: LiveActivityEnvironment) => {
    'widget';
    return {
        banner: (
            <VStack modifiers={[padding({ all: 12 })]}>
                <Text modifiers={[font({ weight: 'bold', size: 18 })]}>
                    {props.local} vs {props.visitante}
                </Text>
                <Text>{props.estado} · {props.hora}</Text>
            </VStack>
        ),
        compactLeading: <Image systemName="sportscourt.fill" />,
        compactTrailing: <Text>{props.hora}</Text>,
        minimal: <Image systemName="sportscourt.fill" />,
        expandedLeading: <Text>{props.local}</Text>,
        expandedTrailing: <Text>{props.visitante}</Text>,
        expandedBottom: (
            <Text modifiers={[font({ size: 14 })]}>{props.estado} · {props.hora}</Text>
        ),
    };
};

export default createLiveActivity('PartidoActivity', PartidoActivity);