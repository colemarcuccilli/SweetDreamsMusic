// import React from 'react';
// import { Html } from '@react-three/drei';
// import { motion } from 'framer-motion';

// const HoverLabel = ({ word, position }) => {
//   return (
//     <Html position={position}>
//       <motion.div
//         initial={{ opacity: 0, width: 0 }}
//         animate={{ opacity: 1, width: 'auto' }}
//         exit={{ opacity: 0, width: 0 }}
//         transition={{ duration: 0.3 }}
//         style={{
//           background: 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0) 100%)',
//           padding: '5px 10px',
//           borderRadius: '20px',
//           whiteSpace: 'nowrap',
//           overflow: 'hidden',
//           display: 'flex',
//           alignItems: 'center',
//         }}
//       >
//         <div
//           style={{
//             width: '50px',
//             height: '2px',
//             background: 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,1) 50%, rgba(255,255,255,0) 100%)',
//             marginRight: '10px',
//           }}
//         />
//         <span style={{ color: 'white', fontWeight: 'bold' }}>{word}</span>
//       </motion.div>
//     </Html>
//   );
// };

// export default HoverLabel;