/**
 * @file useVoiceChat.ts
 * WebRTC Voice Chat Hook using Socket.io for peer-to-peer audio signaling.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { socketService } from "../services/socketService";

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

export function useVoiceChat(gameId?: string | null) {
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [peerMuted, setPeerMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize Remote Audio Element
  useEffect(() => {
    if (typeof window !== "undefined" && !remoteAudioRef.current) {
      const audio = document.createElement("audio");
      audio.autoplay = true;
      remoteAudioRef.current = audio;
    }
  }, []);

  const createPeerConnection = useCallback(() => {
    if (peerConnectionRef.current) return peerConnectionRef.current;

    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnectionRef.current = pc;

    // Handle ICE Candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && gameId) {
        const socket = socketService.getSocket();
        socket?.emit("voice_candidate", { gameId, candidate: event.candidate });
      }
    };

    // Handle Remote Track (Audio stream)
    pc.ontrack = (event) => {
      console.log("[VoiceChat] Received remote audio stream");
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = event.streams[0];
      }
      setIsConnected(true);
    };

    // Connection state change
    pc.onconnectionstatechange = () => {
      console.log("[VoiceChat] Connection state:", pc.connectionState);
      if (pc.connectionState === "connected") {
        setIsConnected(true);
      } else if (pc.connectionState === "disconnected" || pc.connectionState === "failed") {
        setIsConnected(false);
      }
    };

    // Add local audio tracks to peer connection
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    return pc;
  }, [gameId]);

  // Start Voice Chat
  const startVoiceChat = useCallback(async () => {
    if (!gameId) {
      setError("Aucune partie multijoueur active");
      return;
    }

    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;
      setIsVoiceActive(true);
      setIsMuted(false);

      const pc = createPeerConnection();
      const socket = socketService.getSocket();

      // Create Offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socket?.emit("voice_offer", { gameId, offer });
    } catch (err: any) {
      console.error("[VoiceChat] Microphone error:", err);
      setError("Accès au microphone refusé ou non supporté");
      setIsVoiceActive(false);
    }
  }, [gameId, createPeerConnection]);

  // Stop Voice Chat
  const stopVoiceChat = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null;
    }

    setIsVoiceActive(false);
    setIsConnected(false);
    setIsMuted(false);
  }, []);

  // Toggle Mute
  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        const muted = !audioTrack.enabled;
        setIsMuted(muted);

        if (gameId) {
          const socket = socketService.getSocket();
          socket?.emit("voice_status", { gameId, isMuted: muted, isSpeaking: false });
        }
      }
    }
  }, [gameId]);

  // Listen to Socket.io Signaling Events
  useEffect(() => {
    if (!gameId) return;

    const socket = socketService.connect();

    // Offer received
    socket.on("voice_offer", async ({ offer, senderId }) => {
      console.log("[VoiceChat] Received voice offer from:", senderId);
      if (!isVoiceActive) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          localStreamRef.current = stream;
          setIsVoiceActive(true);
        } catch (e) {
          console.warn("[VoiceChat] Could not capture mic on offer:", e);
        }
      }

      const pc = createPeerConnection();
      await pc.setRemoteDescription(new RTCSessionDescription(offer));

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit("voice_answer", { gameId, answer });
    });

    // Answer received
    socket.on("voice_answer", async ({ answer }) => {
      console.log("[VoiceChat] Received voice answer");
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
      }
    });

    // ICE Candidate received
    socket.on("voice_candidate", async ({ candidate }) => {
      if (peerConnectionRef.current) {
        try {
          await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.error("[VoiceChat] Error adding ICE candidate:", e);
        }
      }
    });

    // Peer Voice Status
    socket.on("voice_status", ({ isMuted }) => {
      setPeerMuted(isMuted);
    });

    return () => {
      socket.off("voice_offer");
      socket.off("voice_answer");
      socket.off("voice_candidate");
      socket.off("voice_status");
    };
  }, [gameId, isVoiceActive, createPeerConnection]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopVoiceChat();
    };
  }, [stopVoiceChat]);

  return {
    isVoiceActive,
    isMuted,
    isConnected,
    peerMuted,
    error,
    startVoiceChat,
    stopVoiceChat,
    toggleMute,
  };
}
