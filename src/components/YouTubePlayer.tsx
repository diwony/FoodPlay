import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";
import { StyleSheet, View } from "react-native";
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

/* eslint-disable @typescript-eslint/no-explicit-any */
let apiReady: Promise<void> | null = null;

/** YouTube IFrame Player API 스크립트를 한 번만 로드한다. */
function loadYouTubeApi(): Promise<void> {
  if (apiReady) return apiReady;
  apiReady = new Promise((resolve) => {
    const w = window as any;
    if (w.YT && w.YT.Player) return resolve();
    const prev = w.onYouTubeIframeAPIReady;
    w.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve();
    };
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.body.appendChild(tag);
  });
  return apiReady;
}

/**
 * 웹 구현 — YouTube IFrame Player API.
 * 네이티브 구현(YouTubePlayer.native.tsx)과 동일한 계약.
 */
const YouTubePlayer = forwardRef<YouTubePlayerHandle, YouTubePlayerProps>(
  ({ youtubeId, width, onPlaybackStart }, ref) => {
    const hostRef = useRef<HTMLDivElement>(null);
    const playerRef = useRef<any>(null);
    const pendingSeek = useRef<number | null>(null);
    const startedRef = useRef(false);
    const startCbRef = useRef(onPlaybackStart);
    startCbRef.current = onPlaybackStart;
    const height = Math.round((width * 9) / 16);

    const markStarted = () => {
      if (startedRef.current) return;
      startedRef.current = true;
      startCbRef.current?.();
    };

    useEffect(() => {
      let cancelled = false;
      loadYouTubeApi().then(() => {
        if (cancelled || !hostRef.current) return;
        const w = window as any;
        playerRef.current = new w.YT.Player(hostRef.current, {
          videoId: youtubeId,
          width,
          height,
          playerVars: { modestbranding: 1, rel: 0, playsinline: 1 },
          events: {
            onReady: () => {
              if (pendingSeek.current != null) {
                playerRef.current.seekTo(pendingSeek.current, true);
                playerRef.current.playVideo();
                pendingSeek.current = null;
              }
            },
            onStateChange: (e: any) => {
              // YT.PlayerState.PLAYING === 1
              if (e?.data === 1) markStarted();
            },
          },
        });
      });
      return () => {
        cancelled = true;
        playerRef.current?.destroy?.();
        playerRef.current = null;
        startedRef.current = false;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [youtubeId]);

    useEffect(() => {
      playerRef.current?.setSize?.(width, height);
    }, [width, height]);

    useImperativeHandle(
      ref,
      () => ({
        seekTo: (seconds: number) => {
          const t = Math.max(0, Math.floor(seconds));
          const p = playerRef.current;
          if (p && p.seekTo) {
            p.seekTo(t, true);
            p.playVideo();
            markStarted();
          } else {
            pendingSeek.current = t;
          }
        },
        pause: () => playerRef.current?.pauseVideo?.(),
      }),
      [],
    );

    return (
      <View style={[styles.frame, { width, height }]}>
        <div ref={hostRef} style={{ width, height }} />
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
