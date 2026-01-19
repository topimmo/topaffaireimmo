import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default function Register() {
  const { signUp } = useAuth()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    phone: '',
    companyName: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    const { error: signUpError } = await signUp(
      formData.email,
      formData.password,
      formData.fullName,
      formData.phone,
      'real_estate_advertiser', // أو commercial_advertiser
      formData.companyName
    )

    if (signUpError) setError(signUpError.message)
    else setSuccess(true)

    setLoading(false)
  }

  if (success) return <p>✅ Check your email for confirmation link</p>

  return (
    <form onSubmit={handleSubmit}>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <Input name="fullName" placeholder="Full Name" onChange={handleChange} required />
      <Input name="email" placeholder="Email" type="email" onChange={handleChange} required />
      <Input name="phone" placeholder="Phone" onChange={handleChange} />
      <Input name="companyName" placeholder="Company Name" onChange={handleChange} />
      <Input name="password" placeholder="Password" type="password" onChange={handleChange} required />
      <Input name="confirmPassword" placeholder="Confirm Password" type="password" onChange={handleChange} required />
      <Button type="submit" disabled={loading}>{loading ? 'Loading...' : 'Register'}</Button>
    </form>
  )
}
