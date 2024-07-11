import React, { useRef, useEffect, useState } from 'react';
import styled from 'styled-components';
import AudioPlayer from 'react-h5-audio-player';
import 'react-h5-audio-player/lib/styles.css';
import WaveSurfer from 'wavesurfer.js';
import { FaSpotify, FaApple, FaInstagram, FaStepBackward, FaStepForward, FaPlay, FaPause, FaChevronUp, FaChevronDown } from 'react-icons/fa';

const PlayerContainer = styled.div`
  position: fixed;
  bottom: ${props => props.isCollapsed ? '0' : '20px'};
  left: 50%;
  transform: translateX(-50%);
  width: ${props => props.isCollapsed ? '100px' : '90%'};
  height: ${props => props.isCollapsed ? '30px' : 'auto'};
  background: rgba(10, 10, 20, 0.8);
  border-radius: ${props => props.isCollapsed ? '10px 10px 0 0' : '10px'};
  padding: ${props => props.isCollapsed ? '5px' : '10px'};
  color: white;
  display: flex;
  flex-direction: ${props => props.isCollapsed ? 'row' : 'column'};
  transition: all 0.3s ease;
`;

const ExpandButton = styled.button`
  position: absolute;
  top: ${props => props.isCollapsed ? '5px' : '-25px'};
  right: 10px;
  background: none;
  border: none;
  color: white;
  font-size: 1.2rem;
  cursor: pointer;
`;

const PlayerContent = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  ${props => props.isCollapsed && 'display: none;'}
`;

const Section = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const VisualizerContainer = styled.div`
  height: ${props => props.isCollapsed ? '20px' : '50px'};
  width: ${props => props.isCollapsed ? '80px' : '100%'};
`;

const Controls = styled.div`
  display: flex;
  align-items: center;
`;

const ControlButton = styled.button`
  background: none;
  border: none;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
  margin: 0 10px;
  &:hover {
    color: var(--color-primary);
  }
`;

const SocialLinks = styled.div`
  display: flex;
  justify-content: space-around;
  width: 100%;
`;

const SocialIcon = styled.a`
  color: white;
  font-size: 1.5rem;
  transition: color 0.3s ease;
  &:hover {
    color: #1DB954;
  }
`;

const CustomAudioPlayer = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const waveformRef = useRef(null);
  const [wavesurfer, setWavesurfer] = useState(null);
  const [currentTrack, setCurrentTrack] = useState(0);

  const playlist = [
    { 
      title: "Eminem - Tobey feat. Big Sean & Babytron", 
      url: "/audio/Eminem - Tobey feat. Big Sean & Babytron (Official Music Video).mp3",
      spotify: "https://open.spotify.com/track/...",
      apple: "https://music.apple.com/us/album/...",
      instagram: "https://www.instagram.com/eminem/"
    },
    // ... other tracks
  ];

  useEffect(() => {
    const wavesurfer = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: 'rgba(255, 255, 255, 0.1)',
      progressColor: 'linear-gradient(to right, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #8f00ff)',
      height: isCollapsed ? 20 : 50,
      cursorWidth: 1,
      cursorColor: 'transparent',
      barWidth: 2,
      barRadius: 3,
      responsive: true,
      hideScrollbar: true,
    });

    setWavesurfer(wavesurfer);

    return () => wavesurfer.destroy();
  }, [isCollapsed]);

  useEffect(() => {
    if (wavesurfer) {
      wavesurfer.load(playlist[currentTrack].url);
    }
  }, [currentTrack, wavesurfer]);

  const handlePlay = () => {
    wavesurfer && wavesurfer.play();
    setIsPlaying(true);
  };

  const handlePause = () => {
    wavesurfer && wavesurfer.pause();
    setIsPlaying(false);
  };

  const handlePrevTrack = () => {
    setCurrentTrack((prevTrack) => (prevTrack - 1 + playlist.length) % playlist.length);
  };

  const handleNextTrack = () => {
    setCurrentTrack((prevTrack) => (prevTrack + 1) % playlist.length);
  };

  return (
    <PlayerContainer isCollapsed={isCollapsed}>
      <ExpandButton isCollapsed={isCollapsed} onClick={() => setIsCollapsed(!isCollapsed)}>
        {isCollapsed ? <FaChevronUp /> : <FaChevronDown />}
      </ExpandButton>
      {isCollapsed && <VisualizerContainer isCollapsed={isCollapsed} ref={waveformRef} />}
      <PlayerContent isCollapsed={isCollapsed}>
        <Section>
          <div>{playlist[currentTrack].title}</div>
          {!isCollapsed && <VisualizerContainer isCollapsed={isCollapsed} ref={waveformRef} />}
        </Section>
        <Section>
          <Controls>
            <ControlButton onClick={handlePrevTrack}><FaStepBackward /></ControlButton>
            <ControlButton onClick={isPlaying ? handlePause : handlePlay}>
              {isPlaying ? <FaPause /> : <FaPlay />}
            </ControlButton>
            <ControlButton onClick={handleNextTrack}><FaStepForward /></ControlButton>
          </Controls>
        </Section>
        <Section>
          <SocialLinks>
            <SocialIcon href={playlist[currentTrack].spotify} target="_blank" rel="noopener noreferrer">
              <FaSpotify />
            </SocialIcon>
            <SocialIcon href={playlist[currentTrack].apple} target="_blank" rel="noopener noreferrer">
              <FaApple />
            </SocialIcon>
            <SocialIcon href={playlist[currentTrack].instagram} target="_blank" rel="noopener noreferrer">
              <FaInstagram />
            </SocialIcon>
          </SocialLinks>
        </Section>
      </PlayerContent>
    </PlayerContainer>
  );
};

export default CustomAudioPlayer;