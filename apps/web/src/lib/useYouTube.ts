import { useCallback, useEffect, useRef } from "react";

/* global YT */
/* eslint-disable @typescript-eslint/no-explicit-any */

let apiPromise: Promise<void> | null = null;

function loadApi(): Promise<void> {
  if (apiPromise) return apiPromise;
  apiPromise = new Promise((resolve) => {
    const w = window as any;
    if (w.YT?.Player) return resolve();
    const prev = w.onYouTubeIframeAPIReady;
    w.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve();
    };
    const s = document.createElement("script");
    s.src = "https://www.youtube.com/iframe_api";
    document.body.appendChild(s);
  });
  return apiPromise;
}

export interface YouTubeController {
  seekTo: (seconds: number) => void;
  pause: () => void;
}

/**
 * YouTube IFrame Player 를 host div 에 붙이고 제어 함수를 돌려준다.
 * iframe 은 마운트 후 이동/재생성되지 않으므로 미니 플레이어로 축소해도
 * 재생 위치가 유지된다.
 */
export function useYouTube(
  hostRef: React.RefObject<HTMLElement | null>,
  videoId: string,
): YouTubeController {
  const playerRef = useRef<any>(null);
  const pendingSeek = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadApi().then(() => {
      if (cancelled || !hostRef.current) return;
      const w = window as any;
      playerRef.current = new w.YT.Player(hostRef.current, {
        videoId,
        playerVars: {
          modestbranding: 1,
          rel: 0,
          playsinline: 1,
          color: "white",
        },
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
  }, [hostRef, videoId]);

  const seekTo = useCallback((seconds: number) => {
    const t = Math.max(0, Math.floor(seconds));
    const p = playerRef.current;
    if (p?.seekTo) {
      p.seekTo(t, true);
      p.playVideo();
    } else {
      pendingSeek.current = t;
    }
  }, []);

  const pause = useCallback(() => playerRef.current?.pauseVideo?.(), []);

  return { seekTo, pause };
}
