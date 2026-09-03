import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { StyleSheet, View } from "react-native";
import YoutubePlayer from "react-native-youtube-iframe";
import { radius } from "../theme/theme";

export interface YouTubePlayerHandle {
  /** 지정한 초 지점으로 이동하고 재생한다. */
  seekTo: (seconds: number) => void;
  /** 재생을 멈춘다. */
  pause: () => void;
}

export interface YouTubePlayerProps {
  youtubeId: string;
  /** 플레이어 폭(px). 높이는 16:9 로 계산된다. */
  width: number;
  /** 첫 재생이 시작되면 한 번 호출 (미니 플레이어 활성화 트리거) */
  onPlaybackStart?: () => void;
}

/**
 * react-native-youtube-iframe 래퍼 (네이티브).
 * 웹 구현(YouTubePlayer.tsx)과 동일한 `seekTo` / `onPlaybackStart` 계약.
 */
const YouTubePlayer = forwardRef<YouTubePlayerHandle, YouTubePlayerProps>(
  ({ youtubeId, width, onPlaybackStart }, ref) => {
    const playerRef = useRef<React.ComponentRef<typeof YoutubePlayer>>(null);
    const [playing, setPlaying] = useState(false);
    const startedRef = useRef(false);
    const height = Math.round((width * 9) / 16);

    const markStarted = useCallback(() => {
      if (startedRef.current) return;
      startedRef.current = true;
      onPlaybackStart?.();
    }, [onPlaybackStart]);

    useImperativeHandle(
      ref,
      () => ({
        seekTo: (seconds: number) => {
          playerRef.current?.seekTo(Math.max(0, Math.floor(seconds)), true);
          setPlaying(true);
          markStarted();
        },
        pause: () => setPlaying(false),
      }),
      [markStarted],
    );

    const onStateChange = useCallback(
      (state: string) => {
        if (state === "ended" || state === "paused") setPlaying(false);
        if (state === "playing") {
          setPlaying(true);
          markStarted();
        }
      },
      [markStarted],
    );

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
