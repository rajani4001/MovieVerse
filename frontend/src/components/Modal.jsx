import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes } from 'react-icons/fa';

const Modal = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-4xl bg-[#141414] border border-white/10 rounded-xl shadow-2xl"
        >
          <button
            onClick={onClose}
            className="absolute top-2 right-2 z-20 w-8 h-8 flex items-center justify-center bg-black/70 hover:bg-black/90 rounded-full text-white transition"
          >
            <FaTimes />
          </button>
          {children}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default Modal;
