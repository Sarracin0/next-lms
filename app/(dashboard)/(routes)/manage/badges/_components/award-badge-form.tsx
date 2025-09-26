'use client'

import axios from 'axios'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import toast from 'react-hot-toast'

import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

type AwardBadgeFormProps = {
  badgeId: string
  members: { id: string; userId: string }[]
}

export const AwardBadgeForm = ({ badgeId, members }: AwardBadgeFormProps) => {
  const router = useRouter()
  const [selectedMember, setSelectedMember] = useState('')
  const [context, setContext] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const onSubmit = async () => {
    if (!selectedMember) return
    try {
      setIsSubmitting(true)
      await axios.post(`/api/badges/${badgeId}/award`, {
        userProfileId: selectedMember,
        context,
      })
      toast.success('Badge awarded')
      setSelectedMember('')
      setContext('')
      router.refresh()
    } catch {
      toast.error('Unable to award badge')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-2">
      <Select value={selectedMember} onValueChange={setSelectedMember} disabled={isSubmitting}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select a learner" />
        </SelectTrigger>
        <SelectContent>
          {members.map((member) => (
            <SelectItem key={member.id} value={member.id}>
              {member.userId}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Textarea
        value={context}
        onChange={(event) => setContext(event.target.value)}
        rows={3}
        placeholder="Why is this badge awarded?"
        disabled={isSubmitting}
      />
      <Button onClick={onSubmit} disabled={!selectedMember || isSubmitting}>
        Award badge
      </Button>
    </div>
  )
}
