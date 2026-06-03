import CameraAltOutlinedIcon from '@mui/icons-material/CameraAltOutlined'
import { Avatar, Box, CircularProgress, Typography } from '@mui/material'
import { useRef, useState } from 'react'
import { resolveProfilePicUrl } from '../../config/api'
import { useUploadProfileAvatarMutation } from '../../store/api/medcoinAdminApi'
import { useAppDispatch } from '../../store/hooks'
import { setUser } from '../../store/slices/authSlice'
import { getErrorMessage } from '../../utils/errorMessage'

type ProfileAvatarUploadProps = {
  name?: string
  email?: string
  profilePic?: string
  onPreviewChange?: (url: string) => void
  size?: number
}

function userInitial(name?: string, email?: string) {
  const n = String(name || '').trim()
  if (n) return n.charAt(0).toUpperCase()
  const e = String(email || '').trim()
  if (e) return e.charAt(0).toUpperCase()
  return 'A'
}

export default function ProfileAvatarUpload({
  name,
  email,
  profilePic,
  onPreviewChange,
  size = 112,
}: ProfileAvatarUploadProps) {
  const dispatch = useAppDispatch()
  const inputRef = useRef<HTMLInputElement>(null)
  const [localPreview, setLocalPreview] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState('')
  const [uploadAvatar, { isLoading }] = useUploadProfileAvatarMutation()

  const displaySrc = localPreview || resolveProfilePicUrl(profilePic)

  async function handleFile(file: File) {
    setUploadError('')
    if (!file.type.startsWith('image/')) {
      setUploadError('Please choose an image file.')
      return
    }
    if (file.size > 3 * 1024 * 1024) {
      setUploadError('Image must be 3 MB or smaller.')
      return
    }

    const preview = URL.createObjectURL(file)
    setLocalPreview(preview)
    onPreviewChange?.(preview)

    try {
      const result = await uploadAvatar(file).unwrap()
      dispatch(setUser(result.user))
      onPreviewChange?.(resolveProfilePicUrl(result.user.profilePic) || '')
      setLocalPreview(null)
      URL.revokeObjectURL(preview)
    } catch (err) {
      setLocalPreview(null)
      URL.revokeObjectURL(preview)
      setUploadError(getErrorMessage(err))
    }
  }

  return (
    <Box sx={{ textAlign: 'center' }}>
      <Box
        component="button"
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={isLoading}
        aria-label="Upload profile photo"
        sx={{
          position: 'relative',
          display: 'inline-flex',
          border: 0,
          p: 0,
          bgcolor: 'transparent',
          cursor: isLoading ? 'wait' : 'pointer',
          borderRadius: '50%',
          '&:hover .avatar-ring': {
            boxShadow: '0 0 0 4px rgba(15, 39, 68, 0.15)',
          },
        }}
      >
        <Avatar
          src={displaySrc}
          className="avatar-ring"
          sx={{
            width: size,
            height: size,
            bgcolor: '#ea580c',
            fontSize: size * 0.38,
            fontWeight: 700,
            border: '4px solid #fff',
            boxShadow: '0 4px 20px rgba(15,39,68,0.12)',
            transition: 'box-shadow 0.2s',
          }}
        >
          {userInitial(name, email)}
        </Avatar>

        <Box
          sx={{
            position: 'absolute',
            right: 4,
            bottom: 4,
            width: 36,
            height: 36,
            borderRadius: '50%',
            bgcolor: '#0f2744',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid #fff',
            boxShadow: 1,
          }}
        >
          {isLoading ? (
            <CircularProgress size={18} sx={{ color: '#fff' }} />
          ) : (
            <CameraAltOutlinedIcon sx={{ fontSize: 18 }} />
          )}
        </Box>
      </Box>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) void handleFile(file)
          e.target.value = ''
        }}
      />

      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5 }}>
        Click photo to upload · JPG, PNG or WebP · max 3 MB
      </Typography>

      {uploadError ? (
        <Typography variant="caption" color="error" sx={{ display: 'block', mt: 0.5 }}>
          {uploadError}
        </Typography>
      ) : null}
    </Box>
  )
}
