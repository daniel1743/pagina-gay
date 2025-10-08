import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

const LobbyCard = ({ icon, title, description, gradient, onClick, index }) => {
  const [isHovered, setIsHovered] = useState(false);

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.5,
      },
    }),
  };

  const infoVariants = {
    hidden: { opacity: 0, y: 10, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1 },
  };

  return (
    <motion.div
      custom={index}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={onClick}
      className="relative"
    >
      <motion.div
        whileHover={{ y: -5, boxShadow: '0 10px 20px rgba(0,0,0,0.2)' }}
        className={`relative rounded-2xl p-6 flex flex-col justify-between overflow-hidden cursor-pointer h-full ${gradient}`}
      >
        <div className="relative z-10">
          <div className="mb-4 text-white">{icon}</div>
          <h3 className="text-2xl font-bold text-white mb-2">{title}</h3>
        </div>
        <div className="relative z-10 self-end mt-4">
          <ArrowRight className="w-6 h-6 text-white" />
        </div>
        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-all duration-300"></div>
      </motion.div>

      <AnimatePresence>
        {isHovered && (
          <motion.div
            variants={infoVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={{ duration: 0.2 }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-card border rounded-lg shadow-xl z-20 pointer-events-none"
          >
            <p className="text-foreground text-sm text-center">{description}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default LobbyCard;