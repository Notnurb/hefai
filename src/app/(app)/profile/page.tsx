'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from 'sonner';
import { HugeiconsIcon } from '@hugeicons/react';
import { Camera01Icon, Loading01Icon } from '@hugeicons/core-free-icons';

export default function ProfilePage() {
    const { user, isLoading: authLoading, signIn } = useAuth();

    // Local state for form
    const [name, setName] = useState('');
    const [bio, setBio] = useState('');
    const [image, setImage] = useState('');
    const [previewImage, setPreviewImage] = useState('');

    const [isSaving, setIsSaving] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Initialize form with user data
    useEffect(() => {
        if (user) {
            setName(user.name || '');
            setBio(user.bio || '');
            setImage(user.image || '');
            setPreviewImage(user.image || '');
        }
    }, [user]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Max size check (e.g., 2MB) before processing, but we will resize/compress anyway
        if (file.size > 5 * 1024 * 1024) {
            toast.error("Image too large", { description: "Please upload an image smaller than 5MB." });
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            const result = reader.result as string;
            setPreviewImage(result); // Show immediately

            // Resize image to max 400x400 to keep base64 string reasonable
            const img = new Image();
            img.src = result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                const maxSize = 400;

                if (width > height) {
                    if (width > maxSize) {
                        height *= maxSize / width;
                        width = maxSize;
                    }
                } else {
                    if (height > maxSize) {
                        width *= maxSize / height;
                        height = maxSize;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, width, height);

                // Compress to jpeg with 0.8 quality
                const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);
                setImage(compressedBase64);
            };
        };
        reader.readAsDataURL(file);
    };

    const handleSave = async () => {
        if (!user) return;
        setIsSaving(true);
        try {
            const res = await fetch('/api/user/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    bio,
                    image, // This is the base64 string
                }),
            });

            if (!res.ok) {
                throw new Error('Failed to update profile');
            }

            const data = await res.json();
            toast.success("Profile updated");

            // Update AuthContext
            // We can call signIn or refresh. AuthContext exposes signIn to refresh user state
            await signIn(data.user); // Hacky reuse of signIn to update state? Need to check AuthContext implementation. 
            // AuthContext `signIn` fetches `/api/auth/me`. 
            // So if `data.user` is returned, we can just call `signIn` which triggers a re-fetch.
            // Actually `signIn` accepts data but ignores it and calls `/api/auth/me`. Perfect.

        } catch (error) {
            console.error(error);
            toast.error("Failed to update profile");
        } finally {
            setIsSaving(false);
        }
    };

    if (authLoading) {
        return (
            <div className="flex items-center justify-center p-8">
                <HugeiconsIcon icon={Loading01Icon} className="animate-spin text-muted-foreground" size={24} />
            </div>
        );
    }

    if (!user) {
        return <div className="p-8 text-center text-muted-foreground">Please sign in to view your profile.</div>;
    }

    const initials = name
        ? name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
        : user.email.substring(0, 2).toUpperCase();

    return (
        <div className="flex flex-col max-w-2xl mx-auto p-6 md:p-10 space-y-8 animate-in fade-in duration-500">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
                <p className="text-muted-foreground">
                    Manage your public profile settings.
                </p>
            </div>

            <div className="space-y-6">
                {/* Avatar Section */}
                <div className="flex items-center gap-6">
                    <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                        <Avatar className="h-24 w-24 border-2 border-border transition-opacity group-hover:opacity-80">
                            <AvatarImage src={previewImage} alt={name} className="object-cover" />
                            <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
                        </Avatar>
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                            <HugeiconsIcon icon={Camera01Icon} size={24} />
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleFileChange}
                        />
                    </div>
                    <div className="space-y-1">
                        <h3 className="font-medium">Profile Picture</h3>
                        <p className="text-xs text-muted-foreground max-w-[200px]">
                            Click to upload. JPG, PNG or GIF. Max 5MB.
                        </p>
                    </div>
                </div>

                <div className="grid gap-4">
                    <div className="grid gap-2">
                        <label htmlFor="name" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            Name
                        </label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Your name"
                        />
                    </div>

                    <div className="grid gap-2">
                        <label htmlFor="bio" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            Bio
                        </label>
                        <Textarea
                            id="bio"
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            placeholder="Tell us a little bit about yourself"
                            className="resize-none h-32"
                        />
                        <p className="text-[10px] text-muted-foreground">
                            This will be displayed on your public profile.
                        </p>
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <Button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                        {isSaving && <HugeiconsIcon icon={Loading01Icon} className="animate-spin mr-2" size={16} />}
                        Save Changes
                    </Button>
                </div>
            </div>
        </div>
    );
}
