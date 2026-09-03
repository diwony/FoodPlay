import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { StyleSheet, View } from "react-native";
import YoutubePlayer from "react-native-youtube-iframe";
import { colors, radius } from "../theme/theme";

export interface YouTubePlayerHandle {
  /** 지정한 초 지점으로 이동하고 재생한다. */
  seekTo: (seconds: number) => void;
}

interface Props {
  youtubeId: string;
  /** 플레이어 폭(px). 높이는 16:9 로 계산된다. */
  width: number;
}

/**
 * react-native-youtube-iframe 래퍼.
 * - 네이티브: react-native-webview 위에서 IFrame Player API 구동
 * - 웹: 동일 API 를 iframe 으로 구동
 * 두 타깃 모두 `seekTo` 가 동작하므로 타임스탬프 점프 로직을 공유한다.
 */
const YouTubePlayer = forwardRef<YouTubePlayerHandle, Props>(
  ({ youtubeId, width }, ref) => {
    const playerRef = useRef<React.ComponentRef<typeof YoutubePlayer>>(null);
    const [playing, setPlaying] = useState(false);
    const height = Math.round((width * 9) / 16);

    useImperativeHandle(
      ref,
      () => ({
        seekTo: (seconds: number) => {
          playerRef.current?.seekTo(Math.max(0, Math.floor(seconds)), true);
          setPlaying(true);
        },
      }),
      [],
    );

    const onStateChange = useCallback((state: string) => {
      if (state === "ended" || state === "paused") setPlaying(false);
      if (state === "playing") setPlaying(true);
    }, []);

    return (
      <View style={[styles.frame, { width, height }]}>
        <YoutubePlayer
          ref={playerRef}
          height={height}
          width={width}
          play={playing}
          videoId={youtubeId}
          onChangeState={onStateChange}
          initialPlayerParams={{ modestbranding: true, rel: false }}
          webViewProps={{ allowsInlineMediaPlayback: true }}
        />
      </View>
    );
  },
);

YouTubePlayer.displayName = "YouTubePlayer";
export default YouTubePlayer;

const styles = StyleSheet.create({
  frame: {
    borderRadius: radius.md,
    overflow: "hidden",
    backgroundColor: "#000",
    alignSelf: "center",
  },
});
