
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useRef, useEffect } from 'react';
import { User } from '../types';
import { supabase } from '../services/supabaseClient';

interface AccountProps {
  user: User;
  onUpdateUser: (user: User) => void;
}

// --- Helper Component: Image Cropper ---
interface ImageCropperProps {
  imageSrc: string;
  onCancel: () => void;
  onCrop: (blob: Blob) => void;
}

const ImageCropper: React.FC<ImageCropperProps> = ({ imageSrc, onCancel, onCrop }) => {
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const imgRef = useRef<HTMLImageElement>(null);
  const containerSize = 280; // Viewport size (px)

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    setDragStart({ x: clientX - offset.x, y: clientY - offset.y });
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return;
    e.preventDefault(); 
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    setOffset({
      x: clientX - dragStart.x,
      y: clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleCrop = () => {
    const canvas = document.createElement('canvas');
    const size = 400; // Output resolution
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    
    if (!ctx || !imgRef.current) return;

    const img = imgRef.current;
    
    // Calculate scale to cover container
    const minScale = Math.max(containerSize / img.naturalWidth, containerSize / img.naturalHeight);
    const displayWidth = img.naturalWidth * minScale * zoom;
    const displayHeight = img.naturalHeight * minScale * zoom;

    // 1. Fill canvas white
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, size, size);

    // 2. Re-apply transforms. 
    // The visible viewport is 'containerSize' wide. 
    // The image is drawn at 'offset' within that viewport, scaled by 'minScale * zoom'.
    // We map 'containerSize' -> 'size' (400px).
    const ratio = size / containerSize;
    
    ctx.translate(size/2, size/2); // Center of canvas
    ctx.translate(offset.x * ratio, offset.y * ratio); // Pan
    
    const drawScale = minScale * zoom * ratio;
    ctx.scale(drawScale, drawScale);
    
    ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);

    canvas.toBlob((blob) => {
        if (blob) onCrop(blob);
    }, 'image/jpeg', 0.9);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[#2C2A26]/90 backdrop-blur-sm flex items-center justify-center p-4">
       <div className="bg-[#F5F2EB] p-8 rounded-none max-w-md w-full shadow-2xl border border-[#D6D1C7]">
          <h3 className="text-xl font-serif text-[#2C2A26] mb-6 text-center">Adjust Profile Picture</h3>
          
          {/* Viewport */}
          <div className="relative w-[280px] h-[280px] mx-auto mb-6 bg-[#2C2A26] overflow-hidden rounded-full border-4 border-white shadow-inner cursor-move"
               onMouseDown={handleMouseDown}
               onMouseMove={handleMouseMove}
               onMouseUp={handleMouseUp}
               onMouseLeave={handleMouseUp}
               onTouchStart={handleMouseDown}
               onTouchMove={handleMouseMove}
               onTouchEnd={handleMouseUp}
          >
             {/* Helper Grid */}
             <div className="absolute inset-0 z-10 pointer-events-none opacity-20 flex items-center justify-center">
                 <div className="w-full h-[1px] bg-white absolute"></div>
                 <div className="h-full w-[1px] bg-white absolute"></div>
             </div>

             <img 
                ref={imgRef}
                src={imageSrc}
                alt="Crop target"
                className="max-w-none absolute top-1/2 left-1/2 origin-center select-none pointer-events-none"
                style={{
                    transform: `translate(-50%, -50%) translate(${offset.x}px, ${offset.y}px) scale(${Math.max(containerSize / (imgRef.current?.naturalWidth || 1000), containerSize / (imgRef.current?.naturalHeight || 1000)) * zoom})`
                }}
                onLoad={() => setZoom(1)} // Reset zoom on load
             />
          </div>

          {/* Controls */}
          <div className="space-y-6">
              <div className="flex items-center gap-4">
                  <span className="text-xs uppercase font-bold text-[#A8A29E]">Zoom</span>
                  <input 
                    type="range" 
                    min="1" 
                    max="3" 
                    step="0.1" 
                    value={zoom} 
                    onChange={(e) => setZoom(parseFloat(e.target.value))}
                    className="flex-1 accent-[#2C2A26] h-1 bg-[#D6D1C7] rounded-lg appearance-none cursor-pointer"
                  />
              </div>

              <div className="flex gap-4">
                  <button 
                    onClick={onCancel}
                    className="flex-1 py-3 border border-[#2C2A26] text-[#2C2A26] text-xs font-bold uppercase tracking-widest hover:bg-[#EBE7DE] transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleCrop}
                    className="flex-1 py-3 bg-[#2C2A26] text-[#F5F2EB] text-xs font-bold uppercase tracking-widest hover:bg-[#444] transition-colors"
                  >
                    Apply
                  </button>
              </div>
          </div>
       </div>
    </div>
  );
};


const Account: React.FC<AccountProps> = ({ user, onUpdateUser }) => {
  const [formData, setFormData] = useState({
    username: user.username,
    city: user.city,
    country: user.country,
    householdSize: user.householdSize,
    password: '',
    newPassword: ''
  });
  
  // Image Handling
  const [avatarPreview, setAvatarPreview] = useState(user.avatar);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [tempImageSrc, setTempImageSrc] = useState<string | null>(null);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [croppedBlob, setCroppedBlob] = useState<Blob | null>(null);
  
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setFormData(prev => ({
        ...prev,
        username: user.username,
        city: user.city,
        country: user.country,
        householdSize: user.householdSize
    }));
    // Only reset preview if we haven't selected a new file recently
    if (!croppedBlob) {
        setAvatarPreview(user.avatar);
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB Limit for raw file
          setMessage("Image is too large. Please select a file under 5MB.");
          return;
      }
      
      const url = URL.createObjectURL(file);
      setTempImageSrc(url);
      setCropModalOpen(true);
      setSelectedFile(file);
    }
    // Reset input so same file can be selected again if needed
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCropComplete = (blob: Blob) => {
      const url = URL.createObjectURL(blob);
      setAvatarPreview(url);
      setCroppedBlob(blob);
      setCropModalOpen(false);
      setTempImageSrc(null);
  };

  const handleCropCancel = () => {
      setCropModalOpen(false);
      setTempImageSrc(null);
      setSelectedFile(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    
    try {
        let finalAvatarUrl = user.avatar;

        // 1. Handle Image Upload (Supabase Storage)
        if (croppedBlob) {
            // We use a timestamped filename to avoid caching issues
            const fileName = `${user.id}/${Date.now()}.jpg`;
            
            // Upload to 'avatars' bucket
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(fileName, croppedBlob, { 
                    contentType: 'image/jpeg',
                    cacheControl: '3600'
                });

            if (uploadError) {
                console.error('Storage Upload Error:', uploadError);
                
                // Robust error message extraction to avoid [object Object]
                let detailedError = 'Unknown error';
                if (uploadError && typeof uploadError === 'object') {
                    detailedError = (uploadError as any).message || 
                                  (uploadError as any).error_description || 
                                  JSON.stringify(uploadError);
                } else {
                    detailedError = String(uploadError);
                }

                throw new Error(`Image upload failed: ${detailedError}. (Please ensure the 'avatars' bucket exists in your Supabase project)`);
            }

            // Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(fileName);
            
            finalAvatarUrl = publicUrl;
        }

        // 2. Update Profile Data
        const updates = {
            username: formData.username,
            city: formData.city,
            country: formData.country,
            household_size: parseInt(String(formData.householdSize)),
            avatar_url: finalAvatarUrl,
        };

        const { data, error: profileError } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', user.id)
            .select();
        
        if (profileError) throw profileError;
        
        if (!data || data.length === 0) {
            throw new Error("Database refused update. Please check your connection.");
        }

        const savedProfile = data[0];

        // 3. Update Password if provided
        if (formData.newPassword) {
            const { error: pwError } = await supabase.auth.updateUser({
                password: formData.newPassword
            });
            if (pwError) {
                setMessage(`Profile saved, but password failed: ${pwError.message}`);
            }
        }

        // 4. Update Local State
        const updatedUser = {
            ...user,
            username: savedProfile.username,
            city: savedProfile.city,
            country: savedProfile.country,
            avatar: savedProfile.avatar_url, // Use the new URL
            householdSize: savedProfile.household_size
        };

        onUpdateUser(updatedUser);
        setMessage("Profile updated successfully.");
        setFormData(prev => ({ ...prev, password: '', newPassword: '' }));
        setCroppedBlob(null); // Clear upload queue
        
    } catch (error: any) {
        console.error("Form Submission Error:", error);
        // Ensure we render a string, not an object
        let displayMsg = error.message || "Failed to update profile.";
        if (typeof displayMsg !== 'string') {
            displayMsg = "An unexpected error occurred. Check console for details.";
        }
        setMessage(displayMsg);
    } finally {
        setSaving(false);
        if (message && !message.includes('Failed') && !message.includes('failed')) {
             setTimeout(() => setMessage(null), 5000);
        }
    }
  };

  return (
    <>
      {cropModalOpen && tempImageSrc && (
          <ImageCropper 
            imageSrc={tempImageSrc} 
            onCancel={handleCropCancel} 
            onCrop={handleCropComplete} 
          />
      )}

      <div className="min-h-screen bg-[#F5F2EB] pt-32 px-6 pb-24">
        <div className="max-w-3xl mx-auto animate-fade-in-up">
            
            <h1 className="text-4xl font-serif text-[#2C2A26] mb-12">Account Settings</h1>

            <div className="bg-white/50 border border-[#D6D1C7] p-8 md:p-12 shadow-sm">
                
                {/* Profile Header */}
                <div className="flex items-center gap-6 mb-12">
                    <div 
                        className="relative group cursor-pointer w-24 h-24 flex-shrink-0"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <img 
                            src={avatarPreview} 
                            alt="Profile" 
                            className="w-full h-full rounded-full object-cover border border-[#D6D1C7] shadow-sm" 
                        />
                        <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs uppercase tracking-widest font-bold text-center px-2 backdrop-blur-[2px]">
                            Upload Photo
                        </div>
                        <div className="absolute bottom-0 right-0 bg-[#2C2A26] text-white p-1.5 rounded-full border-2 border-[#F5F2EB]">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                                <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
                            </svg>
                        </div>
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            className="hidden" 
                            accept="image/png, image/jpeg, image/jpg"
                            onChange={handleFileSelect}
                        />
                    </div>
                    <div>
                        <h2 className="text-xl font-serif text-[#2C2A26]">{user.username}</h2>
                        <p className="text-sm text-[#A8A29E] mb-1">Member since {user.joinedDate || '2024'}</p>
                        {croppedBlob && (
                            <span className="text-xs text-[#4A7C59] font-bold uppercase tracking-widest">Image ready to save</span>
                        )}
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-10">
                    {/* Section: Personal Info */}
                    <div>
                        <h3 className="text-xs font-extrabold uppercase tracking-widest text-[#2C2A26] mb-6 border-b border-[#D6D1C7] pb-2">Profile Details</h3>
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm text-[#5D5A53]">Username</label>
                                <input 
                                    type="text"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleChange}
                                    className="w-full bg-transparent border-b border-[#D6D1C7] py-2 text-[#2C2A26] focus:border-[#2C2A26] outline-none transition-colors"
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="text-sm text-[#5D5A53]">City</label>
                                    <input 
                                        type="text"
                                        name="city"
                                        value={formData.city}
                                        onChange={handleChange}
                                        className="w-full bg-transparent border-b border-[#D6D1C7] py-2 text-[#2C2A26] focus:border-[#2C2A26] outline-none transition-colors"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm text-[#5D5A53]">Country</label>
                                    <input 
                                        type="text"
                                        name="country"
                                        value={formData.country}
                                        onChange={handleChange}
                                        className="w-full bg-transparent border-b border-[#D6D1C7] py-2 text-[#2C2A26] focus:border-[#2C2A26] outline-none transition-colors"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section: Household */}
                    <div>
                        <h3 className="text-xs font-extrabold uppercase tracking-widest text-[#2C2A26] mb-6 border-b border-[#D6D1C7] pb-2">Household Configuration</h3>
                        <div className="space-y-2">
                            <label className="text-sm text-[#5D5A53]">Household Size (People)</label>
                            <p className="text-xs text-[#A8A29E] mb-2">Used to calculate your share of laundry, dishwashing, and garden water usage.</p>
                            <input 
                                type="number"
                                name="householdSize"
                                min="1"
                                max="20"
                                value={formData.householdSize}
                                onChange={handleChange}
                                className="w-full bg-transparent border-b border-[#D6D1C7] py-2 text-[#2C2A26] focus:border-[#2C2A26] outline-none transition-colors"
                            />
                        </div>
                    </div>

                    {/* Section: Security */}
                    <div>
                        <h3 className="text-xs font-extrabold uppercase tracking-widest text-[#2C2A26] mb-6 border-b border-[#D6D1C7] pb-2">Security</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                             <div className="space-y-2">
                                <label className="text-sm text-[#5D5A53]">New Password</label>
                                <input 
                                    type="password"
                                    name="newPassword"
                                    value={formData.newPassword}
                                    onChange={handleChange}
                                    placeholder="Leave blank to keep current"
                                    className="w-full bg-transparent border-b border-[#D6D1C7] py-2 text-[#2C2A26] focus:border-[#2C2A26] outline-none transition-colors"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between pt-8">
                        {message ? (
                            <span className={`${message.includes('too large') || message.toLowerCase().includes('failed') || message.includes('error') ? 'text-red-600' : 'text-green-700'} text-sm`}>{message}</span>
                        ) : (
                            <span></span>
                        )}
                        <button 
                            type="submit"
                            disabled={saving}
                            className="bg-[#2C2A26] text-[#F5F2EB] px-8 py-4 text-sm font-medium uppercase tracking-widest hover:bg-[#433E38] transition-colors disabled:opacity-50 disabled:cursor-wait"
                        >
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
      </div>
    </>
  );
};

export default Account;
