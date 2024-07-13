// import React, { useState } from 'react';
// import styled from 'styled-components';

// const FooterContainer = styled.footer`
//   background: #1a1a1a;
//   padding: 1rem;
//   text-align: center;
// `;

// const AudioControl = styled.div`
//   display: flex;
//   justify-content: center;
//   gap: 1rem;
// `;

// const TrackButton = styled.button`
//   background: ${props => props.active ? '#ff6b6b' : '#333'};
//   color: white;
//   border: none;
//   padding: 0.5rem 1rem;
//   cursor: pointer;
//   transition: background 0.3s ease;

//   &:hover {
//     background: #ff6b6b;
//   }
// `;

// const Footer = () => {
//   const [activeTracks, setActiveTracks] = useState({
//     drums: true,
//     bass: true,
//     guitar: true,
//     vocals: true,
//   });

//   const toggleTrack = (track) => {
//     setActiveTracks(prev => ({ ...prev, [track]: !prev[track] }));
//     // Here you would also handle the actual audio mixing
//   };

//   return (
//     <FooterContainer>
//       <AudioControl>
//         <TrackButton active={activeTracks.drums} onClick={() => toggleTrack('drums')}>Drums</TrackButton>
//         <TrackButton active={activeTracks.bass} onClick={() => toggleTrack('bass')}>Bass</TrackButton>
//         <TrackButton active={activeTracks.guitar} onClick={() => toggleTrack('guitar')}>Guitar</TrackButton>
//         <TrackButton active={activeTracks.vocals} onClick={() => toggleTrack('vocals')}>Vocals</TrackButton>
//       </AudioControl>
//     </FooterContainer>
//   );
// };

// export default Footer;