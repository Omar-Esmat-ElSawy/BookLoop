
import React, { useState, useEffect, useRef } from 'react';
import { Cropper, ReactCropperElement } from 'react-cropper';
import 'cropperjs/dist/cropper.css';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, MessageSquare, Phone, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import NavBar from '@/components/NavBar';
import BookGrid from '@/components/BookGrid';
import { useAuth } from '@/contexts/AuthContext';
import { useBooks } from '@/contexts/BooksContext';
import { Book, User } from '@/types/database.types';
import { toast } from 'sonner';
import supabase from '@/lib/supabase';
import { UserRatings } from '@/components/UserRatings';
import { sendNewMessage } from '@/services/messagingService';
import { LocationInput } from '@/components/LocationInput';
import { useTranslation } from 'react-i18next';

const ProfilePage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, updateProfile, updateAvatar } = useAuth();
  const { books } = useBooks();
  const { t } = useTranslation();
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [userBooks, setUserBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [newUsername, setNewUsername] = useState('');
  const [newPhoneNumber, setNewPhoneNumber] = useState('');
  const [newCity, setNewCity] = useState('');
  const [newLatitude, setNewLatitude] = useState<number | null>(null);
  const [newLongitude, setNewLongitude] = useState<number | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Cropping states
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const cropperRef = useRef<ReactCropperElement>(null);

  const isOwnProfile = user && id === user.id;

  useEffect(() => {
    const fetchProfile = async () => {
      if (!id) return;
      
      setLoading(true);
      try {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', id)
          .single();
        
        if (userError) throw userError;
        
        setProfileUser(userData as User);
        setNewUsername(userData.username);
        setNewPhoneNumber(userData.phone_number || '');
        setNewCity(userData.location_city || '');
        setNewLatitude(userData.latitude || null);
        setNewLongitude(userData.longitude || null);
        
        const { data: booksData, error: booksError } = await supabase
          .from('books')
          .select('*')
          .eq('owner_id', id)
          .order('created_at', { ascending: false });
        
        if (booksError) throw booksError;
        
        setUserBooks(booksData);
      } catch (error) {
        console.error('Error fetching profile:', error);
        toast.error(t('toasts.failedToLoadProfile'));
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [id]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Instead of uploading directly, open the crop dialog
    const reader = new FileReader();
    reader.onload = () => {
      setImageToCrop(reader.result as string);
      setOriginalFile(file);
      setCropDialogOpen(true);
    };
    reader.readAsDataURL(file);
    
    // Reset the input value
    e.target.value = '';
  };

  const handleCropSave = async () => {
    if (!cropperRef.current || !originalFile) return;

    const cropper = cropperRef.current?.cropper;
    if (!cropper) return;

    setIsUpdating(true);
    setCropDialogOpen(false);

    try {
      // Get the cropped canvas
      const canvas = cropper.getCroppedCanvas({
        width: 400,
        height: 400,
      });

      // Convert canvas to blob
      canvas.toBlob(async (blob) => {
        if (!blob) {
          toast.error(t('toasts.errorCroppingImage'));
          setIsUpdating(false);
          return;
        }

        // Create a new file from the blob
        const croppedFile = new File([blob], originalFile.name, {
          type: originalFile.type,
          lastModified: Date.now(),
        });

        // Upload the cropped file
        const avatarUrl = await updateAvatar(croppedFile);
        if (avatarUrl) {
          toast.success(t('toasts.avatarUpdatedSuccess'));
          // Update the profile user state to show the new avatar
          if (profileUser) {
            setProfileUser({ ...profileUser, avatar_url: avatarUrl });
          }
        }
        setIsUpdating(false);
      }, originalFile.type);
    } catch (error) {
      console.error('Error updating avatar:', error);
      toast.error(t('toasts.failedToUpdateAvatar'));
      setIsUpdating(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!user || !newUsername.trim()) return;
    
    if (newPhoneNumber.trim()) {
      const phoneRegex = /^[+]?[\d\s()-]{10,}$/;
      if (!phoneRegex.test(newPhoneNumber.trim())) {
        toast.error(t('toasts.invalidPhoneNumber'));
        return;
      }
    }
    
    setIsUpdating(true);
    try {
      await updateProfile({ 
        username: newUsername.trim(),
        phone_number: newPhoneNumber.trim() || null,
        location_city: newCity.trim() || null,
        latitude: newLatitude,
        longitude: newLongitude,
      });
      setEditDialogOpen(false);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLocationChange = (city: string, lat: number, lng: number) => {
    setNewCity(city);
    setNewLatitude(lat);
    setNewLongitude(lng);
  };

  const handleSendMessage = async () => {
    if (!profileUser || !user) return;
    
    try {
      const introMessage = `Hi ${profileUser.username}, this is ${user.username}`;
      await sendNewMessage(introMessage, user.id, profileUser.id);
      setTimeout(() => {
        navigate(`/messages/${profileUser.id}`);
      }, 500);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error(t('toasts.failedToSendMessage'));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <NavBar />
        <div className="container mx-auto px-4 py-8 flex justify-center items-center h-[60vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="min-h-screen">
        <NavBar />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-16">
            <h2 className="text-2xl font-bold mb-4">{t('profile.userNotFound')}</h2>
            <p className="mb-6 text-muted-foreground">
              {t('profile.userNotFoundDesc')}
            </p>
            <Link to="/">
              <Button>{t('common.goToHome')}</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 md:pb-0">
      <NavBar />

      <main className="container mx-auto px-4 py-8">
        <Link to="/" className="inline-flex items-center gap-1 text-primary mb-6 hover:underline">
          <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
          {t('common.backToHome')}
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Profile Sidebar */}
          <div className="md:col-span-1">
            <div className="flex flex-col items-center text-center">
              <div className="relative">
                <Avatar className="h-32 w-32 mb-4">
                  <AvatarImage src={profileUser.avatar_url || ''} alt={profileUser.username} />
                  <AvatarFallback className="text-2xl">{profileUser.username?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
                </Avatar>
                
                {isOwnProfile && (
                  <Label htmlFor="avatar-upload" className="absolute bottom-4 end-0 bg-primary text-primary-foreground rounded-full p-2 cursor-pointer">
                    <Edit className="h-4 w-4" />
                    <Input 
                      id="avatar-upload" 
                      type="file" 
                      accept="image/png, image/jpeg, image/webp"
                      className="sr-only"
                      onChange={handleAvatarChange}
                      disabled={isUpdating}
                    />
                  </Label>
                )}
              </div>
              
              <h2 className="text-2xl font-bold">{profileUser.username}</h2>
              <p className="text-muted-foreground text-sm mt-1">
                {t('profile.memberSince', { date: format(new Date(profileUser.created_at || Date.now()), 'MMMM yyyy') })}
              </p>
              
              {profileUser.phone_number && (
                <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  <span dir="ltr">{profileUser.phone_number}</span>
                </div>
              )}
              
              {profileUser.location_city && (
                <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{profileUser.location_city}</span>
                </div>
              )}
              
              <div className="mt-6 w-full">
                {isOwnProfile ? (
                  <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full">{t('profile.editProfile')}</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{t('profile.editProfile')}</DialogTitle>
                        <DialogDescription>
                          {t('profile.makeChanges')}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="username">{t('auth.username')}</Label>
                          <Input 
                            id="username" 
                            value={newUsername} 
                            onChange={(e) => setNewUsername(e.target.value)}
                            maxLength={100}
                            required
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="phone">{t('profile.phoneOptional')}</Label>
                          <Input 
                            id="phone" 
                            type="tel"
                            placeholder="+1 234 567 8900"
                            value={newPhoneNumber} 
                            onChange={(e) => setNewPhoneNumber(e.target.value)}
                            maxLength={20}
                          />
                          <p className="text-xs text-muted-foreground">
                            {t('profile.phoneVisible')}
                          </p>
                        </div>
                        <LocationInput
                          city={newCity}
                          latitude={newLatitude}
                          longitude={newLongitude}
                          onLocationChange={handleLocationChange}
                        />
                      </div>
                      <DialogFooter>
                        <Button onClick={handleUpdateProfile} disabled={isUpdating}>
                          {isUpdating ? t('common.saving') : t('profile.saveChanges')}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                ) : user ? (
                  <Button 
                    className="w-full gap-2" 
                    onClick={handleSendMessage}
                  >
                    <MessageSquare className="h-4 w-4" />
                    {t('profile.sendMessage')}
                  </Button>
                ) : null}
              </div>
            </div>
          </div>

          {/* Main Content Section */}
          <div className="md:col-span-3 space-y-8">
            {/* User Ratings Section */}
            <UserRatings userId={id!} isOwnProfile={!!isOwnProfile} />

            {/* Books Section */}
            <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold">{t('profile.booksBy', { username: profileUser.username })}</h3>
              {isOwnProfile && (
                <Link to="/books/add">
                  <Button variant="outline" className="gap-1">
                    <Edit className="h-4 w-4" />
                    {t('books.addBook')}
                  </Button>
                </Link>
              )}
            </div>
            
              {userBooks.length > 0 ? (
                <BookGrid books={userBooks} />
              ) : (
                <div className="flex items-center justify-center h-64">
                  <p className="text-muted-foreground">
                    {isOwnProfile ? t('profile.youNoBooksYet') : t('profile.noBooksYet', { name: profileUser.username })}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-background border-t mt-auto py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-muted-foreground">
            {t('common.copyright', { year: new Date().getFullYear() })}
          </p>
        </div>
      </footer>

      {/* Cropping Dialog */}
      <Dialog open={cropDialogOpen} onOpenChange={setCropDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('profile.cropImage') || 'Crop Profile Picture'}</DialogTitle>
            <DialogDescription>
              {t('profile.cropDescription') || 'Adjust your picture to fit the square frame.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-4 bg-muted p-1 rounded-md overflow-hidden flex items-center justify-center min-h-[300px]">
            {imageToCrop && (
              <Cropper
                src={imageToCrop}
                style={{ height: 400, width: '100%' }}
                initialAspectRatio={1}
                aspectRatio={1}
                guides={true}
                ref={cropperRef}
                viewMode={1}
                dragMode="move"
                scalable={true}
                cropBoxMovable={true}
                cropBoxResizable={true}
                background={false}
                responsive={true}
                autoCropArea={1}
                checkOrientation={false}
              />
            )}
          </div>
          
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setCropDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleCropSave} disabled={isUpdating}>
              {isUpdating ? t('common.saving') : (t('profile.saveCropped') || 'Crop & Save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProfilePage;
