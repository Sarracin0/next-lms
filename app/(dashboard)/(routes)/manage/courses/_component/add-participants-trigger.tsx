'use client'

import { useState } from 'react'
import { UserPlus } from 'lucide-react'
import { DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { AddParticipantsModal } from './add-participants-modal'

interface AddParticipantsTriggerProps {
  courseId: string
}

export function AddParticipantsTrigger({ courseId }: AddParticipantsTriggerProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleSuccess = () => {
    setIsOpen(false)
    // Optionally refresh the page or update the data
    window.location.reload()
  }

  return (
    <>
      <DropdownMenuItem onSelect={(e) => {
        e.preventDefault()
        setIsOpen(true)
      }}>
        <UserPlus className="mr-2 h-4 w-4" />
        Aggiungi Partecipanti
      </DropdownMenuItem>
      
      <AddParticipantsModal
        courseId={courseId}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSuccess={handleSuccess}
      />
    </>
  )
}