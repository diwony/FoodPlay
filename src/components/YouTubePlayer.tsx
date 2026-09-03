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
}

interface Props {
  youtubeId: string;
  /** 플레이어 폭(px). 높이는 16:9 로 계산된다. */
  width: number;
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
 * 네이티브 구현(YouTubePlayer.native.tsx)과 동일하게 `seekTo` 를 노출한다.
 */
const YouTubePlayer = forwardRef<YouTubePlayerHandle, Props>(
  ({ youtubeId, width }, ref) => {
    const hostRef = useRef<HTMLDivElement>(null);
    const playerRef = useRef<any>(null);
    const pendingSeek = useRef<number | null>(null);
    const height = Math.round((width * 9) / 16);

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
          },
        });
      });
      return () => {
        cancelled = true;
        playerRef.current?.destroy?.();
        playerRef.current = null;
      };
      // width/height 변경 시 재생성하지 않고 아래 effect 에서 크기만 조정
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
          } else {
            pendingSeek.current = t;
          }
        },
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
