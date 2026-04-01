import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Glasses } from 'lucide-react';

// OPTION 1: Sử dụng hình từ public/images (Upload từ máy)
const LOCAL_IMAGE = '/images/auth-image.jpg';

// OPTION 2: Sử dụng URL từ internet (Backup)
const ONLINE_IMAGE = 'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=600&q=80';

// Chọn nguồn hình: 'local' hoặc 'online'
const IMAGE_SOURCE: 'local' | 'online' = 'local'; // Đổi thành 'online' nếu chưa upload hình

const IMAGE_URL = IMAGE_SOURCE === 'local' ? LOCAL_IMAGE : ONLINE_IMAGE;

const AuthImageSide: React.FC = () => {
  const [imageError, setImageError] = useState(false);

  // Preload image để tránh delay
  useEffect(() => {
    const img = new Image();
    img.src = IMAGE_URL;
    img.onerror = () => setImageError(true);
  }, []);

  return (
    <div 
      className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-teal-400 via-cyan-500 to-blue-500 relative overflow-hidden"
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      {/* Image Container */}
      <div className="relative z-10 flex flex-col items-center justify-center w-full p-12">
        <div className="relative">
          {!imageError ? (
            <>
              <img
                src={IMAGE_URL}
                alt="Eyewear Fashion"
                className="rounded-3xl shadow-2xl w-full max-w-md object-cover"
                loading="eager"
                decoding="async"
                onError={() => setImageError(true)}
              />
              <div className="absolute -bottom-6 -right-6 bg-white rounded-2xl p-6 shadow-xl">
                <Glasses className="w-12 h-12 text-teal-500" />
              </div>
            </>
          ) : (
            // Fallback UI khi hình không load được
            <div className="rounded-3xl shadow-2xl w-full max-w-md h-96 bg-white/10 backdrop-blur-sm flex flex-col items-center justify-center p-8 text-center">
              <Glasses className="w-24 h-24 text-white/50 mb-4" />
              <p className="text-white text-lg font-semibold mb-2">
                Hình ảnh chưa được upload
              </p>
              <p className="text-white/80 text-sm">
                Copy hình của bạn vào:<br />
                <code className="bg-white/20 px-2 py-1 rounded">
                  FE/public/images/auth-image.jpg
                </code>
              </p>
            </div>
          )}
        </div>
        
        {/* Brand Text */}
        <motion.div
          className="mt-12 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
        >
          <h2 className="text-4xl font-bold text-white mb-2 tracking-tight">
            EyeCare Store
          </h2>
          <p className="text-white/90 text-lg font-light">
            Chăm sóc đôi mắt của bạn
          </p>
        </motion.div>
      </div>

      {/* Decorative Elements */}
      <motion.div
        className="absolute top-20 left-20 w-32 h-32 bg-white/10 rounded-full blur-3xl"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <motion.div
        className="absolute bottom-20 right-20 w-40 h-40 bg-white/10 rounded-full blur-3xl"
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
    </div>
  );
};

// Memoize component để tránh re-render khi parent component thay đổi
export default React.memo(AuthImageSide);
